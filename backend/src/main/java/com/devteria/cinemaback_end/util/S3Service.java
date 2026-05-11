package com.devteria.cinemaback_end.util;

import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class S3Service {

    final S3Client s3Client;
    final S3Presigner s3Presigner; // 🔥 BỔ SUNG BEAN NÀY ĐỂ TẠO LINK BẢO MẬT

    @Value("${aws.bucket.name}")
    String bucketName;

    @Value("${cloud.aws.region.static}")
    String region;

    // Hằng số giới hạn dung lượng file (5MB)
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    /**
     * Upload file to S3
     */
    public String uploadFile(MultipartFile file, String folder) {
        // Validation chuẩn của bạn
        if (file.isEmpty() || file.getContentType() == null) {
            throw new AppException(ErrorCode.FILE_IS_EMPTY);
        }
        if (!file.getContentType().startsWith("image/")) {
            throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(ErrorCode.FILE_TOO_LARGE);
        }

        try {
            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "image.jpg";
            originalName = originalName.replaceAll("\\s+", "_"); // Bỏ khoảng trắng
            String safeFilename = UUID.randomUUID() + "_" + originalName;
            String key = folder + "/" + safeFilename;

            byte[] fileBytes = file.getBytes();

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(fileBytes));

            log.info("File uploaded successfully: {} to bucket: {}", key, bucketName);
            return key;

        } catch (IOException e) {
            log.error("Error reading file bytes: {}", file.getOriginalFilename(), e);
            throw new AppException(ErrorCode.UPLOAD_FILE_FAILED);
        } catch (Exception e) {
            log.error("Error uploading file to S3: {}", file.getOriginalFilename(), e);
            throw new AppException(ErrorCode.UPLOAD_FILE_FAILED);
        }
    }

    /**
     * Delete file from S3
     */
    public void deleteFile(String key) {
        try {
            DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteObjectRequest);
            log.info("File deleted successfully: {} from bucket: {}", key, bucketName);

        } catch (Exception e) {
            log.error("Error deleting file from S3: {}", key, e);
            throw new AppException(ErrorCode.DELETE_FILE_FAILED);
        }
    }

    /**
     * Build absolute static S3 URL (Dành cho bucket Public)
     */
    public String buildS3Url(String key) {
        if (key == null || key.isEmpty()) {
            return null;
        }

        // 🔥 BỔ SUNG ĐOẠN NÀY:
        // Nếu database đang lưu sẵn một link web ngoài (bắt đầu bằng http), thì giữ nguyên không nối S3 nữa!
        if (key.startsWith("http://") || key.startsWith("https://")) {
            return key;
        }

        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);
    }

    /**
     * 🔥 HÀM MỚI: Tạo URL có chữ ký bảo mật (Presigned URL)
     * Frontend sẽ dùng link này để hiển thị ảnh từ Bucket Private.
     */
    public String generatePresignedUrl(String key, Duration expiration) {
        if (key == null || key.isEmpty()) {
            return null;
        }

        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(expiration)
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
            return presignedRequest.url().toString();

        } catch (Exception e) {
            log.error("Error generating pre-signed URL for key: {}", key, e);
            // Fallback: Nếu lỗi tạo link bảo mật, trả về link tĩnh bình thường
            return buildS3Url(key);
        }
    }
}
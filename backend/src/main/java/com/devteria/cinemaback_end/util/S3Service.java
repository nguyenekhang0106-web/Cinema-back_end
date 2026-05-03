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

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class S3Service {

    final S3Client s3Client;

    @Value("${aws.bucket.name}")
    String bucketName;

    @Value("${cloud.aws.region.static}")
    String region;

    // Hằng số giới hạn dung lượng file (5MB)
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    /**
     * Upload file to S3
     * @param file MultipartFile to upload
     * @param folder Folder path (e.g., "avatar")
     * @return Full S3 key (e.g., "avatar/123-abc_user1Avatar.jpg")
     */
    public String uploadFile(MultipartFile file, String folder) {

        // 🔥 Ném lỗi bằng AppException chuẩn của hệ thống
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

            // 🔥 ĐÃ XÓA DÒNG .acl(...) THEO ĐÚNG CẤU HÌNH CỦA TEAM
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
     * @param key S3 object key (e.g., "avatar/user1Avatar.jpg")
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
     * Build absolute S3 URL for a given key
     * @param key S3 object key
     * @return Full URL
     */
    public String buildS3Url(String key) {
        if (key == null || key.isEmpty()) {
            return null;
        }
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);
    }
}
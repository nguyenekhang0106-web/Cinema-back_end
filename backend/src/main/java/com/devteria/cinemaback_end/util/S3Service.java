package com.devteria.cinemaback_end.util;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.io.IOException;

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

    /**
     * Upload file to S3
     * @param file MultipartFile to upload
     * @param folder Folder path (e.g., "avatar")
     * @param filename File name (e.g., "user1Avatar.jpg")
     * @return Full S3 key (e.g., "avatar/user1Avatar.jpg")
     */
    public String uploadFile(MultipartFile file, String folder, String filename) {
        try {
            String key = folder + "/" + filename;

            byte[] fileBytes = file.getBytes();

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            PutObjectResponse response = s3Client.putObject(putObjectRequest,
                    RequestBody.fromBytes(fileBytes));

            log.info("File uploaded successfully: {} to bucket: {}", key, bucketName);
            return key;

        } catch (IOException e) {
            log.error("Error reading file bytes: {}", file.getOriginalFilename(), e);
            throw new RuntimeException("Failed to upload file: " + file.getOriginalFilename(), e);
        } catch (Exception e) {
            log.error("Error uploading file to S3: {}", file.getOriginalFilename(), e);
            throw new RuntimeException("Failed to upload file to S3: " + file.getOriginalFilename(), e);
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

            DeleteObjectResponse response = s3Client.deleteObject(deleteObjectRequest);

            log.info("File deleted successfully: {} from bucket: {}", key, bucketName);

        } catch (Exception e) {
            log.error("Error deleting file from S3: {}", key, e);
            throw new RuntimeException("Failed to delete file from S3: " + key, e);
        }
    }

    /**
     * Build absolute S3 URL for a given key
     * @param key S3 object key
     * @return Full URL (e.g., https://cinemapbl3.s3.ap-southeast-2.amazonaws.com/avatar/user1Avatar.jpg)
     */
    public String buildS3Url(String key) {
        if (key == null || key.isEmpty()) {
            return null;
        }
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);
    }
}

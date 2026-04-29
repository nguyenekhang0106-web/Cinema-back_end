package com.devteria.cinemaback_end.user.service;

import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.user.dto.AvatarUploadRequest;
import com.devteria.cinemaback_end.user.dto.UserResponse;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.mapper.UserMapper;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import com.devteria.cinemaback_end.util.S3Service;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AvatarService {

    UserRepository userRepository;
    S3Service s3Service;
    UserMapper userMapper;

    private static final String DEFAULT_AVATAR = "avatar/DefaultAvatar.png";

    /**
     * Upload avatar for user
     * @param userId User ID
     * @param request Avatar upload request containing file, folder, filename
     * @return Absolute S3 URL of new avatar
     */
    @Transactional
    public String uploadAvatar(String userId, AvatarUploadRequest request) {
        // 1. Tìm user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        String oldAvatarKey = user.getAvatarUrl();

        // 2. TỰ CHUẨN HÓA (Không phụ thuộc vào request.getFolder() và request.getFilename())
        String folder = "avatar"; // Luôn luôn là avatar

        // Lấy đuôi file gốc (ví dụ .jpg, .png) từ file upload
        String originalName = request.getFile().getOriginalFilename();
        String extension = "jpg"; // Mặc định là jpg nếu không lấy được đuôi
        if (originalName != null && originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf(".") + 1);
        }

        // Tự sinh tên file chuẩn: user_uuid_Avatar.jpg
        String fixedFilename = "user" + userId + "Avatar." + extension;

        // 3. Upload với thông tin đã được Backend chuẩn hóa
        String newAvatarKey = s3Service.uploadFile(request.getFile(), folder, fixedFilename);

        // 4. Cập nhật DB
        user.setAvatarUrl(newAvatarKey);
        userRepository.save(user);

        log.info("Avatar uploaded for user: {}, new key: {}", userId, newAvatarKey);

        // 5. Xóa ảnh cũ (Dọn rác)
        if (oldAvatarKey != null && !oldAvatarKey.isEmpty() && !oldAvatarKey.equals(DEFAULT_AVATAR)) {
            // Chỉ xóa nếu ảnh cũ KHÁC với ảnh mới vừa up (tránh trường hợp cùng tên file)
            if (!oldAvatarKey.equals(newAvatarKey)) {
                try {
                    s3Service.deleteFile(oldAvatarKey);
                    log.info("Old avatar deleted: {}", oldAvatarKey);
                } catch (Exception e) {
                    log.warn("Failed to delete old avatar: {}", oldAvatarKey);
                }
            }
        }

        return s3Service.buildS3Url(newAvatarKey);
    }
    /**
     * Get user profile with absolute avatar URL
     * @param userId User ID
     * @return UserResponse with absolute S3 URL
     */
    public UserResponse getUserProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return buildUserResponseWithAbsoluteUrl(user);
    }

    /**
     * Build UserResponse with absolute avatar URL
     * @param user User entity
     * @return UserResponse with absolute S3 URL
     */
    public UserResponse buildUserResponseWithAbsoluteUrl(User user) {
        UserResponse response = userMapper.toUserResponse(user);
        String absoluteAvatarUrl = s3Service.buildS3Url(user.getAvatarUrl());
        response.setAvatarUrl(absoluteAvatarUrl);
        return response;
    }
}

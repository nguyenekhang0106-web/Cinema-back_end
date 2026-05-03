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
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AvatarService {

    UserRepository userRepository;
    S3Service s3Service;
    UserMapper userMapper;

    // 🔥 CẢI TIẾN 3 & 4: Hằng số rõ ràng, dễ bảo trì
    private static final String AVATAR_FOLDER = "avatar";
    private static final String DEFAULT_AVATAR_KEY = "avatar/DefaultAvatar.png";

    /**
     * Upload avatar for user
     */
    @Transactional
    public String uploadAvatar(String userId, AvatarUploadRequest request) {
        // 1. Tìm user (Dùng hàm dùng chung)
        User user = getUser(userId);
        String oldAvatarKey = user.getAvatarUrl();

        // 2. Upload file mới lên S3 (Validate file đã được S3Service lo)
        String newAvatarKey = s3Service.uploadFile(request.getFile(), AVATAR_FOLDER);

        // 3. Cập nhật DB
        user.setAvatarUrl(newAvatarKey);
        userRepository.save(user);

        // 🔥 CẢI TIẾN 6: Log rõ ràng hơn
        log.info("User {} updated avatar from [{}] to [{}]", userId, oldAvatarKey, newAvatarKey);

        // 4. Xóa ảnh cũ an toàn với TransactionSynchronization
        if (oldAvatarKey != null && !oldAvatarKey.isBlank() && !oldAvatarKey.equals(DEFAULT_AVATAR_KEY) && !oldAvatarKey.equals(newAvatarKey)) {

            // 🔥 CẢI TIẾN 1: DB commit thành công 100% thì S3 mới được phép xóa ảnh cũ
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    try {
                        s3Service.deleteFile(oldAvatarKey);
                        log.info("Old avatar deleted successfully from S3: {}", oldAvatarKey);
                    } catch (Exception e) {
                        // Chỉ cảnh báo, không làm crash luồng chính vì DB đã lưu ảnh mới rồi
                        log.warn("Failed to delete old avatar from S3 (Orphan file alert): {}", oldAvatarKey, e);
                    }
                }
            });
        }

        return s3Service.buildS3Url(newAvatarKey);
    }

    /**
     * Get user profile with absolute avatar URL
     */
    public UserResponse getUserProfile(String userId) {
        User user = getUser(userId);
        return buildUserResponseWithAbsoluteUrl(user);
    }

    /**
     * Build UserResponse with absolute avatar URL
     */
    public UserResponse buildUserResponseWithAbsoluteUrl(User user) {
        UserResponse response = userMapper.toUserResponse(user);

        // 🔥 CẢI TIẾN 8: Fallback mượt mà nếu user chưa có avatar
        String key = (user.getAvatarUrl() != null && !user.getAvatarUrl().isBlank())
                ? user.getAvatarUrl()
                : DEFAULT_AVATAR_KEY;

        String absoluteAvatarUrl = s3Service.buildS3Url(key);
        response.setAvatarUrl(absoluteAvatarUrl);

        return response;
    }

    // 🔥 CẢI TIẾN 7: Tách hàm lấy User để Clean Code
    private User getUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }
}
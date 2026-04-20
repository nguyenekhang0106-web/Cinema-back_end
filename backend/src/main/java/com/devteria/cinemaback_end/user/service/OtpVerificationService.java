package com.devteria.cinemaback_end.user.service;

import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.common.SecurityUtils;
import com.devteria.cinemaback_end.user.dto.OtpResponse;
import com.devteria.cinemaback_end.user.dto.UserResponse;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.mapper.UserMapper;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import com.devteria.cinemaback_end.common.ApiResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class OtpVerificationService {

    UserRepository userRepository;
    RegistrationOtpService registrationOtpService;
    UserMapper userMapper;

    /**
     * Verify OTP and activate user email
     *
     * @param email Email address
     * @param otpCode 6-digit OTP code
     * @return User response with success message
     */
    @Transactional
    public ApiResponse<UserResponse> verifyOtp(String email, String otpCode) {
        String normalizedEmail = normalize(email);

        try {
            // STEP 1: Verify OTP (handles all checks: expiry, attempts, blocking)
            registrationOtpService.verifyOtp(email, otpCode);

            // STEP 2: Find user and update emailVerified
            User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> {
                    log.error("User not found after OTP verification: {}", normalizedEmail);
                    return new AppException(ErrorCode.USER_NOT_EXISTED,
                        "Không tìm thấy người dùng");
                });

            // STEP 3: Update emailVerified
            if (user.isEmailVerified()) {
                // Email already verified in previous attempt
                return ApiResponse.<UserResponse>builder()
                    .code(1000)
                    .message("Email đã được xác thực trước đó")
                    .result(userMapper.toUserResponse(user))
                    .build();
            }

            user.setEmailVerified(true);
            userRepository.save(user);
            log.info("Email verified successfully for: {} [hash: {}]", normalizedEmail, SecurityUtils.hashSensitiveData(normalizedEmail));

            return ApiResponse.<UserResponse>builder()
                .code(1000)
                .message("Xác thực email thành công. Bạn có thể đăng nhập")
                .result(userMapper.toUserResponse(user))
                .build();

        } catch (AppException e) {
            // OTP verification failed - check if registration expired
            if (e.getErrorCode() == ErrorCode.REGISTRATION_EXPIRED) {
                // Delete user from DB if registration window expired
                deleteUnverifiedUserOnExpiry(normalizedEmail);
            }
            throw e;
        } catch (Exception e) {
            log.error("OTP verification failed for: {} [hash: {}]", normalizedEmail, SecurityUtils.hashSensitiveData(normalizedEmail), e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION,
                "Lỗi khi xác thực OTP. Vui lòng thử lại");
        }
    }

    /**
     * Resend OTP (extends registration window and resets attempts)
     *
     * @param email Email address
     * @return OTP response with resend cooldown info
     */
    public ApiResponse<OtpResponse> resendOtp(String email) {
        String normalizedEmail = normalize(email);

        try {
            // Find user and check if already verified
            User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED,
                    "Không tìm thấy người dùng"));

            if (user.isEmailVerified()) {
                OtpResponse response = OtpResponse.builder()
                    .message("Email đã được xác thực trước đó")
                    .build();
                
                return ApiResponse.<OtpResponse>builder()
                    .code(1000)
                    .message("Email đã được xác thực trước đó")
                    .result(response)
                    .build();
            }

            // Send OTP (handles rate limiting and blocking)
            registrationOtpService.sendOtp(email, user.getFullName());

            long resendCooldown = registrationOtpService.getResendCooldownRemaining(email);
            long registrationRemaining = registrationOtpService.getRegistrationTimeRemaining(email);

            OtpResponse response = OtpResponse.builder()
                .message("Mã OTP mới đã được gửi")
                .remainingAttempts(3)
                .resendCooldownSeconds(resendCooldown)
                .registrationExpiryMinutes(registrationRemaining)
                .build();

            return ApiResponse.<OtpResponse>builder()
                .code(1000)
                .message("Mã OTP mới đã được gửi")
                .result(response)
                .build();

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Resend OTP failed for: {} [hash: {}]", normalizedEmail, SecurityUtils.hashSensitiveData(normalizedEmail), e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION,
                "Lỗi khi gửi lại OTP. Vui lòng thử lại");
        }
    }

    /**
     * Delete unverified user when registration window expires
     * This is called during OTP verification if registration:{email} key is missing
     */
    @Transactional
    private void deleteUnverifiedUserOnExpiry(String email) {
        try {
            userRepository.findByEmail(email).ifPresent(user -> {
                if (!user.isEmailVerified()) {
                    userRepository.delete(user);
                    log.info("Deleted unverified user due to registration expiry: {}", email);
                }
            });
        } catch (Exception e) {
            log.error("Failed to delete unverified user: {} [hash: {}]", email, SecurityUtils.hashSensitiveData(email), e);
            // Don't throw, just log
        }
    }

    /**
     * Normalize email
     */
    private String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}

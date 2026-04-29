package com.devteria.cinemaback_end.user.service;

import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.common.SecurityUtils;
import com.devteria.cinemaback_end.user.dto.UserRequest;
import com.devteria.cinemaback_end.user.dto.UserResponse;
import com.devteria.cinemaback_end.user.dto.OtpResponse;
import com.devteria.cinemaback_end.user.entity.Role;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.entity.enums.RoleName;
import com.devteria.cinemaback_end.user.mapper.UserMapper;
import com.devteria.cinemaback_end.user.repository.RoleRepository;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import com.devteria.cinemaback_end.common.ApiResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class RegistrationService {

    UserRepository userRepository;
    RoleRepository roleRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    RegistrationOtpService registrationOtpService;

    /**
     * Register new user with OTP verification
     * Phase 1: Create user in DB (emailVerified = false)
     * Phase 2: Send OTP via email
     *
     * @param request User registration request
     * @return OTP response with resend cooldown info
     */
    @Transactional
    public ApiResponse<OtpResponse> register(UserRequest request) {
        String normalizedEmail = normalize(request.getEmail());
        User user = null;
        try {
            // CHECK 1: Email already verified?
            Optional<User> existingUser = userRepository.findByEmail(normalizedEmail);
            if (existingUser.isPresent() && existingUser.get().isEmailVerified()) {
                throw new AppException(ErrorCode.EMAIL_EXISTED,
                    "Email này đã được sử dụng");
            }

            // If user exists but not verified, delete old record
            if (existingUser.isPresent() && !existingUser.get().isEmailVerified()) {
                userRepository.delete(existingUser.get());
                log.info("Deleted unverified user: {} [hash: {}]", normalizedEmail, SecurityUtils.hashSensitiveData(normalizedEmail));
            }

            // STEP 1: Create new user (emailVerified = false)
            user = userMapper.toUser(request);
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setEmailVerified(false);
            user.setAvatarUrl("avatar/DefaultAvatar.png"); // Set default avatar on registration

            HashSet<Role> roles = new HashSet<>();
            roleRepository.findByName(RoleName.USER).ifPresent(roles::add);
            user.setRoles(roles);

            user = userRepository.save(user);
            log.info("New user created: {} [hash: {}]", normalizedEmail, SecurityUtils.hashSensitiveData(normalizedEmail));

            // STEP 2: Send OTP (handles rate limiting & blocking)
            registrationOtpService.sendOtp(request.getEmail(), user.getFullName());

            // Build response
            OtpResponse otpResponse = OtpResponse.builder()
                .message("Mã OTP đã được gửi đến email của bạn. Vui lòng nhập để xác thực.")
                .remainingAttempts(3)
                .resendCooldownSeconds(0L)
                .registrationExpiryMinutes(7L * 24 * 60) // 7 days
                .build();

            return ApiResponse.<OtpResponse>builder()
                .code(1000)
                .message("Đăng kí thành công. Vui lòng nhập mã OTP")
                .result(otpResponse)
                .build();

        } catch (DataIntegrityViolationException e) {
            String message = e.getMessage();
            if (message != null && message.contains("email")) {
                throw new AppException(ErrorCode.EMAIL_EXISTED,
                    "Email này đã được sử dụng");
            } else if (message != null && message.contains("phone")) {
                throw new AppException(ErrorCode.PHONE_EXISTED,
                    "Số điện thoại này đã được sử dụng");
            } else if (message != null && message.contains("citizen_id")) {
                throw new AppException(ErrorCode.CITIZEN_ID_EXISTED,
                    "CCCD này đã được sử dụng");
            }
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION,
                "Lỗi khi đăng kí. Vui lòng thử lại");
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Registration failed for: {}", normalizedEmail, e);

            // 🔥 cleanup an toàn
            if (user != null && user.getId() != null) {
                userRepository.delete(user);
            }
            registrationOtpService.cleanupOtpKeys(normalizedEmail);

            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION,
                    "Lỗi hệ thống. Vui lòng thử lại");
        }
    }

    /**
     * Delete unverified user (called when registration window expires)
     *
     * @param email Email address
     */
    @Transactional
    public void deleteUnverifiedUser(String email) {
        String normalizedEmail = normalize(email);
        userRepository.findByEmail(normalizedEmail).ifPresent(user -> {
            if (!user.isEmailVerified()) {
                userRepository.delete(user);
                log.info("Deleted unverified user due to registration expiry: {} [hash: {}]", normalizedEmail, SecurityUtils.hashSensitiveData(normalizedEmail));
            }
        });
    }

    /**
     * Normalize email
     */
    private String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}

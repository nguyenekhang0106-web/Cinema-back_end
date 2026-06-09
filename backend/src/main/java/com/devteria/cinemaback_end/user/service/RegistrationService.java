package com.devteria.cinemaback_end.user.service;

import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.common.SecurityUtils;
import com.devteria.cinemaback_end.user.dto.UserRequest;
import com.devteria.cinemaback_end.user.dto.OtpResponse;
import com.devteria.cinemaback_end.user.entity.Role;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.entity.enums.RoleName;
import com.devteria.cinemaback_end.user.mapper.UserMapper;
import com.devteria.cinemaback_end.user.repository.RoleRepository;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.text.StringEscapeUtils;
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

    // 🔥 ĐỒNG BỘ: Dùng hằng số cho Avatar mặc định
    private static final String DEFAULT_AVATAR_KEY = "avatar/DefaultAvatar.png";

    /**
     * Register new user with OTP verification
     * Phase 1: Create user in DB (emailVerified = false)
     * Phase 2: Send OTP via email
     */
    @Transactional
    public OtpResponse register(UserRequest request) {
        String normalizedEmail = normalize(request.getEmail());

        // BƯỚC 1: KIỂM TRA EMAIL ĐÃ TỒN TẠI HAY CHƯA
        Optional<User> existingUserOpt = userRepository.findByEmail(normalizedEmail);

        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();

            // 1.1 Nếu đã xác thực -> Chặn luôn, báo lỗi đã tồn tại
            if (existingUser.isEmailVerified()) {
                throw new AppException(ErrorCode.EMAIL_EXISTED);
            }

            // 1.2 Nếu CHƯA xác thực -> Cập nhật thông tin mới nhất (nhỡ user đổi tên, Pass, số ĐT)
            if (request.getPhone() != null
                    && !request.getPhone().equals(existingUser.getPhone())
                    && userRepository.existsByPhone(request.getPhone())) {
                throw new AppException(ErrorCode.PHONE_EXISTED);
            }
            if (request.getCitizenIdNumber() != null
                    && !request.getCitizenIdNumber().equals(existingUser.getCitizenIdNumber())
                    && userRepository.existsByCitizenIdNumber(request.getCitizenIdNumber())) {
                throw new AppException(ErrorCode.CITIZEN_ID_EXISTED);
            }

            existingUser.setFullName(request.getFullName());
            existingUser.setPhone(request.getPhone());
            existingUser.setPassword(passwordEncoder.encode(request.getPassword()));
            if(request.getCitizenIdNumber() != null) {
                existingUser.setCitizenIdNumber(request.getCitizenIdNumber());
            }
            userRepository.save(existingUser);
            log.info("Updated unverified user info: {}", normalizedEmail);

            // 1.3 Kiểm tra xem OTP cũ còn hạn chống Spam không
            long cooldown = registrationOtpService.getResendCooldownRemaining(normalizedEmail);

            if (cooldown > 0) {
                // OTP vẫn còn hạn đếm ngược -> Báo FE chuyển sang form OTP, tiếp tục chạy đồng hồ
                return OtpResponse.builder()
                        .message("Mã OTP đã được gửi trước đó. Vui lòng kiểm tra email!")
                        .resendCooldownSeconds(cooldown) // Trả về số giây còn lại
                        .remainingAttempts(3)
                        .registrationExpiryMinutes(7L * 24 * 60)
                        .build();
            } else {
                // Đã hết thời gian chờ -> Coi như Resend OTP, gửi lại mã mới
                registrationOtpService.sendOtp(normalizedEmail, existingUser.getFullName());
                return OtpResponse.builder()
                        .message("Mã OTP mới đã được gửi đến email của bạn.")
                        .resendCooldownSeconds(300L) // Cooldown 5 phút theo cấu hình của bạn
                        .remainingAttempts(3)
                        .registrationExpiryMinutes(7L * 24 * 60)
                        .build();
            }
        }

        // BƯỚC 2: TRƯỜNG HỢP USER MỚI HOÀN TOÀN
        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone())) {
            throw new AppException(ErrorCode.PHONE_EXISTED);
        }
        if (request.getCitizenIdNumber() != null && userRepository.existsByCitizenIdNumber(request.getCitizenIdNumber())) {
            throw new AppException(ErrorCode.CITIZEN_ID_EXISTED);
        }

        try {
            // Khởi tạo User mới
            User user = userMapper.toUser(request);
            user.setEmail(normalizedEmail);
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setEmailVerified(false);
            user.setAvatarUrl(DEFAULT_AVATAR_KEY);

            HashSet<Role> roles = new HashSet<>();
            roleRepository.findByName(RoleName.USER).ifPresent(roles::add);
            user.setRoles(roles);

            userRepository.save(user);
            log.info("New user created: {} [hash: {}]", normalizedEmail, SecurityUtils.hashSensitiveData(normalizedEmail));

            // Gửi OTP lần đầu
            registrationOtpService.sendOtp(normalizedEmail, user.getFullName());

            return OtpResponse.builder()
                    .message("Mã OTP đã được gửi đến email của bạn. Vui lòng nhập để xác thực.")
                    .remainingAttempts(3)
                    .resendCooldownSeconds(300L) // Set cứng 300s (5 phút) cho lần gửi đầu tiên
                    .registrationExpiryMinutes(7L * 24 * 60)
                    .build();

        } catch (DataIntegrityViolationException e) {
            String message = e.getMessage();
            if (message != null && message.contains("email")) {
                throw new AppException(ErrorCode.EMAIL_EXISTED);
            } else if (message != null && message.contains("phone")) {
                throw new AppException(ErrorCode.PHONE_EXISTED);
            } else if (message != null && message.contains("citizen_id")) {
                throw new AppException(ErrorCode.CITIZEN_ID_EXISTED);
            }
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Registration failed for: {}", normalizedEmail, e);
            registrationOtpService.cleanupOtpKeys(normalizedEmail);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION, "Đăng ký thất bại");
        }
    }

    /**
     * Delete unverified user (called when registration window expires)
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

    private String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
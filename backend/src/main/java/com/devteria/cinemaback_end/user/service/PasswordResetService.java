package com.devteria.cinemaback_end.user.service;

import com.devteria.cinemaback_end.common.SecurityUtils;
import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.user.dto.ForgotPasswordRequest;
import com.devteria.cinemaback_end.user.dto.ResetPasswordRequest;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PasswordResetService {

    UserRepository userRepository;
    StringRedisTemplate redisTemplate;
    PasswordEncoder passwordEncoder;
    EmailSenderService emailSenderService;

    private static final String RESET_PASSWORD_PREFIX = "cinema:reset_pwd:";
    private static final Duration RESET_TOKEN_TTL = Duration.ofMinutes(15);
    private static final String RESET_PASSWORD_RATELIMIT_PREFIX = "cinema:reset_pwd:ratelimit:";
    private static final Duration RESET_PASSWORD_RATELIMIT_TTL = Duration.ofMinutes(1); // 1 phút

    public void requestPasswordReset(ForgotPasswordRequest request) {
        String email = request.getEmail();

        // 🔥 STEP 1: RATE LIMIT
        String rateKey = RESET_PASSWORD_RATELIMIT_PREFIX + email;

        if (redisTemplate.hasKey(rateKey)) {
            long remainingSeconds = redisTemplate.getExpire(rateKey);
            long remainingMinutes = (remainingSeconds + 59) / 60;

            throw new AppException(ErrorCode.TOO_MANY_REQUESTS,
                    String.format("Vui lòng chờ %d phút trước khi gửi lại yêu cầu", remainingMinutes));
        }

        // 👉 set rate limit
        redisTemplate.opsForValue().set(rateKey, "1", RESET_PASSWORD_RATELIMIT_TTL);
        
        // Kiểm tra User có tồn tại không
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Dùng SecurityUtils.generateSecureToken(32) để tạo ra một resetToken ngẫu nhiên, an toàn.
        String rawToken = SecurityUtils.generateSecureToken(32);
        
        // Băm cái resetToken này bằng SecurityUtils.hashSensitiveData(token).
        String hashedToken = SecurityUtils.hashSensitiveData(rawToken);
        String redisKey = RESET_PASSWORD_PREFIX + hashedToken;

        // Lưu vào Redis với Key là hashedToken, Value là email (set TTL khoảng 15 phút).
        redisTemplate.opsForValue().set(redisKey, email, RESET_TOKEN_TTL);

        log.info("Password reset token created for user: {} [hash: {}]",
                email,
                SecurityUtils.hashSensitiveData(email)
        );
        
        String resetLink = "http://localhost:9090/cinema/auth/reset-password?token=" + rawToken;
        emailSenderService.sendPasswordResetLink(email, resetLink);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String rawToken = request.getToken();
        String newPassword = request.getNewPassword();

        // Băm cái token đó bằng SecurityUtils.hashSensitiveData(token) để tạo thành Key.
        String hashedToken = SecurityUtils.hashSensitiveData(rawToken);
        String redisKey = RESET_PASSWORD_PREFIX + hashedToken;

        // Tìm Key này trong Redis. 
        String email = redisTemplate.opsForValue().get(redisKey);
        
        // Nếu không có -> Báo lỗi Token hết hạn hoặc không hợp lệ.
        if (email == null) {
            throw new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN);
        }

        // Nếu có -> Lấy ra email tương ứng.
        // Cập nhật mật khẩu mới cho User đó (nhớ mã hóa Bcrypt).
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Xóa Key khỏi Redis để token chỉ được dùng 1 lần.
        redisTemplate.delete(redisKey);

        log.info("Password reset successfully for user: {}", email);
    }
}

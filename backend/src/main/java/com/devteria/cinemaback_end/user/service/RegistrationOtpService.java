package com.devteria.cinemaback_end.user.service;

import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class RegistrationOtpService {

    // Redis key prefixes
    private static final String REGISTER_KEY_PREFIX = "cinema:register:";
    private static final String OTP_KEY_PREFIX = "cinema:otp:";
    private static final String OTP_SEND_COUNT_PREFIX = "cinema:otp_send_count:";
    private static final String OTP_RATELIMIT_PREFIX = "cinema:otp_ratelimit:";
    private static final String BLOCK_REGISTER_PREFIX = "cinema:block_register:";

    // TTL constants
    private static final Duration REGISTRATION_TTL = Duration.ofDays(7);        // 604800 seconds
    private static final Duration OTP_TTL = Duration.ofMinutes(10);             // 600 seconds
    private static final Duration SEND_COUNT_TTL = Duration.ofHours(24);        // 86400 seconds
    private static final Duration RATELIMIT_TTL = Duration.ofMinutes(5);        // 300 seconds
    private static final Duration BLOCK_TTL = Duration.ofHours(24);             // 86400 seconds

    // Constants
    private static final int MAX_OTP_SEND_COUNT = 5;
    private static final int MAX_OTP_ATTEMPTS = 3;

    StringRedisTemplate redisTemplate;
    EmailSenderService emailSenderService;

    /**
     * Generate 6-digit OTP
     */
    public String generateOtp() {
        return String.format("%06d", (int) (Math.random() * 1_000_000));
    }

    /**
     * Send OTP to email (check rate limiting & blocking)
     *
     * @param email Email address
     * @return OTP response with resend cooldown
     */
    public void sendOtp(String email) {
        String normalizedEmail = normalize(email);

        // CHECK 1: Is account blocked?
        if (redisTemplate.hasKey(BLOCK_REGISTER_PREFIX + normalizedEmail)) {
            long remainingSeconds = Objects.requireNonNull(
                redisTemplate.getExpire(BLOCK_REGISTER_PREFIX + normalizedEmail)
            );
            long remainingHours = (remainingSeconds + 3599) / 3600; // Round up
            throw new AppException(ErrorCode.REGISTRATION_BLOCKED,
                String.format("Tài khoản bị khóa. Vui lòng thử lại sau %d giờ", remainingHours));
        }

        // CHECK 2: Rate limiting - max 5 sends per 24h
        String sendCountKey = OTP_SEND_COUNT_PREFIX + normalizedEmail;
        Long sendCount = redisTemplate.opsForValue().increment(sendCountKey);

        if (sendCount == 1) {
            redisTemplate.expire(sendCountKey, SEND_COUNT_TTL);
        }

        if (sendCount > MAX_OTP_SEND_COUNT) {
            // Block this email for 24h
            redisTemplate.opsForValue().set(
                BLOCK_REGISTER_PREFIX + normalizedEmail, "1", BLOCK_TTL
            );
            throw new AppException(ErrorCode.OTP_SEND_LIMIT_EXCEEDED,
                "Bạn đã gửi OTP quá 5 lần trong 24 giờ. Vui lòng thử lại sau 24 giờ");
        }

        // CHECK 3: Resend cooldown - max 1 send per 5 minutes
        String rateLimitKey = OTP_RATELIMIT_PREFIX + normalizedEmail;
        if (redisTemplate.hasKey(rateLimitKey)) {
            long remainingSeconds = Objects.requireNonNull(
                redisTemplate.getExpire(rateLimitKey)
            );
            long remainingMinutes = (remainingSeconds + 59) / 60; // Round up
            throw new AppException(ErrorCode.OTP_RESEND_COOLDOWN,
                String.format("Vui lòng chờ %d phút trước khi gửi OTP tiếp theo", remainingMinutes));
        }

        // Generate OTP
        String otp = generateOtp();

        // Store in Redis with attempts counter
        String otpKey = OTP_KEY_PREFIX + normalizedEmail;
        String otpValue = otp + ":0"; // format: code:attempts
        redisTemplate.opsForValue().set(otpKey, otpValue, OTP_TTL);

        // Set resend cooldown
        redisTemplate.opsForValue().set(rateLimitKey, "1", RATELIMIT_TTL);

        // Create/Extend registration marker
        String registerKey = REGISTER_KEY_PREFIX + normalizedEmail;
        redisTemplate.opsForValue().set(registerKey, normalizedEmail, REGISTRATION_TTL);

        // Send email
        try {
            emailSenderService.sendVerificationCode(email, null, otp);
            log.info("OTP sent successfully to: {}", normalizedEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP to: {}", normalizedEmail, e);
            // Cleanup on failure
            redisTemplate.delete(otpKey, rateLimitKey);
            throw new AppException(ErrorCode.UNABLE_TO_SEND_EMAIL,
                "Không thể gửi email xác thực. Vui lòng thử lại");
        }
    }

    /**
     * Verify OTP code
     *
     * @param email Email address
     * @param otpCode 6-digit OTP code
     * @return true if OTP is correct
     */
    public boolean verifyOtp(String email, String otpCode) {
        String normalizedEmail = normalize(email);

        // CHECK 1: Is registration expired?
        String registerKey = REGISTER_KEY_PREFIX + normalizedEmail;
        if (!redisTemplate.hasKey(registerKey)) {
            throw new AppException(ErrorCode.REGISTRATION_EXPIRED,
                "Thời hạn đăng kí 7 ngày đã hết. Vui lòng đăng kí lại");
        }

        // CHECK 2: OTP exists?
        String otpKey = OTP_KEY_PREFIX + normalizedEmail;
        String otpValue = redisTemplate.opsForValue().get(otpKey);
        if (otpValue == null) {
            throw new AppException(ErrorCode.OTP_EXPIRED,
                "Mã OTP hết hạn. Vui lòng gửi lại");
        }

        // Parse OTP value (format: code:attempts)
        String[] parts = otpValue.split(":");
        if (parts.length != 2) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Invalid OTP state");
        }

        String storedCode = parts[0];
        int attempts = Integer.parseInt(parts[1]);

        // CHECK 3: OTP code correct?
        if (!storedCode.equals(otpCode.trim())) {
            // Increment attempts
            attempts++;
            if (attempts >= MAX_OTP_ATTEMPTS) {
                // Delete OTP after 3 failed attempts
                redisTemplate.delete(otpKey);
                throw new AppException(ErrorCode.OTP_ATTEMPTS_EXCEEDED,
                    "Bạn đã nhập OTP sai 3 lần. Vui lòng gửi lại OTP mới");
            }

            // Save incremented attempts
            redisTemplate.opsForValue().set(otpKey, storedCode + ":" + attempts, OTP_TTL);

            int remainingAttempts = MAX_OTP_ATTEMPTS - attempts;
            throw new AppException(ErrorCode.INVALID_OTP,
                String.format("OTP không đúng. Bạn còn %d lần nhập", remainingAttempts));
        }

        // OTP correct - cleanup all related keys
        cleanupOtpKeys(normalizedEmail);
        return true;
    }

    /**
     * Clean up OTP-related Redis keys after successful verification
     */
    public void cleanupOtpKeys(String email) {
        String normalizedEmail = normalize(email);
        String otpKey = OTP_KEY_PREFIX + normalizedEmail;
        String rateLimitKey = OTP_RATELIMIT_PREFIX + normalizedEmail;
        String sendCountKey = OTP_SEND_COUNT_PREFIX + normalizedEmail;
        String registerKey = REGISTER_KEY_PREFIX + normalizedEmail;

        redisTemplate.delete(otpKey, rateLimitKey, sendCountKey, registerKey);
        log.info("OTP keys cleaned up for: {}", normalizedEmail);
    }

    /**
     * Clean up registration (when user decided not to register within 7 days)
     */
    public void cleanupRegistration(String email) {
        String normalizedEmail = normalize(email);
        String registerKey = REGISTER_KEY_PREFIX + normalizedEmail;
        String otpKey = OTP_KEY_PREFIX + normalizedEmail;
        String rateLimitKey = OTP_RATELIMIT_PREFIX + normalizedEmail;

        redisTemplate.delete(registerKey, otpKey, rateLimitKey);
        log.info("Registration cleaned up for: {}", normalizedEmail);
    }

    /**
     * Get remaining time before can resend (in seconds)
     */
    public long getResendCooldownRemaining(String email) {
        String normalizedEmail = normalize(email);
        String rateLimitKey = OTP_RATELIMIT_PREFIX + normalizedEmail;
        Long ttl = redisTemplate.getExpire(rateLimitKey);
        return ttl != null && ttl > 0 ? ttl : 0;
    }

    /**
     * Get remaining registration time (in minutes)
     */
    public long getRegistrationTimeRemaining(String email) {
        String normalizedEmail = normalize(email);
        String registerKey = REGISTER_KEY_PREFIX + normalizedEmail;
        Long ttl = redisTemplate.getExpire(registerKey);
        if (ttl == null || ttl <= 0) {
            return 0;
        }
        return (ttl + 59) / 60; // Convert to minutes, round up
    }

    /**
     * Get OTP send count for today
     */
    public long getOtpSendCount(String email) {
        String normalizedEmail = normalize(email);
        String sendCountKey = OTP_SEND_COUNT_PREFIX + normalizedEmail;
        String value = redisTemplate.opsForValue().get(sendCountKey);
        return value != null ? Long.parseLong(value) : 0;
    }

    /**
     * Normalize email (lowercase, trim)
     */
    private String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}

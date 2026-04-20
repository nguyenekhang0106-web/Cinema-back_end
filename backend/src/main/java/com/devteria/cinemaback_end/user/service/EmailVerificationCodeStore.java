package com.devteria.cinemaback_end.user.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Locale;
import java.util.UUID;

@Service
public class EmailVerificationCodeStore {

    public static final String TOKEN_KEY_PREFIX = "cinema:email-verify-token:";
    public static final String RESEND_COOLDOWN_PREFIX = "cinema:email-verify-resend-cooldown:";
    public static final String ATTEMPT_COUNTER_PREFIX = "cinema:email-verify-attempt:";
    
    private static final int MAX_VERIFICATION_ATTEMPTS = 3;
    private static final long RESEND_COOLDOWN_SECONDS = 300; // 5 minutes

    private final StringRedisTemplate stringRedisTemplate;
    private final Duration ttl;
    private final PasswordEncoder passwordEncoder;

    public EmailVerificationCodeStore(
            StringRedisTemplate stringRedisTemplate,
            @Value("${app.email-verification-ttl-minutes:15}") long ttlMinutes) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.ttl = Duration.ofMinutes(ttlMinutes);
        this.passwordEncoder = new BCryptPasswordEncoder(10);
    }

    /**
     * Create token with hashed code stored in Redis
     * Format: token → {email}:{bcrypt(code)}
     */
    public String putAndIssueToken(String email, String sixDigitCode) {
        String token = UUID.randomUUID().toString().replace("-", "");
        String normalizedEmail = normalize(email);
        String hashedCode = passwordEncoder.encode(sixDigitCode);
        String tokenValue = normalizedEmail + ":" + hashedCode;
        stringRedisTemplate.opsForValue().set(tokenKey(token), tokenValue, ttl);
        return token;
    }

    /**
     * Verify token and code in single Redis query
     * @return email if token + code valid; null otherwise
     */

    public String consumeIfValidByToken(String token, String code) {
        String storedValue = stringRedisTemplate.opsForValue().get(tokenKey(token));
        if (storedValue == null) {
            return null;
        }
        
        String[] parts = storedValue.split(":", 2);
        if (parts.length != 2) {
            return null;
        }
        
        String email = parts[0];
        String hashedCode = parts[1];
        
        if (!passwordEncoder.matches(code.trim(), hashedCode)) {
            return null;
        }
        
        stringRedisTemplate.delete(tokenKey(token));
        return email;
    }

    /**
     * Get email from token without consuming it (for resend scenario)
     */
    public String getEmailByToken(String token) {
        String storedValue = stringRedisTemplate.opsForValue().get(tokenKey(token));
        if (storedValue == null) {
            return null;
        }
        String[] parts = storedValue.split(":", 2);
        return parts.length == 2 ? parts[0] : null;
    }

    /**
     * Refresh token TTL for resend flow
     */
    public void refreshToken(String token, String email, String code) {
        String normalizedEmail = normalize(email);
        String hashedCode = passwordEncoder.encode(code);
        String tokenValue = normalizedEmail + ":" + hashedCode;
        stringRedisTemplate.opsForValue().set(tokenKey(token), tokenValue, ttl);
    }

    private static String tokenKey(String token) {
        return TOKEN_KEY_PREFIX + token.trim();
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    /**
     * Check if user can resend verification code (cooldown period)
     * @return true if resend is allowed, false if still in cooldown
     */
    public boolean canResend(String token) {
        String cooldownKey = RESEND_COOLDOWN_PREFIX + token.trim();
        return stringRedisTemplate.opsForValue().get(cooldownKey) == null;
    }

    /**
     * Get remaining time in seconds before can resend
     * @return remaining seconds, or 0 if can resend
     */
    public long getResendCooldownRemaining(String token) {
        String cooldownKey = RESEND_COOLDOWN_PREFIX + token.trim();
        Long ttl = stringRedisTemplate.getExpire(cooldownKey);
        return ttl != null && ttl > 0 ? ttl : 0;
    }

    /**
     * Mark token as recently sent (apply 5-minute cooldown)
     */
    public void markResendCooldown(String token) {
        String cooldownKey = RESEND_COOLDOWN_PREFIX + token.trim();
        stringRedisTemplate.opsForValue()
                .set(cooldownKey, "1", Duration.ofSeconds(RESEND_COOLDOWN_SECONDS));
    }

    /**
     * Get remaining verification attempts for the token
     * @return number of attempts left (0-3)
     */
    public int getRemainingAttempts(String token) {
        String attemptKey = ATTEMPT_COUNTER_PREFIX + token.trim();
        String value = stringRedisTemplate.opsForValue().get(attemptKey);
        if (value == null) {
            return MAX_VERIFICATION_ATTEMPTS;
        }
        int attemptCount = Integer.parseInt(value);
        return Math.max(0, MAX_VERIFICATION_ATTEMPTS - attemptCount);
    }

    /**
     * Increment failed verification attempt
     * @return current attempt count after increment
     */
    public int incrementFailedAttempt(String token) {
        String attemptKey = ATTEMPT_COUNTER_PREFIX + token.trim();
        Long attempt = stringRedisTemplate.opsForValue().increment(attemptKey);
        if (attempt == 1) {
            stringRedisTemplate.expire(attemptKey, ttl);
        }
        return Math.toIntExact(attempt);
    }

    /**
     * Check if user has exceeded maximum verification attempts
     */
    public boolean hasExceededAttempts(String token) {
        String attemptKey = ATTEMPT_COUNTER_PREFIX + token.trim();
        String value = stringRedisTemplate.opsForValue().get(attemptKey);
        if (value == null) {
            return false;
        }
        return Integer.parseInt(value) >= MAX_VERIFICATION_ATTEMPTS;
    }

    /**
     * Reset attempt counter when resending code
     */
    public void resetAttempts(String token) {
        String attemptKey = ATTEMPT_COUNTER_PREFIX + token.trim();
        stringRedisTemplate.delete(attemptKey);
    }
}

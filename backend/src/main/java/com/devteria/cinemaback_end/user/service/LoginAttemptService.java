package com.devteria.cinemaback_end.user.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Service to manage login rate limiting
 * Prevents brute force attacks on user accounts
 */
@Service
public class LoginAttemptService {
    public static final String LOGIN_ATTEMPT_PREFIX = "cinema:login-attempt:";
    public static final String LOGIN_COOLDOWN_PREFIX = "cinema:login-cooldown:";
    
    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final long LOGIN_ATTEMPT_WINDOW_SECONDS = 900; // 15 minutes

    private final StringRedisTemplate stringRedisTemplate;

    public LoginAttemptService(StringRedisTemplate stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    /**
     * Check if login is allowed for the given username
     * @param username Username or email
     * @return true if login is allowed, false if rate limited
     */
    public boolean isLoginAllowed(String username) {
        String attemptKey = LOGIN_ATTEMPT_PREFIX + normalizeUsername(username);
        String value = stringRedisTemplate.opsForValue().get(attemptKey);
        
        if (value == null) {
            return true; // No attempts yet
        }
        
        try {
            int attempts = Integer.parseInt(value);
            return attempts < MAX_LOGIN_ATTEMPTS;
        } catch (NumberFormatException e) {
            return true; // Invalid value, allow
        }
    }

    /**
     * Record a failed login attempt
     * @param username Username or email
     * @return number of attempts after increment
     */
    public int recordFailedAttempt(String username) {
        String attemptKey = LOGIN_ATTEMPT_PREFIX + normalizeUsername(username);
        Long attempts = stringRedisTemplate.opsForValue().increment(attemptKey);
        
        if (attempts == 1) {
            stringRedisTemplate.expire(attemptKey, Duration.ofSeconds(LOGIN_ATTEMPT_WINDOW_SECONDS));
        }
        
        return Math.toIntExact(attempts);
    }

    /**
     * Get remaining attempts before lockout
     * @param username Username or email
     * @return remaining attempts (0 if locked)
     */
    public int getRemainingAttempts(String username) {
        String attemptKey = LOGIN_ATTEMPT_PREFIX + normalizeUsername(username);
        String value = stringRedisTemplate.opsForValue().get(attemptKey);
        
        if (value == null) {
            return MAX_LOGIN_ATTEMPTS;
        }
        
        try {
            int attempts = Integer.parseInt(value);
            return Math.max(0, MAX_LOGIN_ATTEMPTS - attempts);
        } catch (NumberFormatException e) {
            return MAX_LOGIN_ATTEMPTS;
        }
    }

    /**
     * Get remaining lockout time in seconds
     * @param username Username or email
     * @return remaining lockout time, 0 if not locked
     */
    public long getRemainingLockoutTime(String username) {
        String attemptKey = LOGIN_ATTEMPT_PREFIX + normalizeUsername(username);
        Long ttl = stringRedisTemplate.getExpire(attemptKey);
        return ttl != null && ttl > 0 ? ttl : 0;
    }

    /**
     * Clear login attempts for successful login
     * @param username Username or email
     */
    public void clearLoginAttempts(String username) {
        String attemptKey = LOGIN_ATTEMPT_PREFIX + normalizeUsername(username);
        stringRedisTemplate.delete(attemptKey);
    }

    /**
     * Check if user is in cooldown after successful login to prevent refresh token hijacking
     * @param username Username or email
     * @return true if in cooldown
     */
    public boolean isInLoginCooldown(String username) {
        String cooldownKey = LOGIN_COOLDOWN_PREFIX + normalizeUsername(username);
        return Boolean.TRUE.equals(stringRedisTemplate.hasKey(cooldownKey));
    }

    /**
     * Set login cooldown to prevent refresh token hijacking
     * @param username Username or email
     * @param seconds Cooldown duration in seconds
     */
    public void setLoginCooldown(String username, long seconds) {
        String cooldownKey = LOGIN_COOLDOWN_PREFIX + normalizeUsername(username);
        stringRedisTemplate.opsForValue().set(cooldownKey, "1", Duration.ofSeconds(seconds));
    }

    /**
     * Clear login cooldown
     * @param username Username or email
     */
    public void clearLoginCooldown(String username) {
        String cooldownKey = LOGIN_COOLDOWN_PREFIX + normalizeUsername(username);
        stringRedisTemplate.delete(cooldownKey);
    }

    private static String normalizeUsername(String username) {
        return username != null ? username.trim().toLowerCase() : "";
    }
}

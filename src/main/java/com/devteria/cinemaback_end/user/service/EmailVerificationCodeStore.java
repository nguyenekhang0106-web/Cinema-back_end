package com.devteria.cinemaback_end.user.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Locale;

@Service
public class EmailVerificationCodeStore {

    public static final String KEY_PREFIX = "cinema:email-verify:";

    private final StringRedisTemplate stringRedisTemplate;
    private final Duration ttl;

    public EmailVerificationCodeStore(
            StringRedisTemplate stringRedisTemplate,
            @Value("${app.email-verification-ttl-minutes:15}") long ttlMinutes) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.ttl = Duration.ofMinutes(ttlMinutes);
    }

    public void put(String email, String sixDigitCode) {
        stringRedisTemplate.opsForValue().set(redisKey(email), sixDigitCode, ttl);
    }

    /**
     * @return true nếu mã đúng và còn trong TTL Redis; xóa key khi thành công
     */
    public boolean consumeIfValid(String email, String code) {
        String key = redisKey(email);
        String stored = stringRedisTemplate.opsForValue().get(key);
        if (stored == null) {
            return false;
        }
        if (!stored.equals(code.trim())) {
            return false;
        }
        stringRedisTemplate.delete(key);
        return true;
    }

    private static String redisKey(String email) {
        return KEY_PREFIX + normalize(email);
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}

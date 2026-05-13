package com.devteria.cinemaback_end.booking.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookingRedisService {

    StringRedisTemplate redisTemplate;
    private static final String BOOKING_HOLD_PREFIX = "cinema:booking_hold:";

    public void setBookingHold(String bookingId, LocalDateTime expiresAt) {
        Duration ttl = Duration.between(LocalDateTime.now(), expiresAt);
        if (ttl.isNegative() || ttl.isZero()) {
            ttl = SeatHoldService.HOLD_TIME;
        }
        redisTemplate.opsForValue().set(BOOKING_HOLD_PREFIX + bookingId, "PENDING", ttl);
    }

    public long getRemainingHoldTime(String bookingId) {
        Long ttl = redisTemplate.getExpire(BOOKING_HOLD_PREFIX + bookingId);
        return ttl != null && ttl > 0 ? ttl : 0;
    }

    public void clearBookingHold(String bookingId) {
        redisTemplate.delete(BOOKING_HOLD_PREFIX + bookingId);
    }
}

package com.devteria.cinemaback_end.booking.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookingRedisService {

    StringRedisTemplate redisTemplate;
    private static final String BOOKING_HOLD_PREFIX = "cinema:booking_hold:";
    private static final Duration HOLD_TIME = Duration.ofMinutes(10); // Khách có 10 phút để thanh toán

    // Lưu ID hóa đơn vào Redis bắt đầu đếm ngược
    public void setBookingHold(String bookingId) {
        redisTemplate.opsForValue().set(BOOKING_HOLD_PREFIX + bookingId, "PENDING", HOLD_TIME);
    }

    // Lấy thời gian còn lại (giây) cho Frontend hiển thị đồng hồ
    public long getRemainingHoldTime(String bookingId) {
        Long ttl = redisTemplate.getExpire(BOOKING_HOLD_PREFIX + bookingId);
        return ttl != null && ttl > 0 ? ttl : 0;
    }

    // Xóa key khi thanh toán thành công hoặc bị hủy
    public void clearBookingHold(String bookingId) {
        redisTemplate.delete(BOOKING_HOLD_PREFIX + bookingId);
    }
}
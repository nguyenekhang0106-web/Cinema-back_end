package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.entity.Booking;
import com.devteria.cinemaback_end.booking.entity.enums.BookingStatus;
import com.devteria.cinemaback_end.booking.repository.BookingRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class BookingCleanupTask {

    BookingRepository bookingRepository;
    BookingService bookingService;

    // Cứ 1 phút chạy 1 lần
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void cleanupExpiredBookings() {
        // Tìm các hóa đơn PENDING đã tạo quá 10 phút
        LocalDateTime tenMinutesAgo = LocalDateTime.now().minusMinutes(10);

        // Bạn cần thêm hàm này vào BookingRepository:
        // List<Booking> findByStatusAndBookingDateBefore(BookingStatus status, LocalDateTime time);
        List<Booking> expiredBookings = bookingRepository
                .findByStatusAndBookingDateBefore(BookingStatus.PENDING, tenMinutesAgo);

        if (!expiredBookings.isEmpty()) {
            log.info("Tìm thấy {} hóa đơn PENDING đã hết hạn. Đang tiến hành hủy và giải phóng ghế...", expiredBookings.size());
            for (Booking booking : expiredBookings) {
                try {
                    bookingService.cancelBooking(booking.getId());
                    log.info("Đã hủy hóa đơn: {}", booking.getBookingCode());
                } catch (Exception e) {
                    log.error("Lỗi khi hủy hóa đơn {}: {}", booking.getBookingCode(), e.getMessage());
                }
            }
        }
    }
}
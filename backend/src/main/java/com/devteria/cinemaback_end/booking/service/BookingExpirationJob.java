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

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class BookingExpirationJob {

    BookingRepository bookingRepository;
    BookingService bookingService;

    @Scheduled(fixedRateString = "${app.booking.expiration-scan-ms:60000}")
    public void expirePendingBookings() {
        List<Booking> expiredBookings = bookingRepository.findByStatusAndExpiresAtBefore(
                BookingStatus.PENDING,
                LocalDateTime.now());
        if (expiredBookings.isEmpty()) {
            return;
        }

        log.info("[Booking Expiration] found {} expired PENDING booking(s)", expiredBookings.size());
        for (Booking booking : expiredBookings) {
            try {
                bookingService.expireBookingIfDue(booking.getId());
            } catch (Exception exception) {
                log.error("[Booking Expiration] cannot expire bookingId={}, bookingCode={}",
                        booking.getId(), booking.getBookingCode(), exception);
            }
        }
    }
}

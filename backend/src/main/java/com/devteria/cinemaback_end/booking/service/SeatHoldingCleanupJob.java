package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.entity.Booking;
import com.devteria.cinemaback_end.booking.entity.SeatHolding;
import com.devteria.cinemaback_end.booking.entity.enums.BookingStatus;
import com.devteria.cinemaback_end.booking.entity.enums.SeatHoldingStatus;
import com.devteria.cinemaback_end.booking.repository.BookingRepository;
import com.devteria.cinemaback_end.booking.repository.SeatHoldingRepository;
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
public class SeatHoldingCleanupJob {

    SeatHoldingRepository seatHoldingRepository;
    BookingRepository bookingRepository;
    BookingService bookingService;

    @Scheduled(fixedRateString = "${app.booking.seat-holding-scan-ms:60000}")
    public void expireStaleHoldings() {
        List<SeatHolding> expiredHoldings = seatHoldingRepository.findByStatusAndExpiresAtBefore(
                SeatHoldingStatus.HOLDING,
                LocalDateTime.now());
        for (SeatHolding holding : expiredHoldings) {
            try {
                Booking booking = bookingRepository.findById(holding.getBookingId()).orElse(null);
                if (booking == null || booking.getStatus() == BookingStatus.PAID) {
                    continue;
                }
                if (booking.getStatus() == BookingStatus.PENDING) {
                    bookingService.expireBookingIfDue(booking.getId());
                }
            } catch (Exception exception) {
                log.error("[Seat Holding Cleanup] cannot release stale holdingId={}, bookingId={}",
                        holding.getId(), holding.getBookingId(), exception);
            }
        }
    }
}

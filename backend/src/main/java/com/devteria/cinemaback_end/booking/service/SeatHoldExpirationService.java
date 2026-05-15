package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.entity.Booking;
import com.devteria.cinemaback_end.booking.entity.Ticket;
import com.devteria.cinemaback_end.booking.entity.enums.BookingStatus;
import com.devteria.cinemaback_end.booking.entity.enums.TicketStatus;
import com.devteria.cinemaback_end.booking.repository.TicketRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class SeatHoldExpirationService {

    TicketRepository ticketRepository;
    BookingService bookingService;
    SeatNotificationService seatNotificationService;
    StringRedisTemplate redisTemplate;

    @Transactional
    public void handleExpiredSeatHold(String expiredKey) {
        String[] keyParts = expiredKey.split(":", -1);
        if (keyParts.length != 2) {
            return;
        }

        String showtimeId = keyParts[0];
        String seatId = keyParts[1];
        log.info("[Redis Expiration] seat hold expired showtimeId={}, seatId={}", showtimeId, seatId);
        ticketRepository.findFirstByShowtimeIdAndSeatIdAndStatus(showtimeId, seatId, TicketStatus.PENDING)
                .ifPresentOrElse(this::cancelPendingBooking, () -> notifyAvailableIfSeatIsNotBooked(showtimeId, seatId));
    }

    private void cancelPendingBooking(Ticket ticket) {
        Booking booking = ticket.getBooking();
        if (booking.getStatus() != BookingStatus.PENDING) {
            return;
        }

        log.info("[Redis Expiration] expire pending booking if due bookingId={}, bookingCode={}",
                booking.getId(), booking.getBookingCode());
        bookingService.expireBookingIfDue(booking.getId());
    }

    private void notifyAvailableIfSeatIsNotBooked(String showtimeId, String seatId) {
        boolean booked = ticketRepository.existsByShowtimeIdAndSeatIdAndStatusIn(
                showtimeId,
                seatId,
                List.of(TicketStatus.VALID, TicketStatus.SCANNED)
        );
        if (!booked && !Boolean.TRUE.equals(redisTemplate.hasKey(showtimeId + ":" + seatId))) {
            seatNotificationService.sendSeatStatus(showtimeId, List.of(seatId), "AVAILABLE", null, null);
        }
    }
}

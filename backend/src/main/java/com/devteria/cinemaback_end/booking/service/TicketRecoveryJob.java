package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.entity.Booking;
import com.devteria.cinemaback_end.booking.entity.enums.BookingStatus;
import com.devteria.cinemaback_end.booking.entity.enums.TicketStatus;
import com.devteria.cinemaback_end.booking.repository.BookingRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TicketRecoveryJob {

    BookingRepository bookingRepository;
    OutboxEventService outboxEventService;

    @Scheduled(fixedDelayString = "${app.ticket.recovery-delay-ms:60000}")
    public void recoverPaidBookingsWithPendingTickets() {
        List<Booking> bookings = bookingRepository.findByStatusAndTicketStatus(
                BookingStatus.PAID,
                TicketStatus.PENDING);
        if (bookings.isEmpty()) {
            return;
        }

        log.warn("[Ticket Recovery] found {} PAID booking(s) with PENDING tickets", bookings.size());
        for (Booking booking : bookings) {
            try {
                outboxEventService.requeueBookingPaid(booking);
            } catch (Exception exception) {
                log.error("[Ticket Recovery] cannot requeue BOOKING_PAID bookingId={}", booking.getId(), exception);
            }
        }
    }
}

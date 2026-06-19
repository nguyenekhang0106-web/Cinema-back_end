package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.dto.BookingPaidMessage;
import com.devteria.cinemaback_end.booking.entity.Booking;
import com.devteria.cinemaback_end.booking.entity.ProcessedMessage;
import com.devteria.cinemaback_end.booking.entity.Ticket;
import com.devteria.cinemaback_end.booking.entity.enums.BookingStatus;
import com.devteria.cinemaback_end.booking.entity.enums.OutboxEventType;
import com.devteria.cinemaback_end.booking.entity.enums.TicketStatus;
import com.devteria.cinemaback_end.booking.repository.BookingRepository;
import com.devteria.cinemaback_end.booking.repository.ProcessedMessageRepository;
import com.devteria.cinemaback_end.booking.repository.TicketRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class BookingPaidTicketIssuer {

    BookingRepository bookingRepository;
    TicketRepository ticketRepository;
    ProcessedMessageRepository processedMessageRepository;
    BookingRedisService bookingRedisService;
    SeatHoldService seatHoldService;
    SeatNotificationService seatNotificationService;
    TicketQrCodeService ticketQrCodeService;
    TicketEmailService ticketEmailService;

    @Transactional
    public boolean issueTickets(BookingPaidMessage message) {
        if (processedMessageRepository.existsById(message.getEventId())) {
            log.info("[Booking Paid Consumer] duplicate event ignored eventId={}, bookingId={}",
                    message.getEventId(), message.getBookingId());
            return false;
        }
        saveProcessedMessage(message);

        Booking booking = bookingRepository.findByIdForUpdate(message.getBookingId())
                .orElseThrow(() -> new NonRetryableBookingPaidException("Booking not found: " + message.getBookingId()));

        if (booking.getStatus() != BookingStatus.PAID) {
            throw new IllegalStateException("Booking is not PAID: " + booking.getId() + ", status=" + booking.getStatus());
        }

        List<Ticket> tickets = ticketRepository.findByBookingId(booking.getId());
        if (tickets.isEmpty()) {
            throw new NonRetryableBookingPaidException("Booking has no tickets: " + booking.getId());
        }

        boolean changedForEmail = false;
        for (Ticket ticket : tickets) {
            if (ticket.getStatus() == TicketStatus.PENDING) {
                ticket.setStatus(TicketStatus.VALID);
                changedForEmail = true;
            }
            if (ticket.getStatus() == TicketStatus.VALID) {
                changedForEmail = ticketQrCodeService.ensureQrTicket(ticket) || changedForEmail;
            }
        }

        if (changedForEmail) {
            ticketRepository.saveAll(tickets);
            log.info("[Booking Paid Consumer] ticket updated VALID/QR bookingId={}, ticketIds={}",
                    booking.getId(), tickets.stream().map(Ticket::getId).toList());
        } else {
            log.info("[Booking Paid Consumer] tickets already VALID with QR bookingId={}", booking.getId());
        }

        seatHoldService.confirmSeatHolds(booking);
        registerAfterCommit(booking, tickets);
        return changedForEmail;
    }

    private void saveProcessedMessage(BookingPaidMessage message) {
        try {
            processedMessageRepository.saveAndFlush(ProcessedMessage.builder()
                    .eventId(message.getEventId())
                    .eventType(OutboxEventType.BOOKING_PAID.name())
                    .build());
            log.info("[Booking Paid Consumer] processed_message saved eventId={}, bookingId={}",
                    message.getEventId(), message.getBookingId());
        } catch (DataIntegrityViolationException exception) {
            log.info("[Booking Paid Consumer] duplicate event raced and was ignored eventId={}, bookingId={}",
                    message.getEventId(), message.getBookingId());
            throw new DuplicateBookingPaidMessageException("Duplicate event: " + message.getEventId());
        }
    }

    private void registerAfterCommit(Booking booking, List<Ticket> tickets) {
        String bookingId = booking.getId();
        String userId = booking.getCustomer().getId();
        String showtimeId = tickets.get(0).getShowtime().getId();
        List<String> seatIds = tickets.stream().map(ticket -> ticket.getSeat().getId()).toList();

        Runnable afterCommit = () -> {
            bookingRedisService.clearBookingHold(bookingId);
            seatHoldService.releaseSeats(showtimeId, seatIds, userId);
            seatNotificationService.sendSeatStatus(showtimeId, seatIds, "BOOKED", userId, bookingId);
            log.info("[Booking Paid Consumer] notified BOOKED bookingId={}", bookingId);

            try {
                ticketEmailService.sendBookingTickets(bookingId);
                log.info("[Booking Paid Consumer] ticket email queued/sent bookingId={}", bookingId);
            } catch (Exception exception) {
                log.error("[Booking Paid Consumer] cannot send ticket email bookingId={}", bookingId, exception);
            }
        };

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    afterCommit.run();
                }
            });
            return;
        }

        afterCommit.run();
    }
}

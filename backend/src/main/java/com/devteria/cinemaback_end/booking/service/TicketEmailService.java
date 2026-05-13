package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.entity.Booking;
import com.devteria.cinemaback_end.booking.entity.Ticket;
import com.devteria.cinemaback_end.booking.repository.BookingRepository;
import com.devteria.cinemaback_end.booking.repository.TicketRepository;
import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.user.service.EmailSenderService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TicketEmailService {

    BookingRepository bookingRepository;
    TicketRepository ticketRepository;
    EmailSenderService emailSenderService;

    @Transactional(readOnly = true)
    public void sendBookingTickets(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_EXISTED));
        List<Ticket> tickets = ticketRepository.findByBookingId(bookingId);
        if (tickets.isEmpty()) {
            throw new AppException(ErrorCode.TICKET_NOT_EXISTED);
        }

        emailSenderService.sendBookingTicketEmail(booking, tickets);
        log.info("[Ticket Email] ticket email sent bookingId={}, ticketCodes={}",
                bookingId, tickets.stream().map(Ticket::getTicketCode).toList());
    }
}

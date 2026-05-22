package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.dto.TicketResponse;
import com.devteria.cinemaback_end.booking.entity.Ticket;
import com.devteria.cinemaback_end.booking.entity.enums.TicketStatus;
import com.devteria.cinemaback_end.booking.mapper.TicketMapper;
import com.devteria.cinemaback_end.booking.repository.TicketRepository;
import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TicketService {

    TicketRepository ticketRepository;
    TicketMapper ticketMapper;

    // 🔥 BỔ SUNG: Hàm lấy danh sách vé cho User đang đăng nhập
    public List<TicketResponse> getMyTickets() {
        // Lấy Email từ SecurityContext (Token)
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        // Gọi hàm repository vừa tạo ở trên
        List<Ticket> tickets = ticketRepository.findByBooking_Customer_EmailOrderByShowtime_StartTimeDesc(email);

        return tickets.stream()
                .map(ticketMapper::toTicketResponse)
                .toList();
    }

    public TicketResponse getTicketById(String id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TICKET_NOT_EXISTED));
        return ticketMapper.toTicketResponse(ticket);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public TicketResponse scanTicket(String id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TICKET_NOT_EXISTED));
        return checkIn(ticket);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public TicketResponse checkInByTicketCode(String ticketCode) {
        Ticket ticket = ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new AppException(ErrorCode.TICKET_NOT_EXISTED));
        return checkIn(ticket);
    }

    private TicketResponse checkIn(Ticket ticket) {
        if (ticket.getStatus() == TicketStatus.SCANNED) {
            log.info("[Ticket Check-in] duplicate scan ticketId={}, ticketCode={}, scannedAt={}",
                    ticket.getId(), ticket.getTicketCode(), ticket.getScannedAt());
            throw new AppException(ErrorCode.TICKET_ALREADY_SCANNED);
        }
        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            log.warn("[Ticket Check-in] cancelled ticket rejected ticketId={}, ticketCode={}",
                    ticket.getId(), ticket.getTicketCode());
            throw new AppException(ErrorCode.TICKET_CANCELLED);
        }
        if (ticket.getStatus() == TicketStatus.PENDING) {
            log.warn("[Ticket Check-in] pending ticket rejected ticketId={}, ticketCode={}",
                    ticket.getId(), ticket.getTicketCode());
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        ticket.setStatus(TicketStatus.SCANNED);
        ticket.setScannedAt(LocalDateTime.now());
        ticket.setScannedBy(currentActor());
        log.info("[Ticket Check-in] scan success ticketId={}, ticketCode={}, scannedBy={}",
                ticket.getId(), ticket.getTicketCode(), ticket.getScannedBy());
        return ticketMapper.toTicketResponse(ticketRepository.save(ticket));
    }

    private String currentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return "SYSTEM";
        }
        return authentication.getName();
    }
}
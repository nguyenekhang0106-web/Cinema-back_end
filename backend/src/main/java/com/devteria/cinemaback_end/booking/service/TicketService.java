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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TicketService {

    TicketRepository ticketRepository;
    TicketMapper ticketMapper;

    // Xem thông tin 1 cái vé bất kỳ (Khách click vào mã QR)
    public TicketResponse getTicketById(String id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TICKET_NOT_EXISTED));
        return ticketMapper.toTicketResponse(ticket);
    }

    // NGHIỆP VỤ SOÁT VÉ (Chỉ Admin / Nhân viên rạp được gọi khi cầm máy quét QR)
    @Transactional
    @PreAuthorize("hasRole('ADMIN')") // xem xét chỗ này có thể áp dụng cho nhân viên
    public TicketResponse scanTicket(String id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.TICKET_NOT_EXISTED));

        // Kiểm tra xem vé có hợp lệ không
        if (ticket.getStatus() == TicketStatus.SCANNED) {
            throw new AppException(ErrorCode.TICKET_ALREADY_SCANNED);
        }
        if (ticket.getStatus() == TicketStatus.CANCELLED) {
            throw new AppException(ErrorCode.TICKET_CANCELLED);
        }

        // Đổi trạng thái thành đã sử dụng
        ticket.setStatus(TicketStatus.SCANNED);

        return ticketMapper.toTicketResponse(ticketRepository.save(ticket));
    }
}
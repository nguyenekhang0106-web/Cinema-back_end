package com.devteria.cinemaback_end.booking.repository;

import com.devteria.cinemaback_end.booking.entity.Ticket;
import com.devteria.cinemaback_end.booking.entity.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, String> {

    // 🔥 CẬP NHẬT LẠI: Chỉ check những vé đang VALID (chờ thanh toán/đã thanh toán) hoặc SCANNED
    // Bỏ qua vé CANCELLED để người khác có thể mua lại ghế đó
    boolean existsByShowtimeIdAndSeatIdAndStatusIn(String showtimeId, String seatId, List<TicketStatus> statuses);

    List<Ticket> findByBookingId(String bookingId);
}
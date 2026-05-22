package com.devteria.cinemaback_end.booking.repository;

import com.devteria.cinemaback_end.booking.entity.Ticket;
import com.devteria.cinemaback_end.booking.entity.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, String> {

    // 🔥 CẬP NHẬT LẠI: Chỉ check những vé đang VALID (chờ thanh toán/đã thanh toán) hoặc SCANNED
    // Bỏ qua vé CANCELLED để người khác có thể mua lại ghế đó
    boolean existsByShowtimeIdAndSeatIdAndStatusIn(String showtimeId, String seatId, List<TicketStatus> statuses);

    List<Ticket> findByBookingId(String bookingId);

    List<Ticket> findByBookingIdAndStatus(String bookingId, TicketStatus status);

    List<Ticket> findByShowtimeIdAndStatusIn(String showtimeId, List<TicketStatus> statuses);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Ticket> findFirstByShowtimeIdAndSeatIdAndStatus(String showtimeId, String seatId, TicketStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Ticket> findByTicketCode(String ticketCode);

    boolean existsByTicketCodeAndIdNot(String ticketCode, String id);

    // 🔥 BỔ SUNG: Hàm lấy danh sách vé của user theo Email, sắp xếp thời gian chiếu giảm dần
    List<Ticket> findByBooking_Customer_EmailOrderByShowtime_StartTimeDesc(String email);
}
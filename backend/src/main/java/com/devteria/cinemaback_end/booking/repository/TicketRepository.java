package com.devteria.cinemaback_end.booking.repository;

import com.devteria.cinemaback_end.booking.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, String> {

    // 🔥 Cực kỳ quan trọng: Kiểm tra xem ghế này trong suất chiếu này đã có ai mua chưa
    boolean existsByShowtimeIdAndSeatId(String showtimeId, String seatId);

    // Lấy toàn bộ vé của một hóa đơn (Dùng khi xuất chi tiết hóa đơn cho khách xem)
    List<Ticket> findByBookingId(String bookingId);
}
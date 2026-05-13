package com.devteria.cinemaback_end.booking.repository;

import com.devteria.cinemaback_end.booking.entity.Booking;
import com.devteria.cinemaback_end.booking.entity.enums.BookingStatus;
import com.devteria.cinemaback_end.booking.entity.enums.TicketStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {

    // Tìm lịch sử đặt vé của một khách hàng
    List<Booking> findAllByCustomerIdOrderByBookingDateDesc(String customerId);

    // Tìm theo mã code hiển thị
    Optional<Booking> findByBookingCode(String bookingCode);

    // 🔥 THÊM DÒNG NÀY ĐỂ FIX LỖI:
    // Tìm các hóa đơn theo trạng thái và được tạo trước một mốc thời gian nhất định
    List<Booking> findByStatusAndBookingDateBefore(BookingStatus status, LocalDateTime time);

    List<Booking> findByStatusAndExpiresAtBefore(BookingStatus status, LocalDateTime time);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Booking b where b.id = :id")
    Optional<Booking> findByIdForUpdate(@Param("id") String id);

    @Query("""
            select distinct b
            from Booking b
            join b.tickets t
            where b.status = :bookingStatus
              and t.status = :ticketStatus
            """)
    List<Booking> findByStatusAndTicketStatus(
            @Param("bookingStatus") BookingStatus bookingStatus,
            @Param("ticketStatus") TicketStatus ticketStatus);
}

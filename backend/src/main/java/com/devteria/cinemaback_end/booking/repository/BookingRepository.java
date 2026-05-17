package com.devteria.cinemaback_end.booking.repository;

import com.devteria.cinemaback_end.booking.entity.Booking;
import com.devteria.cinemaback_end.booking.entity.enums.BookingStatus;
import com.devteria.cinemaback_end.booking.entity.enums.PaymentStatus;
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

    List<Booking> findAllByCustomerIdOrderByBookingDateDesc(String customerId);

    Optional<Booking> findByBookingCode(String bookingCode);

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

    // =========================================================================
    // 🔥 CÁC QUERY PHỤC VỤ THỐNG KÊ (LIÊN KẾT PAYMENT & CINEMA CHUẨN XÁC)
    // =========================================================================

    // 1. Doanh thu theo ngày
    @Query("SELECT FUNCTION('DATE_FORMAT', b.bookingDate, '%d/%m'), " +
            "SUM(b.totalAmount), SUM(b.ticketTotal), SUM(b.concessionTotal) " +
            "FROM Booking b " +
            "WHERE b.status = :bookingStatus " +
            "AND EXISTS (SELECT 1 FROM Payment p WHERE p.booking = b AND p.status = :paymentStatus) " +
            "AND b.bookingDate >= :startDate AND b.bookingDate <= :endDate " +
            "AND (:cinemaId = 'all' OR EXISTS (" +
            "  SELECT 1 FROM Ticket t WHERE t.booking = b AND t.showtime.hall.cinema.id = :cinemaId" +
            ")) " +
            "GROUP BY FUNCTION('DATE_FORMAT', b.bookingDate, '%d/%m') " +
            "ORDER BY MIN(b.bookingDate) ASC")
    List<Object[]> getRevenueByDateRaw(
            @Param("bookingStatus") BookingStatus bookingStatus,
            @Param("paymentStatus") PaymentStatus paymentStatus,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("cinemaId") String cinemaId);

    // 2. Doanh thu theo phim
    @Query("SELECT m.title, SUM(t.price), COUNT(t.id) " +
            "FROM Ticket t " +
            "JOIN t.booking b " +
            "JOIN t.showtime s " +
            "JOIN s.movie m " +
            "JOIN s.hall h " +
            "WHERE b.status = :bookingStatus " +
            "AND EXISTS (SELECT 1 FROM Payment p WHERE p.booking = b AND p.status = :paymentStatus) " +
            "AND b.bookingDate >= :startDate AND b.bookingDate <= :endDate " +
            "AND (:cinemaId = 'all' OR h.cinema.id = :cinemaId) " +
            "GROUP BY m.id, m.title " +
            "ORDER BY SUM(t.price) DESC")
    List<Object[]> getRevenueByMovieRaw(
            @Param("bookingStatus") BookingStatus bookingStatus,
            @Param("paymentStatus") PaymentStatus paymentStatus,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("cinemaId") String cinemaId);

    // 3. Hiệu suất phim (Lấy số lượng vé & doanh thu)
    @Query("SELECT m.id, m.title, CAST(m.genre AS string), COUNT(t.id), SUM(t.price) " +
            "FROM Ticket t " +
            "JOIN t.booking b " +
            "JOIN t.showtime s " +
            "JOIN s.movie m " +
            "JOIN s.hall h " +
            "WHERE b.status = :bookingStatus " +
            "AND EXISTS (SELECT 1 FROM Payment p WHERE p.booking = b AND p.status = :paymentStatus) " +
            "AND b.bookingDate >= :startDate AND b.bookingDate <= :endDate " +
            "AND (:cinemaId = 'all' OR h.cinema.id = :cinemaId) " +
            "GROUP BY m.id, m.title, m.genre " +
            "ORDER BY COUNT(t.id) DESC")
    List<Object[]> getMoviePerformanceRaw(
            @Param("bookingStatus") BookingStatus bookingStatus,
            @Param("paymentStatus") PaymentStatus paymentStatus,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("cinemaId") String cinemaId);

    // 3.1. Truy vấn chuyên biệt: Tính tổng sức chứa phòng chiếu (Cho tỷ lệ lấp đầy)
    @Query("SELECT m.id, SUM(h.totalSeats) " +
            "FROM Showtime s " +
            "JOIN s.movie m " +
            "JOIN s.hall h " +
            "WHERE s.startTime >= :startDate AND s.startTime <= :endDate " +
            "AND s.status != 'CANCELLED' " +
            "AND (:cinemaId = 'all' OR h.cinema.id = :cinemaId) " +
            "GROUP BY m.id")
    List<Object[]> getMovieCapacityRaw(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("cinemaId") String cinemaId);

    // 4. Thống kê phương thức thanh toán
    @Query("SELECT CAST(p.method AS string), COUNT(p.id) " +
            "FROM Payment p JOIN p.booking b " +
            "WHERE b.status = :bookingStatus AND p.status = :paymentStatus " +
            "AND b.bookingDate >= :startDate AND b.bookingDate <= :endDate " +
            "AND (:cinemaId = 'all' OR EXISTS (" +
            "  SELECT 1 FROM Ticket t WHERE t.booking = b AND t.showtime.hall.cinema.id = :cinemaId" +
            ")) " +
            "GROUP BY p.method")
    List<Object[]> getPaymentMethodStatsRaw(
            @Param("bookingStatus") BookingStatus bookingStatus,
            @Param("paymentStatus") PaymentStatus paymentStatus,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("cinemaId") String cinemaId);

    // 5. Thống kê giờ cao điểm (Đếm số vé bán ra theo giờ của các suất chiếu)
    @Query("SELECT FUNCTION('HOUR', s.startTime), COUNT(t.id) " +
            "FROM Ticket t " +
            "JOIN t.booking b " +
            "JOIN t.showtime s " +
            "JOIN s.hall h " +
            "WHERE b.status = :bookingStatus " +
            "AND EXISTS (SELECT 1 FROM Payment p WHERE p.booking = b AND p.status = :paymentStatus) " +
            "AND s.startTime >= :startDate AND s.startTime <= :endDate " +
            "AND (:cinemaId = 'all' OR h.cinema.id = :cinemaId) " +
            "GROUP BY FUNCTION('HOUR', s.startTime) " +
            "ORDER BY FUNCTION('HOUR', s.startTime) ASC")
    List<Object[]> getHourlyTrendsRaw(
            @Param("bookingStatus") BookingStatus bookingStatus,
            @Param("paymentStatus") PaymentStatus paymentStatus,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("cinemaId") String cinemaId);

    // 6. Hiệu suất phòng chiếu (Tự động tính tổng sức chứa dựa trên số lần chiếu)
    @Query("SELECT h.name, CAST(s.format AS string), h.totalSeats, COUNT(t.id), SUM(t.price), COUNT(DISTINCT s.id) " +
            "FROM Ticket t " +
            "JOIN t.booking b " +
            "JOIN t.showtime s " +
            "JOIN s.hall h " +
            "WHERE b.status = :bookingStatus " +
            "AND EXISTS (SELECT 1 FROM Payment p WHERE p.booking = b AND p.status = :paymentStatus) " +
            "AND s.startTime >= :startDate AND s.startTime <= :endDate " +
            "AND (:cinemaId = 'all' OR h.cinema.id = :cinemaId) " +
            "GROUP BY h.id, h.name, s.format, h.totalSeats")
    List<Object[]> getHallPerformanceRaw(
            @Param("bookingStatus") BookingStatus bookingStatus,
            @Param("paymentStatus") PaymentStatus paymentStatus,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("cinemaId") String cinemaId);

    // Lấy dữ liệu tỷ lệ hủy vé
    @Query("SELECT FUNCTION('DATE_FORMAT', b.bookingDate, '%d/%m'), COUNT(b.id), " +
            "SUM(CASE WHEN b.status = 'CANCELLED' THEN 1 ELSE 0 END) " +
            "FROM Booking b " +
            "WHERE b.bookingDate >= :startDate AND b.bookingDate <= :endDate " +
            "GROUP BY FUNCTION('DATE_FORMAT', b.bookingDate, '%d/%m') " +
            "ORDER BY MIN(b.bookingDate) ASC")
    List<Object[]> getCancellationStatsRaw(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // Lấy dữ liệu Top khách hàng thân thiết
    @Query("SELECT u.email, COUNT(b.id), SUM(b.totalAmount), MAX(b.bookingDate) " +
            "FROM Booking b JOIN b.customer u " +
            "WHERE b.status = 'PAID' " +
            "AND b.bookingDate >= :startDate AND b.bookingDate <= :endDate " +
            "GROUP BY u.email " +
            "ORDER BY SUM(b.totalAmount) DESC")
    List<Object[]> getTopCustomersRaw(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // 7. Đếm số lượng User Hoạt Động (Có đặt vé thành công trong khoảng thời gian)
    @Query("SELECT COUNT(DISTINCT b.customer.id) FROM Booking b " +
            "WHERE b.status = 'PAID' AND b.bookingDate >= :startDate AND b.bookingDate <= :endDate")
    long countActiveUsersRaw(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    // 8. Thống kê lượng user hoạt động (chi tiền) theo từng ngày
    @Query("SELECT FUNCTION('DATE_FORMAT', b.bookingDate, '%d/%m'), COUNT(DISTINCT b.customer.id) " +
            "FROM Booking b " +
            "WHERE b.status = 'PAID' " +
            "AND b.bookingDate >= :startDate AND b.bookingDate <= :endDate " +
            "GROUP BY FUNCTION('DATE_FORMAT', b.bookingDate, '%d/%m') " +
            "ORDER BY MIN(b.bookingDate) ASC")
    List<Object[]> getDailyActiveUsersRaw(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // 9. Thống kê chi tiêu và số vé theo từng Hạng Thành Viên
    @Query("SELECT CAST(u.memberTier AS string), COUNT(b.id), SUM(b.totalAmount) " +
            "FROM Booking b JOIN b.customer u " +
            "WHERE b.status = 'PAID' " +
            "AND b.bookingDate >= :startDate AND b.bookingDate <= :endDate " +
            "GROUP BY u.memberTier " +
            "ORDER BY SUM(b.totalAmount) DESC")
    List<Object[]> getStatsByMemberTierRaw(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // 10. Thống kê doanh thu theo từng Cụm Rạp (Đã sửa c.location thành c.address)
    @Query("SELECT c.name, c.address, COUNT(t.id), SUM(t.price) " +
            "FROM Ticket t JOIN t.booking b JOIN t.showtime s JOIN s.hall h JOIN h.cinema c " +
            "WHERE b.status = :bookingStatus AND b.bookingDate >= :startDate AND b.bookingDate <= :endDate " +
            "GROUP BY c.id, c.name, c.address")
    List<Object[]> getCinemaStatsRaw(
            @Param("bookingStatus") BookingStatus bookingStatus,
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate);

    // 11. Thống kê loại ghế được đặt (Đã thêm chữ 'type' ở CAST và GROUP BY)
    @Query("SELECT CAST(t.seat.type AS string), COUNT(t.id) " +
            "FROM Ticket t JOIN t.booking b " +
            "WHERE b.status = :bookingStatus AND b.bookingDate >= :startDate AND b.bookingDate <= :endDate " +
            "AND (:cinemaId = 'all' OR t.showtime.hall.cinema.id = :cinemaId) " +
            "GROUP BY t.seat.type")
    List<Object[]> getSeatTypeStatsRaw(
            @Param("bookingStatus") BookingStatus bookingStatus,
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate,
            @Param("cinemaId") String cinemaId);
}
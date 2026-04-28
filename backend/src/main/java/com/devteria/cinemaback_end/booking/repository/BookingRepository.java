package com.devteria.cinemaback_end.booking.repository;

import com.devteria.cinemaback_end.booking.entity.Booking;
import com.devteria.cinemaback_end.booking.entity.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
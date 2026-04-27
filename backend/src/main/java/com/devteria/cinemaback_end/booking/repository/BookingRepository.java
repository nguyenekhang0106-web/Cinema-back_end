package com.devteria.cinemaback_end.booking.repository;

import com.devteria.cinemaback_end.booking.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {
    // Tìm lịch sử đặt vé của một khách hàng
    List<Booking> findAllByCustomerIdOrderByBookingDateDesc(String customerId);

    // Tìm theo mã code hiển thị
    Optional<Booking> findByBookingCode(String bookingCode);
}
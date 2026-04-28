package com.devteria.cinemaback_end.booking.repository;

import com.devteria.cinemaback_end.booking.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {

    // Tìm giao dịch dựa trên ID của hóa đơn
    Optional<Payment> findByBookingId(String bookingId);
}
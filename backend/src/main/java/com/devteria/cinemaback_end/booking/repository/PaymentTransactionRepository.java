package com.devteria.cinemaback_end.booking.repository;

import com.devteria.cinemaback_end.booking.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, String> {

    boolean existsByPaymentIdAndResponseCodeAndTransactionStatus(
            String paymentId,
            String responseCode,
            String transactionStatus);
}

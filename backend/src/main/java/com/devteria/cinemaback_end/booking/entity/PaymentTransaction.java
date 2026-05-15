package com.devteria.cinemaback_end.booking.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "payment_transaction",
        indexes = {
                @Index(name = "idx_payment_transaction_payment", columnList = "payment_id"),
                @Index(name = "idx_payment_transaction_booking", columnList = "booking_id"),
                @Index(name = "idx_payment_transaction_txn_ref", columnList = "vnp_txn_ref")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "payment_id", length = 100)
    String paymentId;

    @Column(name = "booking_id", length = 100)
    String bookingId;

    @Column(name = "vnp_txn_ref", length = 100)
    String vnpTxnRef;

    @Column(name = "vnp_transaction_no", length = 100)
    String vnpTransactionNo;

    @Column(length = 20)
    String responseCode;

    @Column(length = 20)
    String transactionStatus;

    @Column(length = 50)
    String bankCode;

    Double amount;

    LocalDateTime payDate;

    @Lob
    @Column(columnDefinition = "TEXT")
    String rawPayload;

    @Column(nullable = false)
    Boolean checksumValid;

    @Column(nullable = false)
    LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

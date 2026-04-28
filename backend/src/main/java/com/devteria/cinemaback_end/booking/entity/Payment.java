package com.devteria.cinemaback_end.booking.entity;

import com.devteria.cinemaback_end.booking.entity.Booking;
import com.devteria.cinemaback_end.booking.entity.enums.PaymentMethod;
import com.devteria.cinemaback_end.booking.entity.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false)
    Double amount;

    @Builder.Default
    LocalDateTime paymentDate = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    PaymentMethod method;

    // Mã giao dịch từ ngân hàng/ví điện tử trả về (dùng để đối soát)
    String transactionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    PaymentStatus status = PaymentStatus.PENDING;

    @ToString.Exclude
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    Booking booking;
}
package com.devteria.cinemaback_end.booking.dto;

import com.devteria.cinemaback_end.booking.entity.enums.PaymentMethod;
import com.devteria.cinemaback_end.booking.entity.enums.PaymentStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentResponse {
    String id;
    String bookingCode; // Lấy từ Booking ra cho dễ nhìn
    Double amount;
    LocalDateTime paymentDate;
    PaymentMethod method;
    String transactionId;
    PaymentStatus status;
}
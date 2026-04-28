package com.devteria.cinemaback_end.booking.dto;

import com.devteria.cinemaback_end.booking.entity.enums.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentRequest {

    @NotBlank(message = "BOOKING_ID_NOT_BLANK")
    String bookingId;

    @NotNull(message = "PAYMENT_METHOD_NOT_NULL")
    PaymentMethod method; // VD: Truyền lên "VNPAY"
}
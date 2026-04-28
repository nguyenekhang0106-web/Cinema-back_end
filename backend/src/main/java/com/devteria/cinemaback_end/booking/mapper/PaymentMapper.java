package com.devteria.cinemaback_end.booking.mapper;

import com.devteria.cinemaback_end.booking.dto.PaymentRequest;
import com.devteria.cinemaback_end.booking.dto.PaymentResponse;
import com.devteria.cinemaback_end.booking.entity.Payment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PaymentMapper {

    @Mapping(source = "booking.bookingCode", target = "bookingCode")
    PaymentResponse toPaymentResponse(Payment payment);
}
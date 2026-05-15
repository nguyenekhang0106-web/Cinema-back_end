package com.devteria.cinemaback_end.booking.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingPaidMessage {
    String eventId;
    String bookingId;
    String bookingCode;
    String customerId;
    String customerEmail;
    Double totalAmount;
    List<String> ticketIds;
    List<String> seatIds;
    LocalDateTime paidAt;
}

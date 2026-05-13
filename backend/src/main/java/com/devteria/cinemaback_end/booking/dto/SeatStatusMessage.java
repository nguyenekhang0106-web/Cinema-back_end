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
public class SeatStatusMessage {
    String showtimeId;
    List<String> seatIds;
    String status;
    String userId;
    String bookingId;
    LocalDateTime timestamp;
}

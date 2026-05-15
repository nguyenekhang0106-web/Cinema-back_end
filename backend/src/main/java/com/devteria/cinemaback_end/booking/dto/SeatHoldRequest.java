package com.devteria.cinemaback_end.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatHoldRequest {

    @NotBlank(message = "SHOWTIME_ID_NOT_BLANK")
    String showtimeId;

    @NotEmpty(message = "SEAT_LIST_NOT_EMPTY")
    List<String> seatIds;
}
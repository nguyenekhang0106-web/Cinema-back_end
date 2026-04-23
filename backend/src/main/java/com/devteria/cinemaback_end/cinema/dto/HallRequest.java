package com.devteria.cinemaback_end.cinema.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HallRequest {

    @NotBlank(message = "HALL_NAME_NOT_BLANK")
    String name;

    @NotNull(message = "TOTAL_SEATS_NOT_NULL")
    @Min(value = 20, message = "TOTAL_SEATS_MIN_INVALID") // Giả sử phòng chiếu nhỏ nhất cũng phải có 20 ghế
    Integer totalSeats;

    @NotBlank(message = "CINEMA_ID_NOT_BLANK")
    String cinemaId;
}
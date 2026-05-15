package com.devteria.cinemaback_end.cinema.dto;

import jakarta.validation.constraints.NotBlank;
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

    @NotBlank(message = "CINEMA_ID_NOT_BLANK")
    String cinemaId;
}
package com.devteria.cinemaback_end.cinema.dto;

import com.devteria.cinemaback_end.movie.entity.enums.Area;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CinemaRequest {

    @NotBlank(message = "CINEMA_NAME_NOT_BLANK")
    String name;

    @NotBlank(message = "CINEMA_ADDRESS_NOT_BLANK")
    String address;

    @NotBlank(message = "HOTLINE_NOT_BLANK")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "HOTLINE_INVALID")
    String hotline;

    // Đổi thành Area và dùng @NotNull (vì Enum không dùng được @NotBlank)
    @NotNull(message = "AREA_NOT_NULL")
    Area city;
}
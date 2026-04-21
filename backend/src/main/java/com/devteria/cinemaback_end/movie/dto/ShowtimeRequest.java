package com.devteria.cinemaback_end.movie.dto;

import com.devteria.cinemaback_end.movie.entity.enums.ShowtimeFormat;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ShowtimeRequest {
    @NotNull(message = "START_TIME_NOT_NULL")
    LocalDateTime startTime;

    @NotNull(message = "BASE_PRICE_NOT_NULL")
    @DecimalMin(value = "0.0", inclusive = false, message = "PRICE_MUST_BE_POSITIVE")
    BigDecimal basePrice;

    @NotNull(message = "SHOWTIME_FORMAT_NOT_NULL")
    ShowtimeFormat format;

    @NotBlank(message = "MOVIE_ID_NOT_BLANK")
    String movieId;

    @NotBlank(message = "HALL_ID_NOT_BLANK")
    String hallId;

    String managerId;
}
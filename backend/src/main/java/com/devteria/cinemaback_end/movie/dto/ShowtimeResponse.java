package com.devteria.cinemaback_end.movie.dto;

import com.devteria.cinemaback_end.movie.entity.enums.ShowtimeFormat;
import com.devteria.cinemaback_end.movie.entity.enums.ShowtimeStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ShowtimeResponse {
    String id;
    LocalDateTime startTime;
    LocalDateTime endTime;
    BigDecimal basePrice;
    ShowtimeStatus status;
    ShowtimeFormat format;
    String movieId;
    String hallId;
    String managerId;
}

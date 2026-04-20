package com.devteria.cinemaback_end.movie.dto;

import com.devteria.cinemaback_end.movie.entity.enums.ShowtimeFormat;
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
    @NotNull(message = "Giờ bắt đầu không được để trống")
    LocalDateTime startTime;

    @NotNull(message = "Giờ kết thúc không được để trống")
    LocalDateTime endTime;

    @NotNull(message = "Giá gốc không được để trống")
    BigDecimal basePrice;

    @NotNull(message = "Định dạng chiếu không được để trống")
    ShowtimeFormat format;

    @NotBlank(message = "ID Phim không được để trống")
    String movieId;

    @NotBlank(message = "ID Phòng chiếu không được để trống")
    String hallId;

    String managerId; // Có thể null theo Entity
}

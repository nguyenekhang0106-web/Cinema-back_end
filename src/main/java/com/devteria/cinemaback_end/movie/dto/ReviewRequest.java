package com.devteria.cinemaback_end.movie.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReviewRequest {
    @NotNull(message = "Điểm đánh giá không được để trống")
    @Min(value = 1, message = "Điểm tối thiểu là 1")
    @Max(value = 5, message = "Điểm tối đa là 5")
    Integer ratingScore;

    @Size(max = 1000, message = "Bình luận không được vượt quá 1000 ký tự")
    String comment;

    @NotBlank(message = "ID Khách hàng không được để trống")
    String customerId;

    @NotBlank(message = "ID Phim không được để trống")
    String movieId;
}

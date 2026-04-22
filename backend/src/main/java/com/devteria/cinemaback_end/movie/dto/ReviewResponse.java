package com.devteria.cinemaback_end.movie.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReviewResponse {
    String id;
    Integer ratingScore;
    String comment;
    LocalDateTime postDate;
    String customerId;
    String customerName; // Bổ sung để hiển thị trên UI: VD "Nguyễn Khang"
    String movieId;
}
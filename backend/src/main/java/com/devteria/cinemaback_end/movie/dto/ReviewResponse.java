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

    // Thông tin người đánh giá
    String customerId;
    String customerName;
    String customerAvatar; // Nếu có

    // 🔥 BỔ SUNG TRƯỜNG NÀY ĐỂ SỬA LỖI MAPSTRUCT
    String movieId;

    // Các trường tương tác (Like / Dislike)
    Integer likeCount;
    Integer dislikeCount;
    Boolean isLikedByMe;     // User hiện tại đã like chưa?
    Boolean isDislikedByMe;  // User hiện tại đã dislike chưa?
}
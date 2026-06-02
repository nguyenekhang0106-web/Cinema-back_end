package com.devteria.cinemaback_end.article.dto;

import com.devteria.cinemaback_end.article.entity.enums.ArticleStatus;
import com.devteria.cinemaback_end.article.entity.enums.ArticleType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ArticleResponse {
    String id;
    String title;
    String thumbnailUrl;
    String summary;
    String content;
    ArticleType type;
    ArticleStatus status;
    LocalDateTime publishDate;
    String authorName;

    // Trả về thông tin của Admin đã đăng bài
    String managerId;
    String managerName; // Tên Admin (Cấu hình qua MapStruct: source = "manager.fullName")
    Boolean featured;
    // BỔ SUNG: Trả về thông tin phim (nếu có)
    String movieId;
    String movieTitle; // MapStruct sẽ tự động lấy từ movie.title
}
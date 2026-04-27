package com.devteria.cinemaback_end.article.dto;

import com.devteria.cinemaback_end.article.entity.enums.ArticleStatus;
import com.devteria.cinemaback_end.article.entity.enums.ArticleType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ArticleRequest {

    @NotBlank(message = "TITLE_NOT_BLANK")
    String title;

    String thumbnailUrl;

    @NotBlank(message = "SUMMARY_NOT_BLANK")
    String summary;

    @NotBlank(message = "CONTENT_NOT_BLANK")
    String content;

    @NotNull(message = "ARTICLE_TYPE_NOT_NULL")
    ArticleType type;

    // Cho phép Admin chọn trạng thái khi tạo bài (Lưu nháp hoặc Đăng ngay)
    @NotNull(message = "ARTICLE_STATUS_NOT_NULL")
    ArticleStatus status;

    String authorName;

    // BỔ SUNG: Cho phép truyền ID phim nếu bài viết này thuộc về 1 phim
    String movieId;
}
package com.devteria.cinemaback_end.article.entity;

import com.devteria.cinemaback_end.article.entity.enums.ArticleStatus;
import com.devteria.cinemaback_end.article.entity.enums.ArticleType;
import com.devteria.cinemaback_end.movie.entity.Movie;
import com.devteria.cinemaback_end.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Article {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false)
    String title;

    // BỔ SUNG: Ảnh bìa và Tóm tắt bài viết
    String thumbnailUrl;

    @Column(columnDefinition = "TEXT")
    String summary;

    @Column(columnDefinition = "TEXT", nullable = false)
    String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    ArticleType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    ArticleStatus status = ArticleStatus.DRAFT;

    @Column(updatable = false)
    LocalDateTime publishDate;

    // Tự động gán ngày tạo nếu chưa có
    @PrePersist
    public void prePersist() {
        if (this.publishDate == null) {
            this.publishDate = LocalDateTime.now();
        }
    }

    String authorName; // Nguồn bài viết hoặc tên bút danh (cho phép trống)

    @Builder.Default
    @Column(columnDefinition = "boolean default false")
    Boolean featured = false;

    // BỔ SUNG: Liên kết đến Phim (Cho phép null vì có những bài báo chung chung)
    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = true)
    Movie movie;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", nullable = false)
    User manager;
}
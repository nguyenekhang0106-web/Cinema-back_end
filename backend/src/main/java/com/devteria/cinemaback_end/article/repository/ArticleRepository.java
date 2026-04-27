package com.devteria.cinemaback_end.article.repository;

import com.devteria.cinemaback_end.article.entity.Article;
import com.devteria.cinemaback_end.article.entity.enums.ArticleStatus;
import com.devteria.cinemaback_end.article.entity.enums.ArticleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleRepository extends JpaRepository<Article, String> {

    // Lấy danh sách bài viết theo trạng thái (Ví dụ: Chỉ lấy bài PUBLISHED cho khách xem)
    List<Article> findByStatusOrderByPublishDateDesc(ArticleStatus status);

    // Lấy bài viết theo Loại và Trạng thái (Ví dụ: Chỉ lấy các bài KHUYẾN MÃI đã PUBLISHED)
    List<Article> findByTypeAndStatusOrderByPublishDateDesc(ArticleType type, ArticleStatus status);
}
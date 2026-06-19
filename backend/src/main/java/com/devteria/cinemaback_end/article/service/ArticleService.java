package com.devteria.cinemaback_end.article.service;

import com.devteria.cinemaback_end.article.dto.ArticleRequest;
import com.devteria.cinemaback_end.article.dto.ArticleResponse;
import com.devteria.cinemaback_end.article.entity.Article;
import com.devteria.cinemaback_end.article.entity.enums.ArticleStatus;
import com.devteria.cinemaback_end.article.entity.enums.ArticleType;
import com.devteria.cinemaback_end.article.mapper.ArticleMapper;
import com.devteria.cinemaback_end.article.repository.ArticleRepository;
import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.movie.entity.Movie;
import com.devteria.cinemaback_end.movie.repository.MovieRepository;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import com.devteria.cinemaback_end.util.HtmlSanitizerUtil;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ArticleService {

    ArticleRepository articleRepository;
    ArticleMapper articleMapper;
    UserRepository userRepository;

    // BỔ SUNG: Inject thêm MovieRepository
    MovieRepository movieRepository;

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public ArticleResponse createArticle(ArticleRequest request) {
        // 🔥 BƯỚC QUAN TRỌNG: Làm sạch nội dung HTML ngay khi nhận vào
        String safeContent = HtmlSanitizerUtil.sanitize(request.getContent());
        request.setContent(safeContent); // Ghi đè lại nội dung đã sạch vào request

        User manager = getCurrentUser();

        // Từ đây trở đi MapStruct sẽ dùng dữ liệu an toàn để lưu
        Article article = articleMapper.toArticle(request);
        article.setManager(manager);
        article.setFeatured(Boolean.TRUE.equals(request.getFeatured()));

        if (request.getMovieId() != null && !request.getMovieId().trim().isEmpty()) {
            Movie movie = movieRepository.findById(request.getMovieId())
                    .orElseThrow(() -> new AppException(ErrorCode.MOVIE_NOT_EXISTED));
            article.setMovie(movie);
        }

        return articleMapper.toArticleResponse(articleRepository.save(article));
    }

    // PUBLIC: Chỉ lấy những bài đã xuất bản
    @Transactional(readOnly = true)
    public List<ArticleResponse> getPublishedArticles(ArticleType type) {
        if (type != null) {
            return articleRepository.findByTypeAndStatusOrderByPublishDateDesc(type, ArticleStatus.PUBLISHED).stream()
                    .map(articleMapper::toArticleResponse).toList();
        }
        return articleRepository.findByStatusOrderByPublishDateDesc(ArticleStatus.PUBLISHED).stream()
                .map(articleMapper::toArticleResponse).toList();
    }

    // ADMIN: Lấy tất cả bài viết (Bao gồm nháp, ẩn)
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public List<ArticleResponse> getAllArticlesForAdmin() {
        return articleRepository.findAll().stream()
                .map(articleMapper::toArticleResponse).toList();
    }

    // PUBLIC: Lấy chi tiết 1 bài viết
    @Transactional(readOnly = true)
    public ArticleResponse getArticleById(String id) {
        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ARTICLE_NOT_EXISTED));
        return articleMapper.toArticleResponse(article);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public ArticleResponse updateArticle(String id, ArticleRequest request) {
        // 🔥 BƯỚC QUAN TRỌNG: Làm sạch nội dung HTML khi update
        String safeContent = HtmlSanitizerUtil.sanitize(request.getContent());
        request.setContent(safeContent); // Ghi đè lại nội dung đã sạch vào request

        Article article = articleRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.ARTICLE_NOT_EXISTED));

        // MapStruct sẽ map dữ liệu (bao gồm cả content đã làm sạch) vào Entity cũ
        articleMapper.updateArticle(article, request);
        article.setFeatured(Boolean.TRUE.equals(request.getFeatured()));

        if (request.getMovieId() != null && !request.getMovieId().trim().isEmpty()) {
            Movie movie = movieRepository.findById(request.getMovieId())
                    .orElseThrow(() -> new AppException(ErrorCode.MOVIE_NOT_EXISTED));
            article.setMovie(movie);
        } else {
            article.setMovie(null);
        }

        return articleMapper.toArticleResponse(articleRepository.save(article));
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteArticle(String id) {
        if (!articleRepository.existsById(id)) {
            throw new AppException(ErrorCode.ARTICLE_NOT_EXISTED);
        }
        articleRepository.deleteById(id);
    }

    // Helper method lấy User đang đăng nhập
    private User getCurrentUser() {
        var context = SecurityContextHolder.getContext();
        String currentEmail = context.getAuthentication().getName();
        return userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }
}
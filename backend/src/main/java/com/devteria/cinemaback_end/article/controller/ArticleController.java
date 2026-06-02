package com.devteria.cinemaback_end.article.controller;

import com.devteria.cinemaback_end.article.dto.ArticleRequest;
import com.devteria.cinemaback_end.article.dto.ArticleResponse;
import com.devteria.cinemaback_end.article.entity.enums.ArticleType;
import com.devteria.cinemaback_end.article.service.ArticleService;
import com.devteria.cinemaback_end.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/articles")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ArticleController {

    ArticleService articleService;

    @PostMapping
    public ApiResponse<ArticleResponse> create(@RequestBody @Valid ArticleRequest request) {
        return ApiResponse.<ArticleResponse>builder()
                .message("Tạo bài viết thành công")
                .result(articleService.createArticle(request))
                .build();
    }

    // Truyền ?type=NEWS hoặc ?type=PROMOTION để lọc. Nếu không truyền sẽ lấy tất cả bài đã xuất bản
    @GetMapping
    public ApiResponse<List<ArticleResponse>> getPublishedArticles(
            @RequestParam(required = false) ArticleType type) {
        return ApiResponse.<List<ArticleResponse>>builder()
                .result(articleService.getPublishedArticles(type))
                .build();
    }

    @GetMapping("/admin/all")
    public ApiResponse<List<ArticleResponse>> getAllArticlesForAdmin() {
        return ApiResponse.<List<ArticleResponse>>builder()
                .result(articleService.getAllArticlesForAdmin())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<ArticleResponse> getArticleById(@PathVariable String id) {
        return ApiResponse.<ArticleResponse>builder()
                .result(articleService.getArticleById(id))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<ArticleResponse> update(@PathVariable String id, @RequestBody @Valid ArticleRequest request) {
        return ApiResponse.<ArticleResponse>builder()
                .message("Cập nhật bài viết thành công")
                .result(articleService.updateArticle(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable String id) {
        articleService.deleteArticle(id);
        return ApiResponse.<Void>builder()
                .message("Đã xóa bài viết")
                .build();
    }


}
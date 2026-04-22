package com.devteria.cinemaback_end.movie.controller;

import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.movie.dto.ReviewRequest;
import com.devteria.cinemaback_end.movie.dto.ReviewResponse;
import com.devteria.cinemaback_end.movie.service.ReviewService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReviewController {

    ReviewService reviewService;

    // 1. Tạo mới
    @PostMapping
    public ApiResponse<ReviewResponse> createReview(@RequestBody @Valid ReviewRequest request) {
        return ApiResponse.<ReviewResponse>builder()
                .code(1000)
                .message("Đánh giá phim thành công")
                .result(reviewService.createReview(request))
                .build();
    }

    // 2. Lấy danh sách review của 1 phim
    @GetMapping("/movie/{movieId}")
    public ApiResponse<List<ReviewResponse>> getReviewsByMovie(@PathVariable String movieId) {
        return ApiResponse.<List<ReviewResponse>>builder()
                .code(1000)
                .result(reviewService.getReviewsByMovie(movieId))
                .build();
    }

    // 3. Lấy 1 review cụ thể
    @GetMapping("/{id}")
    public ApiResponse<ReviewResponse> getReviewById(@PathVariable String id) {
        return ApiResponse.<ReviewResponse>builder()
                .code(1000)
                .result(reviewService.getReviewById(id))
                .build();
    }

    // 4. Lấy lịch sử review của User đang đăng nhập (Thường gọi ở trang Profile)
    @GetMapping("/my-reviews")
    public ApiResponse<List<ReviewResponse>> getMyReviews() {
        return ApiResponse.<List<ReviewResponse>>builder()
                .code(1000)
                .result(reviewService.getMyReviews())
                .build();
    }

    // 5. Cập nhật review
    @PutMapping("/{id}")
    public ApiResponse<ReviewResponse> updateReview(
            @PathVariable String id,
            @RequestBody @Valid ReviewRequest request) {
        return ApiResponse.<ReviewResponse>builder()
                .code(1000)
                .message("Cập nhật đánh giá thành công")
                .result(reviewService.updateReview(id, request))
                .build();
    }

    // 6. Xóa review
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteReview(@PathVariable String id) {
        reviewService.deleteReview(id);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Đã xóa đánh giá")
                .build();
    }
}
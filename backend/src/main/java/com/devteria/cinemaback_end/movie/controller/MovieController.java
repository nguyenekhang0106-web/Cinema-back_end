package com.devteria.cinemaback_end.movie.controller;

import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.movie.dto.MovieImageUploadRequest;
import com.devteria.cinemaback_end.movie.dto.MovieRequest;
import com.devteria.cinemaback_end.movie.dto.MovieResponse;
import com.devteria.cinemaback_end.movie.service.MovieService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/movies")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true) // Đồng bộ phong cách code
public class MovieController {
    MovieService movieService; // Đã bỏ private final nhờ FieldDefaults

    /**
     * Create movie with optional poster and banner upload
     * Request: form-data with fields: title, durationMin, genre, language, ageRestriction,
     *          trailerUrl, description, releaseDate, directors, actors, posterFile (optional), bannerFile (optional)
     */
    @PostMapping
    public ApiResponse<MovieResponse> createMovie(@ModelAttribute @Valid MovieRequest request) {
        return ApiResponse.<MovieResponse>builder()
                .code(1000) // Trả về mã thành công chuẩn
                .message("Thêm phim mới thành công")
                .result(movieService.createMovie(request))
                .build();
    }

    @GetMapping
    public ApiResponse<List<MovieResponse>> getMovies() {
        return ApiResponse.<List<MovieResponse>>builder()
                .code(1000)
                .message("Lấy danh sách phim thành công")
                .result(movieService.getAllMovies())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<MovieResponse> getMovie(@PathVariable String id) {
        return ApiResponse.<MovieResponse>builder()
                .code(1000)
                .message("Lấy thông tin phim thành công")
                .result(movieService.getMovieWithImages(id))
                .build();
    }

    /**
     * Update movie with optional image upload
     * Request: form-data with fields same as createMovie
     */
    @PutMapping("/{id}")
    public ApiResponse<MovieResponse> updateMovie(@PathVariable String id, @ModelAttribute @Valid MovieRequest request) {
        return ApiResponse.<MovieResponse>builder()
                .code(1000)
                .message("Cập nhật thông tin phim thành công")
                .result(movieService.updateMovie(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteMovie(@PathVariable String id) {
        movieService.deleteMovie(id);

        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Xóa phim thành công")
                // Không cần truyền .result() vì hàm xóa trả về void
                .build();
    }

    /**
     * Upload poster or banner image for movie (separate endpoint)
     * POST /movies/{id}/image
     *
     * Request body: form-data
     * - file: MultipartFile
     * - imageType: String (POSTER hoặc BANNER)
     */
    @PostMapping("/{id}/image")
    public ApiResponse<String> uploadMovieImage(
            @PathVariable String id,
            @ModelAttribute @Valid MovieImageUploadRequest request) {
        String imageUrl = movieService.uploadMovieImageViaApi(id, request);
        return ApiResponse.<String>builder()
                .code(1000)
                .message("Cập nhật ảnh phim thành công")
                .result(imageUrl)
                .build();
    }
}
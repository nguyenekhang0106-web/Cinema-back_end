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
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MovieController {

    MovieService movieService;

    /**
     * BƯỚC 1: Tạo phim mới (Chỉ nhận JSON)
     * Request Body: JSON chứa title, durationMin, genre, language, directors, actors...
     */
    @PostMapping
    public ApiResponse<MovieResponse> createMovie(@RequestBody @Valid MovieRequest request) {
        return ApiResponse.<MovieResponse>builder()
                .code(1000)
                .message("Thêm thông tin phim mới thành công")
                .result(movieService.createMovie(request))
                .build();
    }

    /**
     * BƯỚC 2: Upload Poster và Banner (Nhận Form-Data)
     * Request: form-data chứa posterFile và bannerFile
     */
    @PostMapping("/{id}/images")
    public ApiResponse<MovieResponse> uploadMovieImages(
            @PathVariable String id,
            @ModelAttribute @Valid MovieImageUploadRequest request) {
        return ApiResponse.<MovieResponse>builder()
                .code(1000)
                .message("Cập nhật ảnh phim thành công")
                .result(movieService.uploadMovieImages(id, request))
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
                // Gọi hàm getMovie chuẩn (Service đã tự động map Full URL ảnh)
                .result(movieService.getMovie(id))
                .build();
    }

    /**
     * Cập nhật thông tin phim (Chỉ nhận JSON)
     */
    @PutMapping("/{id}")
    public ApiResponse<MovieResponse> updateMovie(
            @PathVariable String id,
            @RequestBody @Valid MovieRequest request) {
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
                .build();
    }
}
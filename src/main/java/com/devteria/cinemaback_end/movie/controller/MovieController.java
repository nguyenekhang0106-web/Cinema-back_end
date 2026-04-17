package com.devteria.cinemaback_end.movie.controller;

import com.devteria.cinemaback_end.common.ApiResponse;
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

    @PostMapping
    public ApiResponse<MovieResponse> createMovie(@RequestBody @Valid MovieRequest request) {
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
                .result(movieService.getMovie(id))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<MovieResponse> updateMovie(@PathVariable String id, @RequestBody @Valid MovieRequest request) {
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
}
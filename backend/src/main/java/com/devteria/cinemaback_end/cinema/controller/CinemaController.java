package com.devteria.cinemaback_end.cinema.controller;

import com.devteria.cinemaback_end.cinema.dto.CinemaRequest;
import com.devteria.cinemaback_end.cinema.dto.CinemaResponse;
import com.devteria.cinemaback_end.cinema.service.CinemaService;
import com.devteria.cinemaback_end.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cinemas")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CinemaController {

    CinemaService cinemaService;

    @PostMapping
    public ApiResponse<CinemaResponse> createCinema(@RequestBody @Valid CinemaRequest request) {
        return ApiResponse.<CinemaResponse>builder()
                .code(1000)
                .message("Tạo rạp chiếu phim thành công")
                .result(cinemaService.createCinema(request))
                .build();
    }

    @GetMapping
    public ApiResponse<List<CinemaResponse>> getAllCinemas() {
        return ApiResponse.<List<CinemaResponse>>builder()
                .code(1000)
                .result(cinemaService.getAllCinemas())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<CinemaResponse> getCinemaById(@PathVariable String id) {
        return ApiResponse.<CinemaResponse>builder()
                .code(1000)
                .result(cinemaService.getCinemaById(id))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<CinemaResponse> updateCinema(
            @PathVariable String id,
            @RequestBody @Valid CinemaRequest request) {
        return ApiResponse.<CinemaResponse>builder()
                .code(1000)
                .message("Cập nhật rạp chiếu phim thành công")
                .result(cinemaService.updateCinema(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCinema(@PathVariable String id) {
        cinemaService.deleteCinema(id);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Đã xóa rạp chiếu phim")
                .build();
    }
}
package com.devteria.cinemaback_end.movie.controller;

import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.movie.dto.ShowtimeRequest;
import com.devteria.cinemaback_end.movie.dto.ShowtimeResponse;
import com.devteria.cinemaback_end.movie.service.ShowtimeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/showtimes")
@RequiredArgsConstructor
public class ShowtimeController {
    private final ShowtimeService showtimeService;

    @PostMapping
    public ApiResponse<ShowtimeResponse> createShowtime(@RequestBody @Valid ShowtimeRequest request) {
        return ApiResponse.<ShowtimeResponse>builder()
                .result(showtimeService.createShowtime(request))
                .build();
    }

    @GetMapping("/movie/{movieId}")
    public ApiResponse<List<ShowtimeResponse>> getShowtimesByMovie(@PathVariable String movieId) {
        return ApiResponse.<List<ShowtimeResponse>>builder()
                .result(showtimeService.getShowtimesByMovie(movieId))
                .build();
    }
}
package com.devteria.cinemaback_end.movie.controller;

import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.movie.dto.ShowtimeRequest;
import com.devteria.cinemaback_end.movie.dto.ShowtimeResponse;
import com.devteria.cinemaback_end.movie.service.ShowtimeService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/showtimes")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ShowtimeController {

    ShowtimeService showtimeService;

    // Lấy danh sách tất cả lịch chiếu
    @GetMapping
    public ApiResponse<List<ShowtimeResponse>> getAllShowtimes() {
        return ApiResponse.<List<ShowtimeResponse>>builder()
                .code(1000)
                .result(showtimeService.getAllShowtimes())
                .build();
    }

    // Lấy chi tiết một lịch chiếu
    @GetMapping("/{id}")
    public ApiResponse<ShowtimeResponse> getShowtimeById(@PathVariable String id) {
        return ApiResponse.<ShowtimeResponse>builder()
                .code(1000)
                .result(showtimeService.getShowtimeById(id))
                .build();
    }

    // Tạo mới lịch chiếu
    @PostMapping
    public ApiResponse<ShowtimeResponse> createShowtime(@RequestBody @Valid ShowtimeRequest request) {
        return ApiResponse.<ShowtimeResponse>builder()
                .code(1000)
                .message("Tạo lịch chiếu thành công")
                .result(showtimeService.createShowtime(request))
                .build();
    }

    // Cập nhật lịch chiếu
    @PutMapping("/{id}")
    public ApiResponse<ShowtimeResponse> updateShowtime(
            @PathVariable String id,
            @RequestBody @Valid ShowtimeRequest request) {
        return ApiResponse.<ShowtimeResponse>builder()
                .code(1000)
                .message("Cập nhật lịch chiếu thành công")
                .result(showtimeService.updateShowtime(id, request))
                .build();
    }

    // Hủy lịch chiếu (Soft Delete) - Dùng PATCH vì chỉ update trạng thái
    @PatchMapping("/{id}/cancel")
    public ApiResponse<Void> cancelShowtime(@PathVariable String id) {
        showtimeService.cancelShowtime(id);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Đã hủy lịch chiếu")
                .build();
    }

    // Xóa vĩnh viễn (Hard Delete)
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteShowtime(@PathVariable String id) {
        showtimeService.deleteShowtime(id);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Đã xóa lịch chiếu khỏi hệ thống")
                .build();
    }
}
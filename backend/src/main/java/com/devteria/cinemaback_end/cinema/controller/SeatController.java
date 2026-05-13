package com.devteria.cinemaback_end.cinema.controller;

import com.devteria.cinemaback_end.cinema.dto.SeatBatchRequest;
import com.devteria.cinemaback_end.cinema.dto.SeatRequest;
import com.devteria.cinemaback_end.cinema.dto.SeatResponse;
import com.devteria.cinemaback_end.cinema.service.SeatService;
import com.devteria.cinemaback_end.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/seats")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SeatController {

    SeatService seatService;

    @PostMapping
    public ApiResponse<SeatResponse> createSeat(@RequestBody @Valid SeatRequest request) {
        return ApiResponse.<SeatResponse>builder()
                .result(seatService.createSeat(request))
                .build();
    }

    @GetMapping("/hall/{hallId}")
    public ApiResponse<List<SeatResponse>> getSeatsByHall(@PathVariable String hallId) {
        return ApiResponse.<List<SeatResponse>>builder()
                .result(seatService.getSeatsByHall(hallId))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<SeatResponse> updateSeat(
            @PathVariable String id,
            @RequestBody @Valid SeatRequest request) {
        return ApiResponse.<SeatResponse>builder()
                .result(seatService.updateSeat(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteSeat(@PathVariable String id) {
        seatService.deleteSeat(id);
        return ApiResponse.<Void>builder()
                .message("Đã xóa ghế thành công")
                .build();
    }

    @PostMapping("/batch")
    public ApiResponse<List<SeatResponse>> createSeatsInBatch(@RequestBody @Valid SeatBatchRequest request) {
        return ApiResponse.<List<SeatResponse>>builder()
                .code(1000)
                .message("Tạo danh sách ghế thành công")
                .result(seatService.createSeatsInBatch(request))
                .build();
    }

    @DeleteMapping("/hall/{hallId}")
    public ApiResponse<Void> deleteAllSeatsByHall(@PathVariable String hallId) {
        seatService.deleteAllSeatsByHall(hallId);
        return ApiResponse.<Void>builder()
                .message("Đã xóa toàn bộ sơ đồ ghế thành công")
                .build();
    }
}
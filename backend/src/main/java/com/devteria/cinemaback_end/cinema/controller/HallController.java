package com.devteria.cinemaback_end.cinema.controller;

import com.devteria.cinemaback_end.cinema.dto.HallRequest;
import com.devteria.cinemaback_end.cinema.dto.HallResponse;
import com.devteria.cinemaback_end.cinema.service.HallService;
import com.devteria.cinemaback_end.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/halls")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class HallController {

    HallService hallService;

    @PostMapping
    public ApiResponse<HallResponse> createHall(@RequestBody @Valid HallRequest request) {
        return ApiResponse.<HallResponse>builder()
                .code(1000)
                .message("Tạo phòng chiếu thành công")
                .result(hallService.createHall(request))
                .build();
    }

    @GetMapping
    public ApiResponse<List<HallResponse>> getAllHalls() {
        return ApiResponse.<List<HallResponse>>builder()
                .code(1000)
                .result(hallService.getAllHalls())
                .build();
    }

    @GetMapping("/cinema/{cinemaId}")
    public ApiResponse<List<HallResponse>> getHallsByCinema(@PathVariable String cinemaId) {
        return ApiResponse.<List<HallResponse>>builder()
                .code(1000)
                .result(hallService.getHallsByCinema(cinemaId))
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<HallResponse> getHallById(@PathVariable String id) {
        return ApiResponse.<HallResponse>builder()
                .code(1000)
                .result(hallService.getHallById(id))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<HallResponse> updateHall(
            @PathVariable String id,
            @RequestBody @Valid HallRequest request) {
        return ApiResponse.<HallResponse>builder()
                .code(1000)
                .message("Cập nhật phòng chiếu thành công")
                .result(hallService.updateHall(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteHall(@PathVariable String id) {
        hallService.deleteHall(id);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Đã xóa phòng chiếu")
                .build();
    }
}
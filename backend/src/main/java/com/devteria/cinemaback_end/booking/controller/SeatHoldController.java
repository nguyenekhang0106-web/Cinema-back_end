package com.devteria.cinemaback_end.booking.controller;

import com.devteria.cinemaback_end.booking.dto.SeatHoldRequest;
import com.devteria.cinemaback_end.booking.dto.SeatHoldResponse;
import com.devteria.cinemaback_end.booking.service.SeatHoldService;
import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.movie.entity.Showtime;
import com.devteria.cinemaback_end.movie.repository.ShowtimeRepository;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/seats") // Vẫn giữ nguyên "/seats" để Frontend không phải sửa đường link
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SeatHoldController { // 🔥 ĐÃ ĐỔI TÊN CLASS THÀNH SeatHoldController ĐỂ KHÔNG BỊ TRÙNG

    SeatHoldService seatHoldService;
    ShowtimeRepository showtimeRepository;
    UserRepository userRepository;

    @PostMapping("/hold")
    public ApiResponse<SeatHoldResponse> holdSeats(@RequestBody @Valid SeatHoldRequest request) {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Showtime showtime = showtimeRepository.findById(request.getShowtimeId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy suất chiếu!"));

        // Dùng UUID thuần 36 ký tự
        String temporaryBookingId = UUID.randomUUID().toString();

        LocalDateTime expiresAt = LocalDateTime.now().plus(SeatHoldService.HOLD_TIME);

        SeatHoldResponse response = seatHoldService.holdSeats(
                showtime,
                request.getSeatIds(),
                user.getId(),
                temporaryBookingId,
                expiresAt
        );

        return ApiResponse.<SeatHoldResponse>builder()
                .code(1000)
                .message("Đã khóa ghế thành công!")
                .result(response)
                .build();
    }

    @GetMapping("/status/{showtimeId}")
    public ApiResponse<java.util.Map<String, String>> getSeatStatus(@PathVariable String showtimeId) {
        return ApiResponse.<java.util.Map<String, String>>builder()
                .code(1000)
                .message("Lấy trạng thái ghế thành công")
                .result(seatHoldService.getSeatStatusByShowtime(showtimeId))
                .build();
    }

    @DeleteMapping("/hold")
    public ApiResponse<Void> removeHold(@RequestBody @Valid SeatHoldRequest request) {
        String currentEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Gọi Service để hủy giữ ghế
        seatHoldService.removeTemporaryHold(request.getShowtimeId(), request.getSeatIds(), user.getId());

        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Đã hủy giữ ghế thành công")
                .build();
    }
}
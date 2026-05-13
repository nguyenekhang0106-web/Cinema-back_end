package com.devteria.cinemaback_end.booking.controller;

import com.devteria.cinemaback_end.booking.dto.BookingRequest;
import com.devteria.cinemaback_end.booking.dto.BookingResponse;
import com.devteria.cinemaback_end.booking.service.BookingService;
import com.devteria.cinemaback_end.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookingController {

    BookingService bookingService;

    @PostMapping
    public ApiResponse<BookingResponse> createBooking(@RequestBody @Valid BookingRequest request) {
        return ApiResponse.<BookingResponse>builder()
                .message("Đặt vé thành công!")
                .result(bookingService.createBooking(request))
                .build();
    }

    @GetMapping("/my-history")
    public ApiResponse<List<BookingResponse>> getMyHistory() {
        return ApiResponse.<List<BookingResponse>>builder()
                .result(bookingService.getMyHistory())
                .build();
    }

    // Lấy thời gian đếm ngược cho UI hiển thị
    @GetMapping("/{id}/timeout")
    public ApiResponse<Long> getRemainingTime(@PathVariable String id) {
        return ApiResponse.<Long>builder()
                .result(bookingService.getRemainingHoldTime(id))
                .build();
    }

    // Nút xác nhận thanh toán (Mô phỏng) --- chỉ để test hàm chính bên payment
    @PostMapping("/{id}/pay")
    public ApiResponse<BookingResponse> confirmPayment(@PathVariable String id) {
        return ApiResponse.<BookingResponse>builder()
                .message("Thanh toán thành công!")
                .result(bookingService.confirmPayment(id))
                .build();
    }

    // Nút hủy hóa đơn
    @PostMapping("/{id}/cancel")
    public ApiResponse<Void> cancelBooking(@PathVariable String id) {
        bookingService.cancelBooking(id);
        return ApiResponse.<Void>builder()
                .message("Đã hủy hóa đơn")
                .build();
    }
}

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
}
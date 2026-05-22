package com.devteria.cinemaback_end.booking.controller;

import com.devteria.cinemaback_end.booking.dto.TicketCheckInRequest;
import com.devteria.cinemaback_end.booking.dto.TicketResponse;
import com.devteria.cinemaback_end.booking.service.TicketService;
import com.devteria.cinemaback_end.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List; // 🔥 Đã bổ sung import List

@RestController
@RequestMapping("/tickets")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TicketController {

    TicketService ticketService;

    // 🔥 ĐÃ BỔ SUNG API NÀY ĐỂ FRONTEND LẤY ĐƯỢC DANH SÁCH VÉ (TRỊ LỖI 404)
    @GetMapping("/my-tickets")
    public ApiResponse<List<TicketResponse>> getMyTickets() {
        return ApiResponse.<List<TicketResponse>>builder()
                .result(ticketService.getMyTickets())
                .build();
    }

    // Xem chi tiết vé
    @GetMapping("/{id}")
    public ApiResponse<TicketResponse> getTicketById(@PathVariable String id) {
        return ApiResponse.<TicketResponse>builder()
                .result(ticketService.getTicketById(id))
                .build();
    }

    // Nhân viên rạp quét mã QR (Frontend sẽ gọi API này khi quét xong QR)
    @PostMapping("/check-in")
    public ApiResponse<TicketResponse> checkInTicket(@RequestBody @Valid TicketCheckInRequest request) {
        return ApiResponse.<TicketResponse>builder()
                // 🔥 ĐÃ SỬA LỖI FONT CHỮ TIẾNG VIỆT
                .message("Soát vé thành công. Chúc quý khách xem phim vui vẻ!")
                .result(ticketService.checkInByTicketCode(request.getTicketCode()))
                .build();
    }

    @PutMapping("/{id}/scan")
    public ApiResponse<TicketResponse> scanTicket(@PathVariable String id) {
        return ApiResponse.<TicketResponse>builder()
                .message("Soát vé thành công. Chúc quý khách xem phim vui vẻ!")
                .result(ticketService.scanTicket(id))
                .build();
    }
}
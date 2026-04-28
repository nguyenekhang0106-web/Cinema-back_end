package com.devteria.cinemaback_end.booking.controller;

import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.booking.dto.PaymentRequest;
import com.devteria.cinemaback_end.booking.dto.PaymentResponse;
import com.devteria.cinemaback_end.booking.service.PaymentService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PaymentController {

    PaymentService paymentService;

    // 1. Khách hàng bấm nút "Thanh toán"
    @PostMapping("/create")
    public ApiResponse<PaymentResponse> createPayment(@RequestBody @Valid PaymentRequest request) {
        return ApiResponse.<PaymentResponse>builder()
                .message("Đã khởi tạo giao dịch thanh toán")
                .result(paymentService.createPayment(request))
                .build();
    }

    // 2. Mô phỏng VNPay/MoMo gọi về báo kết quả (Trong thực tế đây sẽ là hàm xử lý IPN Webhook)
    @PostMapping("/{paymentId}/execute")
    public ApiResponse<PaymentResponse> executePayment(
            @PathVariable String paymentId,
            @RequestParam boolean isSuccess) {

        PaymentResponse response = paymentService.executePayment(paymentId, isSuccess);
        String message = isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại!";

        return ApiResponse.<PaymentResponse>builder()
                .message(message)
                .result(response)
                .build();
    }
}
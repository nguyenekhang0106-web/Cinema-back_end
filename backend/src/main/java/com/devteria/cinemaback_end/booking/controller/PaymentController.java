package com.devteria.cinemaback_end.booking.controller;

import com.devteria.cinemaback_end.booking.dto.PaymentRequest;
import com.devteria.cinemaback_end.booking.dto.PaymentResponse;
import com.devteria.cinemaback_end.booking.dto.VnPayCreateResponse;
import com.devteria.cinemaback_end.booking.service.PaymentService;
import com.devteria.cinemaback_end.booking.service.VnPayService;
import com.devteria.cinemaback_end.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PaymentController {

    PaymentService paymentService;
    VnPayService vnPayService;

    @PostMapping("/create")
    public ApiResponse<PaymentResponse> createPayment(@RequestBody @Valid PaymentRequest request) {
        return ApiResponse.<PaymentResponse>builder()
                .message("Đã khởi tạo giao dịch thanh toán")
                .result(paymentService.createPayment(request))
                .build();
    }

    @PostMapping("/vnpay/create")
    public ApiResponse<VnPayCreateResponse> createVnPayPayment(
            @RequestBody @Valid PaymentRequest request,
            HttpServletRequest httpServletRequest) {
        return ApiResponse.<VnPayCreateResponse>builder()
                .message("Đã tạo URL thanh toán VNPay")
                .result(vnPayService.createPaymentUrl(request, httpServletRequest))
                .build();
    }

    // 🔥 ĐÃ ĐỔI THAM SỐ: Nhận HttpServletRequest thay vì @RequestParam Map
    @GetMapping("/vnpay/return")
    public ApiResponse<PaymentResponse> handleVnPayReturn(HttpServletRequest request) {
        return ApiResponse.<PaymentResponse>builder()
                .message("Đã xử lý kết quả thanh toán VNPay")
                .result(vnPayService.handleReturn(request))
                .build();
    }

    // 🔥 ĐÃ ĐỔI THAM SỐ: Nhận HttpServletRequest cho luồng IPN ngầm
    @GetMapping("/vnpay/ipn")
    public Map<String, String> handleVnPayIpn(HttpServletRequest request) {
        try {
            vnPayService.handleReturn(request);
            return Map.of("RspCode", "00", "Message", "Confirm Success");
        } catch (Exception exception) {
            return Map.of("RspCode", "99", "Message", exception.getMessage());
        }
    }

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
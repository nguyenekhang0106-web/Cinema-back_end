package com.devteria.cinemaback_end.user.controller;

import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.user.dto.ForgotPasswordRequest;
import com.devteria.cinemaback_end.user.dto.ResetPasswordRequest;
import com.devteria.cinemaback_end.user.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PasswordResetController {

    PasswordResetService passwordResetService;

    @PostMapping("/forgot-password")
    public ApiResponse<String> forgotPassword(@RequestBody @Valid ForgotPasswordRequest request) {
        passwordResetService.requestPasswordReset(request);
        
        ApiResponse<String> response = new ApiResponse<>();
        response.setResult("Yêu cầu đặt lại mật khẩu đã được xử lý.");
        return response;
    }

    @PostMapping("/reset-password")
    public ApiResponse<String> resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        
        ApiResponse<String> response = new ApiResponse<>();
        response.setResult("Mật khẩu của bạn đã được đặt lại thành công.");
        return response;
    }
}

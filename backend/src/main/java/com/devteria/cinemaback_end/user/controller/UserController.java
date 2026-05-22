package com.devteria.cinemaback_end.user.controller;

import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.user.dto.*;
import com.devteria.cinemaback_end.user.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    // CHỈ GIỮ LẠI CÁC SERVICE CẦN THIẾT
    private final UserService userService;
    private final RegistrationService registrationService;
    private final OtpVerificationService otpVerificationService;
    private final AvatarService avatarService;

    @GetMapping
    public ApiResponse<List<UserResponse>> getUsers() {
        return ApiResponse.<List<UserResponse>>builder()
                .code(1000)
                .result(userService.getUsers())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<UserResponse> getUser(@PathVariable String id) {
        return ApiResponse.<UserResponse>builder()
                .code(1000)
                .result(userService.getUser(id))
                .build();
    }

    @PutMapping("/my-info")
    public ApiResponse<UserResponse> updateMyInfo(@RequestBody @Valid UserUpdateRequest request) { // Sửa tham số ở đây
        return ApiResponse.<UserResponse>builder()
                .code(1000)
                .message("Cập nhật thông tin thành công")
                .result(userService.updateUser(request))
                .build();
    }

    @GetMapping("/myInfo")
    public ApiResponse<UserResponse> getMyInfo(){
        return ApiResponse.<UserResponse>builder()
                .code(1000)
                .result(userService.getMyInfo())
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ApiResponse.<String>builder()
                .code(1000)
                .message("Xóa tài khoản thành công")
                .build();
    }

    // ============ REGISTRATION FLOW ============

    @PostMapping("/register")
    public ApiResponse<OtpResponse> register(@RequestBody @Valid UserRequest request) {
        return ApiResponse.<OtpResponse>builder()
                .code(1000)
                .message("Đăng kí thành công. Vui lòng kiểm tra email để lấy mã OTP")
                .result(registrationService.register(request))
                .build();
    }

    @PostMapping("/verify-otp")
    public ApiResponse<UserResponse> verifyOtp(@RequestBody @Valid VerifyOtpRequest request) {
        return otpVerificationService.verifyOtp(request.getEmail(), request.getOtp());
    }

    @PostMapping("/resend-otp")
    public ApiResponse<OtpResponse> resendOtp(@RequestBody @Valid OtpRequest request) {
        return otpVerificationService.resendOtp(request.getEmail());
    }

    // ============ AVATAR & PROFILE ============

    /**
     * Upload avatar for user
     * POST /users/{id}/avatar
     *
     * Request body: form-data
     * - file: MultipartFile (Hình ảnh)
     */
    @PostMapping("/{id}/avatar")
    public ApiResponse<String> uploadAvatar(
            @PathVariable String id,
            @ModelAttribute @Valid AvatarUploadRequest request) {
        String avatarUrl = avatarService.uploadAvatar(id, request);
        return ApiResponse.<String>builder()
                .code(1000)
                .message("Cập nhật ảnh đại diện thành công")
                .result(avatarUrl)
                .build();
    }

    @GetMapping("/{id}/profile")
    public ApiResponse<UserResponse> getUserProfile(@PathVariable String id) {
        return ApiResponse.<UserResponse>builder()
                .code(1000)
                .result(avatarService.getUserProfile(id))
                .build();
    }

    @PutMapping("/my-info/change-password")
    public ApiResponse<String> changePassword(@RequestBody @Valid ChangePasswordRequest request) {
        userService.changePassword(request);
        return ApiResponse.<String>builder()
                .code(1000)
                .message("Đổi mật khẩu thành công")
                .build();
    }

    @PostMapping("/sync-data")
    public ApiResponse<String> syncHistoricalData() {
        userService.syncHistoricalSpendingAndPoints();
        return ApiResponse.<String>builder()
                .code(1000)
                .message("Đồng bộ dữ liệu chi tiêu và điểm thưởng thành công!")
                .build();
    }
}
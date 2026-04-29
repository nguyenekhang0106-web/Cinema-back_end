package com.devteria.cinemaback_end.user.controller;

import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.user.dto.*;
import com.devteria.cinemaback_end.user.entity.Role;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.entity.enums.RoleName;
import com.devteria.cinemaback_end.user.mapper.UserMapper;
import com.devteria.cinemaback_end.user.repository.RoleRepository;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import com.devteria.cinemaback_end.user.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.HashSet;
import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserService userService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final EmailSenderService emailSenderService;
    
    // NEW SERVICES
    private final RegistrationService registrationService;
    private final OtpVerificationService otpVerificationService;
    private final RegistrationOtpService registrationOtpService;
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

    @PutMapping("/my-info") // Bỏ phần /{id} đi
    public ApiResponse<UserResponse> updateMyInfo(@RequestBody @Valid UserRequest request) { // Bỏ @PathVariable
        return ApiResponse.<UserResponse>builder()
                .code(1000)
                .message("Cập nhật thông tin thành công")
                .result(userService.updateUser(request))
                .build();
    }

    @GetMapping("/myInfo")
    ApiResponse<UserResponse> getMyInfo(){
        ApiResponse<UserResponse> response = new ApiResponse<>();
        response.setResult(userService.getMyInfo());
        return response;
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ApiResponse.<String>builder()
                .code(1000)
                .message("Xóa tài khoản thành công")
                .build();
    }

    // ============ NEW REGISTRATION FLOW (v2) ============

    /**
     * New registration endpoint with OTP verification
     * POST /users/register
     */
    @PostMapping("/register")
    public ApiResponse<OtpResponse> register(@RequestBody @Valid UserRequest request) {
        return registrationService.register(request);
    }

    /**
     * Verify OTP code
     * POST /users/verify-otp
     */
    @PostMapping("/verify-otp")
    public ApiResponse<UserResponse> verifyOtp(@RequestBody @Valid VerifyOtpRequest request) {
        return otpVerificationService.verifyOtp(request.getEmail(), request.getOtp());
    }

    /**
     * Resend OTP
     * POST /users/resend-otp
     */
    @PostMapping("/resend-otp")
    public ApiResponse<OtpResponse> resendOtp(@RequestBody @Valid OtpRequest request) {
        return otpVerificationService.resendOtp(request.getEmail());
    }

    /**
     * Upload avatar for user
     * POST /users/{id}/avatar
     * 
     * Request body: form-data
     * - file: MultipartFile
     * - folder: String (always "avatar")
     * - filename: String (format: "user{id}Avatar.{ext}")
     */
    @PostMapping("/{id}/avatar")
    public ApiResponse<String> uploadAvatar(
            @PathVariable String id,
            @ModelAttribute AvatarUploadRequest request) {
        String avatarUrl = avatarService.uploadAvatar(id, request);
        return ApiResponse.<String>builder()
                .code(1000)
                .message("Cập nhật ảnh đại diện thành công")
                .result(avatarUrl)
                .build();
    }

    /**
     * Get user profile with absolute avatar URL
     * GET /users/{id}/profile
     * 
     * Returns user profile with absolute S3 URL for avatar
     */
    @GetMapping("/{id}/profile")
    public ApiResponse<UserResponse> getUserProfile(@PathVariable String id) {
        UserResponse profile = avatarService.getUserProfile(id);
        return ApiResponse.<UserResponse>builder()
                .code(1000)
                .result(profile)
                .build();
    }
}

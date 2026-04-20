package com.devteria.cinemaback_end.user.controller;

import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.user.dto.UserRequest;
import com.devteria.cinemaback_end.user.dto.UserResponse;
import com.devteria.cinemaback_end.user.dto.ResendVerificationRequest;
import com.devteria.cinemaback_end.user.dto.VerifyEmailRequest;
import com.devteria.cinemaback_end.user.entity.Role;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.entity.enums.RoleName;
import com.devteria.cinemaback_end.user.mapper.UserMapper;
import com.devteria.cinemaback_end.user.repository.RoleRepository;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import com.devteria.cinemaback_end.user.service.EmailSenderService;
import com.devteria.cinemaback_end.user.service.EmailVerificationCodeStore;
import com.devteria.cinemaback_end.user.service.UserService;
import jakarta.transaction.Transactional;
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
    private final EmailVerificationCodeStore emailVerificationCodeStore;

    @PostMapping
    @Transactional
    public ApiResponse<UserResponse> createUser(@RequestBody @Valid UserRequest request) {
        try {
            User user = userMapper.toUser(request);
            user.setPassword(passwordEncoder.encode(request.getPassword()));

            HashSet<Role> roles = new HashSet<>();
            roleRepository.findByName(RoleName.USER).ifPresent(roles::add);
            user.setRoles(roles);

            user.setEmailVerified(false);

            user = userRepository.save(user);

            String code = String.format("%06d", RANDOM.nextInt(1_000_000));
            String verificationToken = emailVerificationCodeStore.putAndIssueToken(user.getEmail(), code);
            emailSenderService.sendVerificationCode(user.getEmail(), user.getFullName(), code);
            UserResponse userResponse = userMapper.toUserResponse(user);
            userResponse.setVerificationToken(verificationToken);

            return ApiResponse.<UserResponse>builder()
                    .code(1000)
                    .message("Đã gửi email chứa mã 6 số xác thực. Vui lòng nhập mã trên ứng dụng để kích hoạt tài khoản.")
                    .result(userResponse)
                    .build();
        } catch (DataIntegrityViolationException e) {
            String message = e.getMessage();
            if (message != null && message.contains("email")) {
                throw new AppException(ErrorCode.EMAIL_EXISTED);
            } else if (message != null && message.contains("phone")) {
                throw new AppException(ErrorCode.PHONE_EXISTED);
            } else if (message != null && message.contains("citizen_id")) {
                throw new AppException(ErrorCode.CITIZEN_ID_EXISTED);
            }
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @PostMapping("/verify-email")
    public ApiResponse<UserResponse> verifyEmail(@RequestBody @Valid VerifyEmailRequest request) {
        String token = request.getVerificationToken();
        
        // Check if already exceeded maximum attempts
        if (emailVerificationCodeStore.hasExceededAttempts(token)) {
            throw new AppException(ErrorCode.VERIFICATION_ATTEMPTS_EXCEEDED);
        }
        
        String email = emailVerificationCodeStore.consumeIfValidByToken(token, request.getCode());
        if (email == null) {
            // Increment failed attempt counter
            int currentAttempt = emailVerificationCodeStore.incrementFailedAttempt(token);
            int remainingAttempts = 3 - currentAttempt;
            
            // Check if exceeded after this attempt
            if (remainingAttempts <= 0) {
                throw new AppException(ErrorCode.VERIFICATION_ATTEMPTS_EXCEEDED,
                    "Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã xác thực.");
            }
            
            throw new AppException(ErrorCode.INVALID_VERIFICATION_CODE,
                String.format("Mã xác thực không đúng. Bạn còn %d lần nhập", remainingAttempts));
        }
        
        int rowsUpdated = userRepository.verifyEmailByAddress(email);
        if (rowsUpdated == 0) {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN));
            if (user.isEmailVerified()) {
                return ApiResponse.<UserResponse>builder()
                        .code(1000)
                        .message("Email đã được xác thực trước đó.")
                        .result(userMapper.toUserResponse(user))
                        .build();
            }
            throw new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN);
        }
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN));
        return ApiResponse.<UserResponse>builder()
                .code(1000)
                .message("Xác thực email thành công. Bạn có thể đăng nhập.")
                .result(userMapper.toUserResponse(user))
                .build();
    }

    @PostMapping("/resend-verification")
    public ApiResponse<Void> resendVerification(@RequestBody @Valid ResendVerificationRequest request) {
        String token = request.getVerificationToken();
        
        // Check if still in cooldown period (5 minutes)
        if (!emailVerificationCodeStore.canResend(token)) {
            long remainingSeconds = emailVerificationCodeStore.getResendCooldownRemaining(token);
            long remainingMinutes = (remainingSeconds + 59) / 60; // Round up
            throw new AppException(ErrorCode.RESEND_TOO_FREQUENT, 
                String.format("Vui lòng chờ %d phút trước khi resend", remainingMinutes));
        }
        
        String email = emailVerificationCodeStore.getEmailByToken(token);
        if (email == null) {
            throw new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN);
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN));

        if (user.isEmailVerified()) {
            return ApiResponse.<Void>builder()
                    .code(1000)
                    .message("Email đã được xác thực trước đó.")
                    .build();
        }

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        emailVerificationCodeStore.refreshToken(token, user.getEmail(), code);
        emailVerificationCodeStore.resetAttempts(token); // Reset attempt counter on resend
        emailVerificationCodeStore.markResendCooldown(token); // Lock resend for 5 minutes
        emailSenderService.sendVerificationCode(user.getEmail(), user.getFullName(), code);

        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Đã gửi lại mã xác thực email.")
                .build();
    }

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
}

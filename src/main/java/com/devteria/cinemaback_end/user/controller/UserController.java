package com.devteria.cinemaback_end.user.controller;

import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.user.dto.UserRequest;
import com.devteria.cinemaback_end.user.dto.UserResponse;
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
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
    public ApiResponse<UserResponse> createUser(@RequestBody @Valid UserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }
        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone())) {
            throw new AppException(ErrorCode.PHONE_EXISTED);
        }
        if (request.getCitizenIdNumber() != null && userRepository.existsByCitizenIdNumber(request.getCitizenIdNumber())) {
            throw new AppException(ErrorCode.CITIZEN_ID_EXISTED);
        }

        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        HashSet<Role> roles = new HashSet<>();
        roleRepository.findByName(RoleName.USER).ifPresent(roles::add);
        user.setRoles(roles);

        user.setEmailVerified(false);

        user = userRepository.save(user);

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        emailVerificationCodeStore.put(user.getEmail(), code);
        emailSenderService.sendVerificationCode(user.getEmail(), user.getFullName(), code);

        return ApiResponse.<UserResponse>builder()
                .code(1000)
                .message("Đã gửi email chứa mã 6 số xác thực. Vui lòng nhập mã trên ứng dụng để kích hoạt tài khoản.")
                .result(userMapper.toUserResponse(user))
                .build();
    }

    @PostMapping("/verify-email")
    public ApiResponse<UserResponse> verifyEmail(@RequestBody @Valid VerifyEmailRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN));
        if (user.isEmailVerified()) {
            return ApiResponse.<UserResponse>builder()
                    .code(1000)
                    .message("Email đã được xác thực trước đó.")
                    .result(userMapper.toUserResponse(user))
                    .build();
        }
        if (!emailVerificationCodeStore.consumeIfValid(request.getEmail(), request.getCode())) {
            throw new AppException(ErrorCode.INVALID_VERIFICATION_TOKEN);
        }
        user.setEmailVerified(true);
        userRepository.save(user);
        return ApiResponse.<UserResponse>builder()
                .code(1000)
                .message("Xác thực email thành công. Bạn có thể đăng nhập.")
                .result(userMapper.toUserResponse(user))
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

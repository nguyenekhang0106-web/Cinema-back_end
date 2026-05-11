package com.devteria.cinemaback_end.user.service;

import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.user.dto.UserRequest;
import com.devteria.cinemaback_end.user.dto.UserUpdateRequest; // 🔥 THÊM IMPORT
import com.devteria.cinemaback_end.user.dto.ChangePasswordRequest;
import com.devteria.cinemaback_end.user.dto.UserResponse;
import com.devteria.cinemaback_end.user.entity.Role;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.entity.enums.RoleName;
import com.devteria.cinemaback_end.user.mapper.UserMapper;
import com.devteria.cinemaback_end.user.repository.RoleRepository;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import com.devteria.cinemaback_end.util.S3Service;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.apache.commons.text.StringEscapeUtils;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserService {
    UserRepository userRepository;
    RoleRepository roleRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    S3Service s3Service;

    private static final String DEFAULT_AVATAR_KEY = "avatar/DefaultAvatar.png";

    // ... (Giữ nguyên createUser, getUsers, getUser, getMyInfo) ...

    public UserResponse createUser(UserRequest request) {
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
        user.setAvatarUrl(DEFAULT_AVATAR_KEY); // Dùng hằng số

        if (user.getFullName() != null && !user.getFullName().isEmpty()) {
            user.setFullName(StringEscapeUtils.escapeHtml4(user.getFullName()));
        }

        HashSet<Role> roles = new HashSet<>();
        roleRepository.findByName(RoleName.USER).ifPresent(roles::add);
        user.setRoles(roles);
        user.setEmailVerified(true);

        user = userRepository.save(user);
        return buildUserResponse(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getUsers() {
        log.info("In method get Users");
        return userRepository.findAll()
                .stream()
                .map(this::buildUserResponse)
                .toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse getUser(String id) {
        log.info("In method get user by id");
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return buildUserResponse(user);
    }

    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String email = context.getAuthentication().getName();

        User user = userRepository.findByEmail(email).orElseThrow(
                () -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return buildUserResponse(user);
    }

    // 🔥 SỬA THAM SỐ THÀNH UserUpdateRequest
    public UserResponse updateUser(UserUpdateRequest request) {
        var context = SecurityContextHolder.getContext();
        String currentEmail = context.getAuthentication().getName();

        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Bỏ logic check Email vì chúng ta không cho đổi email trong form này nữa

        if (request.getPhone() != null
                && !request.getPhone().equals(user.getPhone())
                && userRepository.existsByPhone(request.getPhone())) {
            throw new AppException(ErrorCode.PHONE_EXISTED);
        }

        if (request.getCitizenIdNumber() != null
                && !request.getCitizenIdNumber().equals(user.getCitizenIdNumber())
                && userRepository.existsByCitizenIdNumber(request.getCitizenIdNumber())) {
            throw new AppException(ErrorCode.CITIZEN_ID_EXISTED);
        }

        // 🔥 GỌI HÀM MAP MỚI TẠO Ở UserMapper
        userMapper.updateUserFromRequest(user, request);

        if (user.getFullName() != null && !user.getFullName().isEmpty()) {
            user.setFullName(StringEscapeUtils.escapeHtml4(user.getFullName()));
        }

        return buildUserResponse(userRepository.save(user));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }

    // =========================
    // HELPER METHOD
    // =========================
    private UserResponse buildUserResponse(User user) {
        UserResponse response = userMapper.toUserResponse(user);

        String key = (user.getAvatarUrl() != null && !user.getAvatarUrl().isBlank())
                ? user.getAvatarUrl()
                : DEFAULT_AVATAR_KEY;

        response.setAvatarUrl(s3Service.buildS3Url(key));
        return response;
    }

    public void changePassword(ChangePasswordRequest request) {
        var context = SecurityContextHolder.getContext();
        String currentEmail = context.getAuthentication().getName();

        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Kiểm tra mật khẩu cũ có đúng không
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.PASSWORD_NOT_CORRECT); // Nhớ thêm mã lỗi này vào ErrorCode nếu chưa có
        }

        // Kiểm tra mật khẩu mới có trùng mật khẩu cũ không
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new AppException(ErrorCode.PASSWORD_ALREADY_USED);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
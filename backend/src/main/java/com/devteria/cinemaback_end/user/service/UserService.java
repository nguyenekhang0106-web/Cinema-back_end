package com.devteria.cinemaback_end.user.service;

import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.user.dto.UserRequest;
import com.devteria.cinemaback_end.user.dto.UserResponse;
import com.devteria.cinemaback_end.user.entity.Role;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.entity.enums.RoleName;
import com.devteria.cinemaback_end.user.mapper.UserMapper;
import com.devteria.cinemaback_end.user.repository.RoleRepository;
import com.devteria.cinemaback_end.user.repository.UserRepository;
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

    public UserResponse createUser(UserRequest request) {
        // Đồng bộ ném ra AppException thay vì RuntimeException
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

        if (user.getFullName() != null && !user.getFullName().isEmpty()) {
            user.setFullName(StringEscapeUtils.escapeHtml4(user.getFullName()));
        }

        HashSet<Role> roles = new HashSet<>();
        roleRepository.findByName(RoleName.USER).ifPresent(roles::add);
        user.setRoles(roles);
        user.setEmailVerified(true);

        user = userRepository.save(user);
        return userMapper.toUserResponse(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getUsers() {
        log.info("In method get Users");
        return userRepository.findAll()
                .stream()
                .map(userMapper::toUserResponse)
                .toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse getUser(String id) {
        log.info("In method get user by id");
        return userMapper.toUserResponse(userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED))); // Thay RuntimeException
    }

    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String email = context.getAuthentication().getName();

        User user = userRepository.findByEmail(email).orElseThrow(
                () -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return userMapper.toUserResponse(user);
    }

    // Xóa truyền id trên URL và xóa @PostAuthorize để bảo mật
    public UserResponse updateUser(UserRequest request) {
        // 1. Định danh chính xác user đang thực hiện request thông qua Token
        var context = SecurityContextHolder.getContext();
        String currentEmail = context.getAuthentication().getName();

        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // 2. Kiểm tra tính duy nhất (Unique)
        // Lưu ý: Chỉ báo lỗi khi user đổi sang một thông tin mới MÀ thông tin đó đã tồn tại trong DB
        if (!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

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

        // 3. Map dữ liệu mới vào user hiện tại và lưu xuống DB
        userMapper.updateUser(user, request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        if (user.getFullName() != null && !user.getFullName().isEmpty()) {
            user.setFullName(StringEscapeUtils.escapeHtml4(user.getFullName()));
        }
        return userMapper.toUserResponse(userRepository.save(user));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }
}
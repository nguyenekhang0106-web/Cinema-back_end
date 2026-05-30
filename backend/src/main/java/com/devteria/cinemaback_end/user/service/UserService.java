package com.devteria.cinemaback_end.user.service;

import com.devteria.cinemaback_end.booking.repository.BookingRepository;
import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.user.dto.UserRequest;
import com.devteria.cinemaback_end.user.dto.UserUpdateRequest; // 🔥 THÊM IMPORT
import com.devteria.cinemaback_end.user.dto.ChangePasswordRequest;
import com.devteria.cinemaback_end.user.dto.UserResponse;
import com.devteria.cinemaback_end.user.entity.Role;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.entity.enums.MemberTier;
import com.devteria.cinemaback_end.user.entity.enums.RoleName;
import com.devteria.cinemaback_end.user.mapper.UserMapper;
import com.devteria.cinemaback_end.user.repository.RoleRepository;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import com.devteria.cinemaback_end.util.S3Service;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.apache.commons.text.StringEscapeUtils;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;

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
    BookingRepository bookingRepository;

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

    @Transactional
    public void syncHistoricalSpendingAndPoints1() {
        log.info("Bắt đầu đồng bộ dữ liệu chi tiêu và điểm thưởng cho toàn bộ User...");
        List<User> users = userRepository.findAll();

        for (User user : users) {
            // 1. Gọi DB lấy tổng tiền đã tiêu (Chỉ lấy đơn PAID)
            Double totalSpent = bookingRepository.sumTotalSpendingByCustomerId(user.getId());

            if (totalSpent == null) {
                totalSpent = 0.0;
            }

            // 2. Cập nhật lại số liệu
            user.setTotalSpending(totalSpent);

            // 3. Quy đổi điểm (10.000đ = 1đ)
            int earnedPoints = (int) (totalSpent / 10000);
            user.setTotalRewardPoints(earnedPoints);

            // 4. 🔥 XÉT LẠI HẠNG CHO CÁC TÀI KHOẢN CŨ
            if (totalSpent >= 5000000) {
                user.setMemberTier(MemberTier.PLATINUM);
            } else if (totalSpent >= 3000000) {
                user.setMemberTier(MemberTier.GOLD);
            } else if (totalSpent >= 1500000) {
                user.setMemberTier(MemberTier.SILVER);
            } else {
                user.setMemberTier(MemberTier.BASIC);
            }
        }

        userRepository.saveAll(users);
        log.info("Đã đồng bộ xong dữ liệu cho {} users!", users.size());
    }

    @Transactional
    public void syncHistoricalSpendingAndPoints() {
        log.info("Đang đồng bộ chi tiêu năm {}...", java.time.LocalDate.now().getYear());
        List<User> users = userRepository.findAll();

        for (User user : users) {
            // Lấy doanh thu CHỈ TRONG NĂM NAY
            Double yearSpending = bookingRepository.sumCurrentYearSpendingByCustomerId(user.getId());
            if (yearSpending == null) yearSpending = 0.0;

            user.setTotalSpending(yearSpending);

            // Logic xét hạng dựa trên doanh thu năm nay
            if (yearSpending >= 5000000) user.setMemberTier(MemberTier.PLATINUM);
            else if (yearSpending >= 3000000) user.setMemberTier(MemberTier.GOLD);
            else if (yearSpending >= 1500000) user.setMemberTier(MemberTier.SILVER);
            else user.setMemberTier(MemberTier.BASIC);

            // Lưu ý: Điểm thưởng (Reward Points) thường là tích lũy trọn đời hoặc lâu dài,
            // nên ta KHÔNG lọc theo năm khi tính điểm để tránh thiệt cho khách.
        }
        userRepository.saveAll(users);
    }

    @Scheduled(cron = "0 0 0 1 1 ?")
    @Transactional
    public void scheduleYearlyReset() {
        log.info("Bắt đầu thực hiện chiến dịch Năm Mới: Reset Chi tiêu và Hạng thành viên...");
        userRepository.resetYearlySpendingAndTier(MemberTier.BASIC);
        log.info("Hoàn tất chiến dịch Reset Năm Mới!");
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateUserByAdmin(String id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

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

        userMapper.updateUserFromRequest(user, request);

        return buildUserResponse(userRepository.save(user));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse toggleUserStatus(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        user.setEmailVerified(!user.isEmailVerified());

        return buildUserResponse(userRepository.save(user));
    }
}
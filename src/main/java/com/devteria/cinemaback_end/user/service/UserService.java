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
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserService {
    UserRepository userRepository;
    RoleRepository roleRepository; // Inject thêm repository này
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;

    public UserResponse createUser(UserRequest request) {
        // Kiểm tra chặt chẽ các trường Unique
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng");
        }
        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Số điện thoại đã được sử dụng");
        }
        if (request.getCitizenIdNumber() != null && userRepository.existsByCitizenIdNumber(request.getCitizenIdNumber())) {
            throw new RuntimeException("CCCD đã được sử dụng");
        }

        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // Gán Role mặc định là USER từ Database
        HashSet<Role> roles = new HashSet<>();
        roleRepository.findByName(RoleName.USER).ifPresent(roles::add);
        user.setRoles(roles);

        user = userRepository.save(user);
        return userMapper.toUserResponse(user);
    }

    //    @PreAuthorize("hasAuthority('APPROVE_POST')")    ---> Map đúng với tên của Authority truyền vào
    @PreAuthorize("hasRole('ADMIN')") // Mặc định sẽ map với prefix "ROLE_" ở trước
    public List<UserResponse> getUsers(){ //Chỉ ADMIN ms xem được tất cả thông tin của tất cả user
        log.info("In method get Users");
        return userRepository.findAll()
                .stream()
                .map(userMapper::toUserResponse)
                .toList();
    }

    //truy vấn DB trước nếu response trả về có email khớp với enamil ở phần "sub" khi decode token ra
    //thì mới trả vè thông tin user
    @PostAuthorize("returnObject.email == authentication.name")
    public UserResponse getUser(String id){
        log.info("In method get user by id");
        return userMapper.toUserResponse(userRepository.findById(id).orElseThrow(()
                -> new RuntimeException("User not found")));
    }


    //Hàm xem thông tin các nhân phải đúng token của người đăng nhập
    //Cách đối chiếu là so sánh địa chỉ email trong token ở sub khi được decode ra giống email có sẵn
    // trong DB thì mới cho xem thông tin
    public UserResponse getMyInfo(){
        var context = SecurityContextHolder.getContext();
        String email = context.getAuthentication().getName();

        User user = userRepository.findByEmail(email).orElseThrow(
                () -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return userMapper.toUserResponse(user);
    }

    public UserResponse updateUser(String id, UserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        userMapper.updateUser(user, request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user = userRepository.save(user);
        return userMapper.toUserResponse(user);
    }

    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }
}

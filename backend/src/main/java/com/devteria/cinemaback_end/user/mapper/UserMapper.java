package com.devteria.cinemaback_end.user.mapper;

import com.devteria.cinemaback_end.user.dto.UserRequest;
import com.devteria.cinemaback_end.user.dto.UserUpdateRequest; // 🔥 THÊM IMPORT
import com.devteria.cinemaback_end.user.dto.UserResponse;
import com.devteria.cinemaback_end.user.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "memberTier", ignore = true)
    @Mapping(target = "totalRewardPoints", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "emailVerified", ignore = true)
    User toUser(UserRequest request);

    UserResponse toUserResponse(User user);

    // Hàm cũ dùng cho UserRequest (có thể giữ lại nếu bạn còn tính năng nào dùng tới nó)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "memberTier", ignore = true)
    @Mapping(target = "totalRewardPoints", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "emailVerified", ignore = true)
    void updateUser(@MappingTarget User user, UserRequest request);

    // 🔥 HÀM MỚI DÀNH RIÊNG CHO UserUpdateRequest
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "email", ignore = true) // Bỏ qua email vì không cho đổi
    @Mapping(target = "password", ignore = true) // Bỏ qua password vì không cho đổi
    @Mapping(target = "memberTier", ignore = true)
    @Mapping(target = "totalRewardPoints", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "emailVerified", ignore = true)
    @Mapping(target = "avatarUrl", ignore = true)
    void updateUserFromRequest(@MappingTarget User user, UserUpdateRequest request);
}
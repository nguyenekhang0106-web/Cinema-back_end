package com.devteria.cinemaback_end.user.mapper;

import com.devteria.cinemaback_end.user.dto.UserRequest;
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
    @Mapping(target = "cinema", ignore = true)
    User toUser(UserRequest request);

    UserResponse toUserResponse(User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "memberTier", ignore = true)
    @Mapping(target = "totalRewardPoints", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "cinema", ignore = true)
    void updateUser(@MappingTarget User user, UserRequest request);
}
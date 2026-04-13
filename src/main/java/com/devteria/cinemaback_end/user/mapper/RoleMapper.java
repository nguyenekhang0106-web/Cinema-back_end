package com.devteria.cinemaback_end.user.mapper;

import com.devteria.cinemaback_end.user.dto.RoleRequest;
import com.devteria.cinemaback_end.user.dto.RoleResponse;
import com.devteria.cinemaback_end.user.entity.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    @Mapping(target = "id", ignore = true)
    Role toRole(RoleRequest request);

    RoleResponse toRoleResponse(Role role);
}
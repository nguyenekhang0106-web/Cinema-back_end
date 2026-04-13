package com.devteria.cinemaback_end.user.service;

import com.devteria.cinemaback_end.user.dto.RoleRequest;
import com.devteria.cinemaback_end.user.dto.RoleResponse;
import com.devteria.cinemaback_end.user.entity.Role;
import com.devteria.cinemaback_end.user.mapper.RoleMapper;
import com.devteria.cinemaback_end.user.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleService {
    private final RoleRepository roleRepository;
    private final RoleMapper roleMapper;

    public RoleResponse createRole(RoleRequest request) {
        // Kiểm tra xem quyền này đã được tạo trước đó chưa
        if (roleRepository.existsByName(request.getName())) {
            throw new RuntimeException("Quyền (Role) này đã tồn tại trong hệ thống");
        }

        Role role = roleMapper.toRole(request);
        role = roleRepository.save(role);

        return roleMapper.toRoleResponse(role);
    }

    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(roleMapper::toRoleResponse)
                .toList();
    }

    public void deleteRole(String id) {
        roleRepository.deleteById(id);
    }
}
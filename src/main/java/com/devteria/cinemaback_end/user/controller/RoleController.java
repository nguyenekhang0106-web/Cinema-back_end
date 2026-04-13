package com.devteria.cinemaback_end.user.controller;

import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.user.dto.RoleRequest;
import com.devteria.cinemaback_end.user.dto.RoleResponse;
import com.devteria.cinemaback_end.user.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
public class RoleController {
    private final RoleService roleService;

    @PostMapping
    public ApiResponse<RoleResponse> createRole(@RequestBody @Valid RoleRequest request) {
        return ApiResponse.<RoleResponse>builder()
                .code(1000)
                .message("Tạo quyền thành công")
                .result(roleService.createRole(request))
                .build();
    }

    @GetMapping
    public ApiResponse<List<RoleResponse>> getAllRoles() {
        return ApiResponse.<List<RoleResponse>>builder()
                .code(1000)
                .result(roleService.getAllRoles())
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteRole(@PathVariable String id) {
        roleService.deleteRole(id);
        return ApiResponse.<String>builder()
                .code(1000)
                .message("Xóa quyền thành công")
                .build();
    }
}
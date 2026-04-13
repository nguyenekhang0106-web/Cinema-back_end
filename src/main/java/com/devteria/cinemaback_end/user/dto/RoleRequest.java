package com.devteria.cinemaback_end.user.dto;

import com.devteria.cinemaback_end.user.entity.enums.RoleName;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoleRequest {

    @NotNull(message = "Tên quyền không được để trống")
    RoleName name; // Sử dụng thẳng Enum ở đây để chặn dữ liệu rác từ Frontend

    String description;
}
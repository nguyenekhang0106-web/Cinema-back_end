package com.devteria.cinemaback_end.user.dto;

import com.devteria.cinemaback_end.user.entity.enums.RoleName;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoleResponse {
    String id;
    RoleName name;
    String description;
}
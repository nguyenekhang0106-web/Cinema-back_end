package com.devteria.cinemaback_end.user.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Role {
    @Id
    String name; // Tên quyền, ví dụ: "ADMIN", "USER", "STAFF"

    String description; // Mô tả ý nghĩa của quyền này
}
package com.devteria.cinemaback_end.concession.dto;

import com.devteria.cinemaback_end.concession.entity.enums.ConcessionCategory;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConcessionResponse {
    String id;
    String name;
    String description;
    Double price;
    String imageUrl;
    ConcessionCategory category;
    Boolean active; // Đổi từ isActive thành active
}
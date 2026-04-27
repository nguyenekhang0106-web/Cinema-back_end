package com.devteria.cinemaback_end.concession.dto;

import com.devteria.cinemaback_end.concession.entity.enums.ConcessionCategory;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConcessionRequest {

    @NotBlank(message = "CONCESSION_NAME_NOT_BLANK")
    String name;

    String description;

    @NotNull(message = "PRICE_NOT_NULL")
    @Min(value = 0, message = "PRICE_MIN_INVALID") // Giá có thể là 0 (nếu là quà tặng kèm), nhưng không được âm
    Double price;

    String imageUrl;

    @NotNull(message = "CATEGORY_NOT_NULL")
    ConcessionCategory category;

    Boolean active; // Đổi từ isActive thành active
}
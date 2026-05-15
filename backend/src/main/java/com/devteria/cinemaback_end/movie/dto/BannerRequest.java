package com.devteria.cinemaback_end.movie.dto;

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
public class BannerRequest {
    String title;

    @NotBlank(message = "IMAGE_URL_NOT_BLANK")
    String imageUrl;

    String link;

    @NotNull(message = "DISPLAY_ORDER_NOT_NULL")
    @Min(value = 0, message = "DISPLAY_ORDER_INVALID")
    Integer displayOrder;

    boolean active;

    // 🔥 BỔ SUNG TRƯỜNG NHẬN ID RẠP TỪ FRONTEND
    String cinemaId;
}
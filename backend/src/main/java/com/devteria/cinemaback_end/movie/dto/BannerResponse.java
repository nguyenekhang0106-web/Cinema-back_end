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
public class BannerResponse {
    String id;
    String title;
    String imageUrl;
    String link;
    Integer displayOrder;
    boolean active;
}
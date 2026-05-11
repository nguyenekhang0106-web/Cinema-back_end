package com.devteria.cinemaback_end.movie.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MovieImageUploadRequest {

    // 🔥 Đã xóa @NotNull để cho phép update 1 ảnh hoặc không up ảnh nào
    MultipartFile posterFile;

    // 🔥 Đã xóa @NotNull
    MultipartFile bannerFile;
}
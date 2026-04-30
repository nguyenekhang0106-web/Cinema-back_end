package com.devteria.cinemaback_end.movie.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MovieImageUploadRequest {

    @NotNull(message = "File không được để trống")
    MultipartFile file;

    @NotNull(message = "Loại ảnh không được để trống (poster hoặc banner)")
    ImageType imageType; // POSTER hoặc BANNER

    public enum ImageType {
        POSTER,
        BANNER
    }
}

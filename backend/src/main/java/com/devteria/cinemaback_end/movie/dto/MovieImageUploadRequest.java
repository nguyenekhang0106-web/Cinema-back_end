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

    @NotNull(message = "POSTER_IS_EMPTY")
    MultipartFile posterFile;

    @NotNull(message = "BANNER_IS_EMPTY")
    MultipartFile bannerFile;
}
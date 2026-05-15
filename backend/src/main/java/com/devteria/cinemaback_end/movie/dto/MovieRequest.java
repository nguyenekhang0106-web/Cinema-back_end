package com.devteria.cinemaback_end.movie.dto;

import com.devteria.cinemaback_end.movie.entity.enums.AgeRestriction;
import com.devteria.cinemaback_end.movie.entity.enums.Genre;
import com.devteria.cinemaback_end.movie.entity.enums.Language;
import com.devteria.cinemaback_end.movie.entity.enums.MovieStatus; // 🔥 IMPORT ENUM
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MovieRequest {

    @NotBlank(message = "TITLE_NOT_BLANK")
    String title;

    @NotNull(message = "DURATION_NOT_NULL")
    @Min(value = 30, message = "DURATION_MIN_INVALID")
    Integer durationMin;

    @NotNull(message = "GENRE_NOT_NULL")
    Genre genre;

    @NotNull(message = "LANGUAGE_NOT_NULL")
    Language language;

    @NotNull(message = "AGE_RESTRICTION_NOT_NULL")
    AgeRestriction ageRestriction;

    // Các trường này không có @NotNull nên đã được phép rỗng (null)
    String trailerUrl;

    String description;

    @NotNull(message = "RELEASE_DATE_NOT_NULL")
    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate releaseDate;

    // Đã xóa @NotEmpty để Admin có thể để trống đạo diễn nếu chưa biết
    Set<String> directors;

    // Đã xóa @NotEmpty để Admin có thể để trống diễn viên
    Set<String> actors;

    // 🔥 BỔ SUNG TRƯỜNG STATUS DẠNG ENUM VÀO ĐÂY
    @NotNull(message = "STATUS_NOT_NULL")
    MovieStatus status;

    Boolean featured;
}
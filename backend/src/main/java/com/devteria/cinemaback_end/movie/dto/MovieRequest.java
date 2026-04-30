package com.devteria.cinemaback_end.movie.dto;

import com.devteria.cinemaback_end.movie.entity.enums.AgeRestriction;
import com.devteria.cinemaback_end.movie.entity.enums.Genre;
import com.devteria.cinemaback_end.movie.entity.enums.Language;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.web.multipart.MultipartFile;
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

    MultipartFile posterFile;
    String trailerUrl;

    MultipartFile bannerFile;

    String description;

    @NotNull(message = "RELEASE_DATE_NOT_NULL")
    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate releaseDate;

    @NotEmpty(message = "DIRECTOR_NOT_EMPTY")
    Set<String> directors;

    @NotEmpty(message = "ACTORS_NOT_EMPTY")
    Set<String> actors;
}
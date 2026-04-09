package com.devteria.cinemaback_end.movie.dto;

import com.devteria.cinemaback_end.movie.entity.enums.AgeRestriction;
import com.devteria.cinemaback_end.movie.entity.enums.Genre;
import com.devteria.cinemaback_end.movie.entity.enums.Language;
import com.devteria.cinemaback_end.movie.entity.enums.MovieStatus;
import lombok.Builder;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MovieResponse {
    String id;
    String title;
    Integer durationMin;
    Genre genre;
    Language language;
    AgeRestriction ageRestriction;
    String posterUrl;
    String trailerUrl;
    String description;
    LocalDate releaseDate;
    LocalDate createdAt;
    MovieStatus status;
    String managerId; // Trả về ID của manager thay vì cả object User để tránh lặp lồng nhau
}

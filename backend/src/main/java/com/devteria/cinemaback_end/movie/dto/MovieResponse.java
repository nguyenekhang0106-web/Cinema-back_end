package com.devteria.cinemaback_end.movie.dto;

import com.devteria.cinemaback_end.movie.entity.enums.AgeRestriction;
import com.devteria.cinemaback_end.movie.entity.enums.Genre;
import com.devteria.cinemaback_end.movie.entity.enums.Language;
import com.devteria.cinemaback_end.movie.entity.enums.MovieStatus;
import lombok.Builder;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDate;
import java.util.Set;

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
    // BỔ SUNG TRƯỜNG NÀY
    String bannerUrl;

    String description;
    LocalDate releaseDate;
    LocalDate createdAt;
    MovieStatus status;
    String managerId;

    Set<String> directors;
    Set<String> actors;
    Boolean featured;
}
package com.devteria.cinemaback_end.movie.entity;

import com.devteria.cinemaback_end.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDate;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Movie {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id; // movieId

    String title;
    Integer durationMin;
    String genre;
    String language;
    String ageRestriction;
    String posterUrl;
    String trailerUrl;

    @Column(columnDefinition = "TEXT")
    String description;

    LocalDate releaseDate;
    String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    User manager;
}
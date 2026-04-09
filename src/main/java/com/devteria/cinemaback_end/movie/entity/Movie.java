package com.devteria.cinemaback_end.movie.entity;

import com.devteria.cinemaback_end.movie.entity.enums.AgeRestriction;
import com.devteria.cinemaback_end.movie.entity.enums.Genre;
import com.devteria.cinemaback_end.movie.entity.enums.Language;
import com.devteria.cinemaback_end.movie.entity.enums.MovieStatus;
import com.devteria.cinemaback_end.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDate;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false)
    @jakarta.validation.constraints.NotBlank
    String title;

    @Column(nullable = false)
    @jakarta.validation.constraints.Min(1)
    Integer durationMin;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    Genre genre;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    Language language;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    AgeRestriction ageRestriction;

    String posterUrl;
    String trailerUrl;

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(nullable = false)
    LocalDate releaseDate;

    @Column(updatable = false)
    LocalDate createdAt;
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDate.now();
    }

    @Builder.Default
    @Enumerated(EnumType.STRING)
    MovieStatus status = MovieStatus.COMING_SOON;



    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", nullable = false)
    User manager;
}
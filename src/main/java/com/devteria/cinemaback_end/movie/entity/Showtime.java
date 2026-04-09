package com.devteria.cinemaback_end.movie.entity;

import com.devteria.cinemaback_end.cinema.entity.Hall;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.movie.entity.enums.ShowtimeStatus;
import com.devteria.cinemaback_end.movie.entity.enums.ShowtimeFormat;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;

@Entity
@Table(indexes = {
        @Index(name = "idx_movie", columnList = "movie_id"),
        @Index(name = "idx_hall", columnList = "hall_id"),
        @Index(name = "idx_start_time", columnList = "startTime")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Showtime {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false)
    LocalDateTime startTime;

    @Column(nullable = false)
    LocalDateTime endTime;

    @Column(nullable = false)
    java.math.BigDecimal basePrice;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    ShowtimeStatus status;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    ShowtimeFormat format;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false)
    Movie movie;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hall_id", nullable = false)
    Hall hall;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    User manager;
}

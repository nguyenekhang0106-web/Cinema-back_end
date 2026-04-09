package com.devteria.cinemaback_end.movie.entity;

import com.devteria.cinemaback_end.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;

@Entity
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"customer_id", "movie_id"}),
        indexes = {
                @Index(name = "idx_movie", columnList = "movie_id"),
                @Index(name = "idx_customer", columnList = "customer_id")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false)
    @jakarta.validation.constraints.Min(1)
    @jakarta.validation.constraints.Max(5)
    Integer ratingScore;

    @jakarta.validation.constraints.Size(max = 1000)
    String comment;

    @Column(nullable = false, updatable = false)
    LocalDateTime postDate;

    @PrePersist
    public void prePersist() {
        this.postDate = LocalDateTime.now();
    }

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    User customer;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false)
    Movie movie;
}
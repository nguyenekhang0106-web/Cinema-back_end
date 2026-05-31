package com.devteria.cinemaback_end.movie.entity;

import com.devteria.cinemaback_end.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.HashSet;

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

    @Builder.Default
    Integer likeCount = 0;

    @Builder.Default
    Integer dislikeCount = 0;

    // 🔥 BỔ SUNG: Lưu danh sách ID của User đã Like/Dislike để chống spam
    @ElementCollection
    @CollectionTable(name = "review_likes", joinColumns = @JoinColumn(name = "review_id"))
    @Column(name = "user_id")
    @Builder.Default
    Set<String> likedByUsers = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "review_dislikes", joinColumns = @JoinColumn(name = "review_id"))
    @Column(name = "user_id")
    @Builder.Default
    Set<String> dislikedByUsers = new HashSet<>();

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    User customer;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false)
    Movie movie;
}
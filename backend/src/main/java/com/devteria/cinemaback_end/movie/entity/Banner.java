package com.devteria.cinemaback_end.movie.entity;

import com.devteria.cinemaback_end.cinema.entity.Cinema;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Banner {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String title; // Tên gợi nhớ banner

    @Column(nullable = false)
    String imageUrl;

    String link; // Đường dẫn khi click (ví dụ: /movie/uuid-phim)

    @Column(nullable = false)
    Integer displayOrder; // Thứ tự ưu tiên hiển thị

    @Builder.Default
    boolean active = true;

    // 🔥 BỔ SUNG QUAN HỆ VỚI RẠP CHIẾU
    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cinema_id") // Cho phép null
            Cinema cinema;
}
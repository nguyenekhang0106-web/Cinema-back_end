package com.devteria.cinemaback_end.cinema.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
// Đảm bảo tên phòng chiếu không bị trùng lặp TRONG CÙNG 1 RẠP
@Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = {"cinema_id", "name"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Hall {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false)
    String name;

    @Column(nullable = false)
    Integer totalSeats;

    @ToString.Exclude // Rất quan trọng để tránh lỗi lặp vô tận
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cinema_id", nullable = false)
    Cinema cinema;
}
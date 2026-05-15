package com.devteria.cinemaback_end.cinema.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
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

    // 🔥 GÁN MẶC ĐỊNH LÀ 0 KHI TẠO PHÒNG MỚI
    @Column(nullable = false)
    @Builder.Default
    Integer totalSeats = 0;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cinema_id", nullable = false)
    Cinema cinema;
}
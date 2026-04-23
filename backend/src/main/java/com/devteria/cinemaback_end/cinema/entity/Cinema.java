package com.devteria.cinemaback_end.cinema.entity;

import com.devteria.cinemaback_end.movie.entity.enums.Area;
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
public class Cinema {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false, unique = true)
    String name;

    @Column(nullable = false)
    String address;

    @Column(nullable = false)
    String hotline;

    // Đổi String thành Area và thêm @Enumerated
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    Area city;
}
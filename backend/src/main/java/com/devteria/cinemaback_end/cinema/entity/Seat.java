package com.devteria.cinemaback_end.cinema.entity;

import com.devteria.cinemaback_end.cinema.entity.enums.SeatStatus;
import com.devteria.cinemaback_end.cinema.entity.enums.SeatType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
// Đảm bảo không bị trùng ghế (VD: Không có 2 ghế A1 trong cùng 1 phòng)
@Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = {"hall_id", "row_name", "number"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "row_name", nullable = false)
    String rowName;

    @Column(nullable = false)
    Integer number;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    SeatType type;

    // Trạng thái vật lý của ghế, mặc định là dùng tốt
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    SeatStatus status = SeatStatus.AVAILABLE;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hall_id", nullable = false)
    Hall hall;
}
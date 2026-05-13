package com.devteria.cinemaback_end.booking.entity;

import com.devteria.cinemaback_end.booking.entity.enums.SeatHoldingStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "seat_holding",
        indexes = {
                @Index(name = "idx_seat_holding_booking", columnList = "booking_id"),
                @Index(name = "idx_seat_holding_showtime_seat_status", columnList = "showtime_id, seat_id, status"),
                @Index(name = "idx_seat_holding_status_expires", columnList = "status, expires_at")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatHolding {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "booking_id", nullable = false, length = 100)
    String bookingId;

    @Column(name = "showtime_id", nullable = false, length = 100)
    String showtimeId;

    @Column(name = "seat_id", nullable = false, length = 100)
    String seatId;

    @Column(name = "active_lock_key", unique = true, length = 220)
    String activeLockKey;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    SeatHoldingStatus status;

    @Column(name = "expires_at", nullable = false)
    LocalDateTime expiresAt;

    @Column(nullable = false)
    LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

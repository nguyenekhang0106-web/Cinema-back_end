package com.devteria.cinemaback_end.booking.entity;

import com.devteria.cinemaback_end.booking.entity.enums.TicketStatus;
import com.devteria.cinemaback_end.cinema.entity.Seat;
import com.devteria.cinemaback_end.movie.entity.Showtime;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(
        indexes = {
                @Index(name = "idx_ticket_showtime_seat", columnList = "showtime_id, seat_id"),
                @Index(name = "idx_ticket_booking", columnList = "booking_id"),
                @Index(name = "idx_ticket_code", columnList = "ticket_code")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_ticket_booking_seat", columnNames = {"booking_id", "seat_id"}),
                @UniqueConstraint(name = "uk_ticket_code", columnNames = {"ticket_code"})
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false)
    Double price;

    @Column(name = "active_lock_key", unique = true, length = 220)
    String activeLockKey;

    @Column(name = "ticket_code", length = 40)
    String ticketCode;

    @Column(name = "qr_code_url", length = 1024)
    String qrCodeUrl;

    LocalDateTime issuedAt;

    LocalDateTime scannedAt;

    @Column(length = 100)
    String scannedBy;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    @Builder.Default
    TicketStatus status = TicketStatus.PENDING;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "showtime_id", nullable = false)
    Showtime showtime;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_id", nullable = false)
    Seat seat;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    Booking booking;
}

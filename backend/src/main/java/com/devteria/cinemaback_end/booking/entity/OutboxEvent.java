package com.devteria.cinemaback_end.booking.entity;

import com.devteria.cinemaback_end.booking.entity.enums.OutboxEventStatus;
import com.devteria.cinemaback_end.booking.entity.enums.OutboxEventType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "outbox_event",
        indexes = {
                @Index(name = "idx_outbox_status_available", columnList = "status, available_at"),
                @Index(name = "idx_outbox_aggregate", columnList = "aggregate_id")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_outbox_event_key", columnNames = "event_key")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OutboxEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "event_type", nullable = false, length = 40)
    OutboxEventType eventType;

    @Column(name = "event_key", nullable = false, length = 120)
    String eventKey;

    @Column(name = "aggregate_id", nullable = false, length = 100)
    String aggregateId;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    String payload;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    @Builder.Default
    OutboxEventStatus status = OutboxEventStatus.PENDING;

    @Builder.Default
    Integer retryCount = 0;

    @Column(nullable = false)
    LocalDateTime createdAt;

    @Column(nullable = false)
    LocalDateTime availableAt;

    LocalDateTime sentAt;

    @Column(length = 1000)
    String errorMessage;

    LocalDateTime lockedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (availableAt == null) {
            availableAt = now;
        }
    }
}

package com.devteria.cinemaback_end.booking.repository;

import com.devteria.cinemaback_end.booking.entity.OutboxEvent;
import com.devteria.cinemaback_end.booking.entity.enums.OutboxEventStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, String> {

    boolean existsByEventKey(String eventKey);

    Optional<OutboxEvent> findByEventKey(String eventKey);

    @Query("""
            select event.id
            from OutboxEvent event
            where event.status in :statuses
              and event.availableAt <= :now
            order by event.createdAt asc
            """)
    List<String> findReadyEventIds(
            @Param("statuses") List<OutboxEventStatus> statuses,
            @Param("now") LocalDateTime now,
            Pageable pageable);

    @Modifying
    @Query("""
            update OutboxEvent event
            set event.status = :processingStatus,
                event.lockedAt = :now
            where event.id = :id
              and event.status in :readyStatuses
              and event.availableAt <= :now
            """)
    int claimEvent(
            @Param("id") String id,
            @Param("readyStatuses") List<OutboxEventStatus> readyStatuses,
            @Param("processingStatus") OutboxEventStatus processingStatus,
            @Param("now") LocalDateTime now);

    @Modifying
    @Query("""
            update OutboxEvent event
            set event.status = :pendingStatus,
                event.lockedAt = null,
                event.availableAt = :now,
                event.errorMessage = :reason
            where event.status = :processingStatus
              and event.lockedAt < :staleBefore
            """)
    int releaseStaleProcessingEvents(
            @Param("processingStatus") OutboxEventStatus processingStatus,
            @Param("pendingStatus") OutboxEventStatus pendingStatus,
            @Param("staleBefore") LocalDateTime staleBefore,
            @Param("now") LocalDateTime now,
            @Param("reason") String reason);

    @Modifying
    @Query("""
            update OutboxEvent event
            set event.status = :pendingStatus,
                event.retryCount = 0,
                event.lockedAt = null,
                event.availableAt = :now,
                event.errorMessage = :reason
            where event.status = :failedStatus
            """)
    int retryFailedEvents(
            @Param("failedStatus") OutboxEventStatus failedStatus,
            @Param("pendingStatus") OutboxEventStatus pendingStatus,
            @Param("now") LocalDateTime now,
            @Param("reason") String reason);
}

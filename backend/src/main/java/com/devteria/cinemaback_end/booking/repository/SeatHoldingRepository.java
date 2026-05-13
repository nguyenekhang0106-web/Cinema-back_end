package com.devteria.cinemaback_end.booking.repository;

import com.devteria.cinemaback_end.booking.entity.SeatHolding;
import com.devteria.cinemaback_end.booking.entity.enums.SeatHoldingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface SeatHoldingRepository extends JpaRepository<SeatHolding, String> {

    boolean existsByShowtimeIdAndSeatIdAndStatusIn(
            String showtimeId,
            String seatId,
            Collection<SeatHoldingStatus> statuses);

    List<SeatHolding> findByShowtimeIdAndStatusIn(String showtimeId, Collection<SeatHoldingStatus> statuses);

    List<SeatHolding> findByBookingId(String bookingId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<SeatHolding> findByBookingIdAndStatusIn(String bookingId, Collection<SeatHoldingStatus> statuses);

    List<SeatHolding> findByStatusAndExpiresAtBefore(SeatHoldingStatus status, LocalDateTime expiresAt);
}

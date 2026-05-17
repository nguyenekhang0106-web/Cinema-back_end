package com.devteria.cinemaback_end.movie.repository;

import com.devteria.cinemaback_end.movie.entity.Showtime;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, String> {

    // Đã thêm chuẩn xác
    List<Showtime> findByMovieId(String movieId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Showtime s where s.id = :id")
    Optional<Showtime> findByIdForUpdate(@Param("id") String id);

    @Query("SELECT COUNT(s) > 0 FROM Showtime s WHERE s.hall.id = :hallId " +
            "AND s.status != 'CANCELLED' " +
            "AND s.startTime < :newEndTime " +
            "AND s.endTime > :newStartTime")
    boolean existsOverlappingShowtime(@Param("hallId") String hallId,
                                      @Param("newStartTime") LocalDateTime newStartTime,
                                      @Param("newEndTime") LocalDateTime newEndTime);

    @Query("SELECT COUNT(s) > 0 FROM Showtime s WHERE s.hall.id = :hallId " +
            "AND s.status != 'CANCELLED' " +
            "AND s.id != :excludeId " +
            "AND s.startTime < :newEndTime " +
            "AND s.endTime > :newStartTime")
    boolean existsOverlappingShowtimeForUpdate(@Param("hallId") String hallId,
                                               @Param("newStartTime") LocalDateTime newStartTime,
                                               @Param("newEndTime") LocalDateTime newEndTime,
                                               @Param("excludeId") String excludeId);
}
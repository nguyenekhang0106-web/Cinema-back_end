package com.devteria.cinemaback_end.movie.repository;

import com.devteria.cinemaback_end.movie.entity.Showtime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ShowtimeRepository extends JpaRepository<Showtime, String> {
    List<Showtime> findByMovieId(String movieId);
}

package com.devteria.cinemaback_end.movie.repository;

import com.devteria.cinemaback_end.movie.entity.MovieReaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MovieReactionRepository extends JpaRepository<MovieReaction, String> {

    Optional<MovieReaction> findByUser_IdAndMovie_Id(String userId, String movieId);

    long countByMovie_IdAndLikedTrue(String movieId);

    long countByMovie_IdAndLikedFalse(String movieId);
}
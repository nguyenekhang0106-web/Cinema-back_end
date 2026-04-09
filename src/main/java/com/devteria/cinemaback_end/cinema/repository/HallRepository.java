package com.devteria.cinemaback_end.cinema.repository;

import com.devteria.cinemaback_end.cinema.entity.Hall;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HallRepository extends JpaRepository<Hall, String> {
}

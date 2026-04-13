package com.devteria.cinemaback_end.user.repository;

import com.devteria.cinemaback_end.user.entity.InvalidatedToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvalidatedRepository extends JpaRepository<InvalidatedToken, String> {
}

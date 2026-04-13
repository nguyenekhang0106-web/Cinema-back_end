package com.devteria.cinemaback_end.user.repository;

import com.devteria.cinemaback_end.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsByCitizenIdNumber(String citizenIdNumber);
    Optional<User> findByfullName(String fullName);
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
}
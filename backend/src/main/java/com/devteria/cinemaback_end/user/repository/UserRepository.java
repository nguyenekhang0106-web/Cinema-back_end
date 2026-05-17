package com.devteria.cinemaback_end.user.repository;

import com.devteria.cinemaback_end.user.entity.User;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    boolean existsByCitizenIdNumber(String citizenIdNumber);
    Optional<User> findByfullName(String fullName);
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);

    @Transactional
    @Modifying
    @Query("UPDATE User u SET u.emailVerified = true WHERE u.email = :email AND u.emailVerified = false")
    int verifyEmailByAddress(String email);

    // Dữ liệu User đăng ký mới
    @Query("SELECT FUNCTION('DATE_FORMAT', u.createdAt, '%d/%m'), COUNT(u.id) " +
            "FROM User u " +
            "WHERE u.createdAt >= :startDate AND u.createdAt <= :endDate " +
            "GROUP BY FUNCTION('DATE_FORMAT', u.createdAt, '%d/%m') " +
            "ORDER BY MIN(u.createdAt) ASC")
    List<Object[]> getDailyNewUsersRaw(
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate);
}
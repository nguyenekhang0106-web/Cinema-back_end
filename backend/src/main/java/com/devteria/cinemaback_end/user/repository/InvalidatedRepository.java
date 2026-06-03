package com.devteria.cinemaback_end.user.repository;

import com.devteria.cinemaback_end.user.entity.InvalidatedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;

@Repository
public interface InvalidatedRepository extends JpaRepository<InvalidatedToken, String> {
    // 🔥 Thêm hàm xóa tự động
    void deleteAllByExpiryTimeBefore(Date time);
}
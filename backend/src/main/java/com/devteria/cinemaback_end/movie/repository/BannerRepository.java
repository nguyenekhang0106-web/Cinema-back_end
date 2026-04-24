package com.devteria.cinemaback_end.movie.repository;

import com.devteria.cinemaback_end.movie.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BannerRepository extends JpaRepository<Banner, String> {
    // Lấy banner đang hoạt động và sắp xếp theo displayOrder tăng dần
    List<Banner> findAllByActiveTrueOrderByDisplayOrderAsc();

    // Lấy tất cả và sắp xếp (dùng cho Admin)
    List<Banner> findAllByOrderByDisplayOrderAsc();
}
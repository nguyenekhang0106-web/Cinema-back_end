package com.devteria.cinemaback_end.movie.repository;

import com.devteria.cinemaback_end.movie.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BannerRepository extends JpaRepository<Banner, String> {

    // Lấy banner trang chủ
    List<Banner> findAllByActiveTrueAndCinemaIsNullOrderByDisplayOrderAsc();
    List<Banner> findAllByCinemaIsNullOrderByDisplayOrderAsc();

    // Lấy ảnh rạp chiếu
    List<Banner> findAllByCinemaIdAndActiveTrueOrderByDisplayOrderAsc(String cinemaId);
    List<Banner> findAllByCinemaIdOrderByDisplayOrderAsc(String cinemaId);

    // Tìm kiếm và Kiểm tra trùng lặp
    Optional<Banner> findByTitle(String title);
    boolean existsByTitle(String title); // 🔥 THÊM DÒNG NÀY ĐỂ CHECK TRÙNG LẶP
}
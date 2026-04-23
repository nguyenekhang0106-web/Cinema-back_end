package com.devteria.cinemaback_end.cinema.repository;

import com.devteria.cinemaback_end.cinema.entity.Hall;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HallRepository extends JpaRepository<Hall, String> {

    // Kiểm tra tên phòng đã tồn tại trong rạp đó chưa (dùng cho Create)
    boolean existsByNameAndCinema_Id(String name, String cinemaId);

    // Kiểm tra trùng tên nhưng loại trừ ID hiện tại (dùng cho Update)
    boolean existsByNameAndCinema_IdAndIdNot(String name, String cinemaId, String id);

    // Lấy danh sách phòng chiếu theo rạp
    List<Hall> findByCinemaId(String cinemaId);
}
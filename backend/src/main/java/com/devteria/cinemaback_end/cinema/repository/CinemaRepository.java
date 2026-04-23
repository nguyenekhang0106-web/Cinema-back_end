package com.devteria.cinemaback_end.cinema.repository;

import com.devteria.cinemaback_end.cinema.entity.Cinema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CinemaRepository extends JpaRepository<Cinema, String> {

    // Dùng khi tạo mới: Kiểm tra xem tên rạp đã tồn tại chưa
    boolean existsByName(String name);

    // Dùng khi cập nhật: Kiểm tra xem tên rạp mới có bị trùng với rạp KHÁC không (loại trừ ID hiện tại)
    boolean existsByNameAndIdNot(String name, String id);
}
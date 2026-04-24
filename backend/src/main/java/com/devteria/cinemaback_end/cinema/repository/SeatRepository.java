package com.devteria.cinemaback_end.cinema.repository;

import com.devteria.cinemaback_end.cinema.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SeatRepository extends JpaRepository<Seat, String> {

    // Tìm danh sách ghế của 1 phòng, sắp xếp theo hàng và số để hiển thị đúng sơ đồ
    List<Seat> findAllByHallIdOrderByRowNameAscNumberAsc(String hallId);

    // Kiểm tra ghế đã tồn tại chưa (dùng cho Create)
    boolean existsByRowNameAndNumberAndHall_Id(String rowName, Integer number, String hallId);

    // Kiểm tra trùng nhưng loại trừ ghế hiện tại (dùng cho Update)
    boolean existsByRowNameAndNumberAndHall_IdAndIdNot(String rowName, Integer number, String hallId, String id);
}
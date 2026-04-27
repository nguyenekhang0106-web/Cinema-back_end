package com.devteria.cinemaback_end.promotion.repository;

import com.devteria.cinemaback_end.promotion.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, String> {

    // Tìm mã giảm giá theo code (Dùng khi khách nhập mã lúc thanh toán)
    Optional<Promotion> findByDiscountCode(String discountCode);

    // Kiểm tra mã đã tồn tại chưa
    boolean existsByDiscountCode(String discountCode);

    // Lấy danh sách các mã đang kích hoạt cho Admin quản lý
    List<Promotion> findAllByOrderByValidUntilAsc();

    // Lấy các mã đang hoạt động cho khách hàng xem
    List<Promotion> findAllByActiveTrueOrderByValidUntilAsc();
}
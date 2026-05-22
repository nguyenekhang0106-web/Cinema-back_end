package com.devteria.cinemaback_end.promotion.repository;

import com.devteria.cinemaback_end.promotion.entity.UserVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserVoucherRepository extends JpaRepository<UserVoucher, String> {

    // 1. Tìm toàn bộ kho Voucher của 1 User dựa vào Email (Để đổ dữ liệu lên FE trang tài khoản)
    List<UserVoucher> findByUser_EmailOrderByCollectedAtDesc(String email);

    // 2. Tìm danh sách các Voucher "Còn hạn và Chưa dùng" của User (Dùng ở bước áp mã lúc đặt vé)
    List<UserVoucher> findByUser_IdAndUsedFalseAndPromotion_ActiveTrueAndPromotion_ValidUntilAfter(
            String userId, java.time.LocalDateTime now
    );

    // 3. Kiểm tra xem User này đã từng bấm "Nhận" mã này trước đó chưa
    boolean existsByUserIdAndPromotionId(String userId, String promotionId);

    // 4. Tìm chính xác Voucher cụ thể của User dựa trên Code khi họ thanh toán
    Optional<UserVoucher> findByUser_EmailAndPromotion_DiscountCodeAndUsedFalse(String email, String discountCode);
}
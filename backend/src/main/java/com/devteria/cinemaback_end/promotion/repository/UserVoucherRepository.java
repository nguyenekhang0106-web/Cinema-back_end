package com.devteria.cinemaback_end.promotion.repository;

import com.devteria.cinemaback_end.promotion.entity.Promotion;
import com.devteria.cinemaback_end.promotion.entity.UserVoucher;
import com.devteria.cinemaback_end.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserVoucherRepository extends JpaRepository<UserVoucher, String> {

    // 1. Tìm toàn bộ kho Voucher của 1 User dựa vào Email
    List<UserVoucher> findByUser_EmailOrderByCollectedAtDesc(String email);

    // 2. Tìm danh sách Voucher còn hạn, chưa dùng, đang active
    List<UserVoucher> findByUser_IdAndUsedFalseAndPromotion_ActiveTrueAndPromotion_ValidUntilAfter(
            String userId,
            LocalDateTime now
    );

    // 3. Kiểm tra User đã nhận mã này chưa
    boolean existsByUserIdAndPromotionId(String userId, String promotionId);

    // 4. Tìm voucher cụ thể của User dựa trên code khi thanh toán
    Optional<UserVoucher> findByUser_EmailAndPromotion_DiscountCodeAndUsedFalse(
            String email,
            String discountCode
    );

    // 5. Dùng trong BookingService để kiểm tra user có sở hữu voucher này không
    Optional<UserVoucher> findByUserAndPromotion(
            User user,
            Promotion promotion
    );

    // 6. Dùng khi cần tìm theo userId + promotionId
    Optional<UserVoucher> findByUser_IdAndPromotion_Id(
            String userId,
            String promotionId
    );
}
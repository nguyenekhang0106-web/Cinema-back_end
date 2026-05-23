package com.devteria.cinemaback_end.promotion.service;

import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.promotion.dto.PromotionRequest;
import com.devteria.cinemaback_end.promotion.dto.PromotionResponse;
import com.devteria.cinemaback_end.promotion.entity.Promotion;
import com.devteria.cinemaback_end.promotion.entity.UserVoucher;
import com.devteria.cinemaback_end.promotion.mapper.PromotionMapper;
import com.devteria.cinemaback_end.promotion.repository.PromotionRepository;
import com.devteria.cinemaback_end.promotion.repository.UserVoucherRepository;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PromotionService {

    PromotionRepository promotionRepository;
    PromotionMapper promotionMapper;

    UserVoucherRepository userVoucherRepository;
    UserRepository userRepository;

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public PromotionResponse createPromotion(PromotionRequest request) {
        if (promotionRepository.existsByDiscountCode(request.getDiscountCode())) {
            throw new AppException(ErrorCode.PROMO_CODE_EXISTED);
        }

        Promotion promotion = promotionMapper.toPromotion(request);
        return promotionMapper.toPromotionResponse(promotionRepository.save(promotion));
    }

    // Lấy các mã đang hoạt động (Hiển thị ở Tab 1 - Hệ thống)
    public List<PromotionResponse> getActivePromotions() {
        // 🔥 Đã đổi thành gọi hàm mới, truyền LocalDateTime.now() vào
        return promotionRepository.findAllByActiveTrueAndValidUntilAfterOrderByValidUntilAsc(LocalDateTime.now()).stream()
                .map(promotionMapper::toPromotionResponse).toList();
    }

    // ADMIN: Quản lý toàn bộ
    @PreAuthorize("hasRole('ADMIN')")
    public List<PromotionResponse> getAllForAdmin() {
        return promotionRepository.findAllByOrderByValidUntilAsc().stream()
                .map(promotionMapper::toPromotionResponse).toList();
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public PromotionResponse updatePromotion(String id, PromotionRequest request) {
        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PROMO_NOT_EXISTED));

        promotionMapper.updatePromotion(promotion, request);

        if (request.getActive() != null) {
            promotion.setActive(request.getActive());
        }

        return promotionMapper.toPromotionResponse(promotionRepository.save(promotion));
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deletePromotion(String id) {
        if (!promotionRepository.existsById(id)) {
            throw new AppException(ErrorCode.PROMO_NOT_EXISTED);
        }
        promotionRepository.deleteById(id);
    }

    // Hàm bổ trợ kiểm tra mã code (sẽ dùng trong module Booking)
    public PromotionResponse validateCode(String code) {
        return promotionRepository.findByDiscountCode(code)
                .map(promotionMapper::toPromotionResponse)
                .orElseThrow(() -> new AppException(ErrorCode.PROMO_NOT_EXISTED));
    }

    // ==========================================
    // 🔥 TÍNH NĂNG VÍ VOUCHER CHO NGƯỜI DÙNG
    // ==========================================

    @Transactional
    public void collectVoucher(String promotionId) {
        // 1. Lấy thông tin user đang đăng nhập
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new AppException(ErrorCode.PROMO_NOT_EXISTED));

        // 2. Kiểm tra hiệu lực của chương trình
        if (!promotion.isActive() || promotion.getValidUntil().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.PROMO_EXPIRED);
        }

        // 3. Kiểm tra số lượng giới hạn của hệ thống
        if (promotion.getUsageLimit() > 0 && promotion.getUsedCount() >= promotion.getUsageLimit()) {
            throw new AppException(ErrorCode.PROMO_OUT_OF_USAGE); // Đã phát hết mã
        }

        // 4. Kiểm tra User đã lấy mã này chưa (Tránh spam click)
        if (userVoucherRepository.existsByUserIdAndPromotionId(user.getId(), promotion.getId())) {
            throw new AppException(ErrorCode.PROMO_ALREADY_COLLECTED);
        }

        // ====================================================================
        // 🔥 KIỂM TRA ĐIỀU KIỆN NHẬN MÃ (HẠNG, SINH NHẬT, ĐIỂM THƯỞNG)
        // ====================================================================

        // 5. Kiểm tra Hạng thành viên (Sử dụng Ordinal để so sánh cấp bậc enum: BASIC(0) < SILVER(1) < GOLD(2) < PLATINUM(3))
        if (promotion.getRequiredMemberTier() != null) {
            if (user.getMemberTier().ordinal() < promotion.getRequiredMemberTier().ordinal()) {
                throw new AppException(ErrorCode.TIER_NOT_MET); // Hạng không đủ
            }
        }

        // 6. Kiểm tra Tháng sinh nhật (Quy chuẩn rạp phim thường tặng quà theo Tháng)
        if (promotion.isBirthdayPromo()) {
            if (user.getDateOfBirth() == null) {
                throw new AppException(ErrorCode.DOB_NOT_UPDATED); // Chưa cập nhật ngày sinh
            }
            int currentMonth = LocalDateTime.now().getMonthValue();
            int birthMonth = user.getDateOfBirth().getMonthValue();
            if (currentMonth != birthMonth) {
                throw new AppException(ErrorCode.NOT_BIRTHDAY_MONTH); // Không phải tháng sinh nhật
            }
        }

        // 7. Kiểm tra & TRỪ ĐIỂM thưởng nếu mã yêu cầu dùng điểm để đổi
        if (promotion.getRequiredRewardPoints() != null && promotion.getRequiredRewardPoints() > 0) {
            if (user.getTotalRewardPoints() < promotion.getRequiredRewardPoints()) {
                throw new AppException(ErrorCode.NOT_ENOUGH_POINTS); // Không đủ điểm
            }
            // Trừ điểm của User và lưu lại
            user.setTotalRewardPoints(user.getTotalRewardPoints() - promotion.getRequiredRewardPoints());
            userRepository.save(user);
        }
        // ====================================================================

        // 8. Cấp mã cho User
        UserVoucher userVoucher = UserVoucher.builder()
                .user(user)
                .promotion(promotion)
                .used(false)
                .build();

        userVoucherRepository.save(userVoucher);

        // Cập nhật số lượt đã phát (Nên cộng luôn lúc user bấm nhận thay vì chờ thanh toán để tránh lố mã)
        promotion.setUsedCount(promotion.getUsedCount() + 1);
        promotionRepository.save(promotion);
    }

    // Hiển thị ở Tab 2 - Ví Voucher của người dùng
    public List<PromotionResponse> getMyVouchers() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<UserVoucher> userVouchers = userVoucherRepository.findByUser_EmailOrderByCollectedAtDesc(email);

        return userVouchers.stream()
                // 🔥 THÊM DÒNG LỌC NÀY: Bỏ qua các mã đã hết hạn khỏi ví người dùng
                .filter(uv -> uv.getPromotion().getValidUntil().isAfter(LocalDateTime.now()))
                .map(uv -> {
                    PromotionResponse response = promotionMapper.toPromotionResponse(uv.getPromotion());
                    response.setIsUsed(uv.isUsed());
                    return response;
                }).toList();
    }
}
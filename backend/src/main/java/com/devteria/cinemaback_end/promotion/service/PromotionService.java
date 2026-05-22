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
        // Lấy thông tin user đang đăng nhập
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new AppException(ErrorCode.PROMO_NOT_EXISTED));

        // Kiểm tra xem khuyến mãi còn hiệu lực không
        if (!promotion.isActive() || promotion.getValidUntil().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.PROMO_EXPIRED);
        }

        // Kiểm tra xem User đã lấy mã này chưa (Tránh spam click)
        if (userVoucherRepository.existsByUserIdAndPromotionId(user.getId(), promotion.getId())) {
            throw new AppException(ErrorCode.PROMO_ALREADY_COLLECTED);
        }

        UserVoucher userVoucher = UserVoucher.builder()
                .user(user)
                .promotion(promotion)
                .used(false)
                .build();

        userVoucherRepository.save(userVoucher);
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
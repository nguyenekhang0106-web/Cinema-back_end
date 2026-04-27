package com.devteria.cinemaback_end.promotion.service;

import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.promotion.dto.PromotionRequest;
import com.devteria.cinemaback_end.promotion.dto.PromotionResponse;
import com.devteria.cinemaback_end.promotion.entity.Promotion;
import com.devteria.cinemaback_end.promotion.mapper.PromotionMapper;
import com.devteria.cinemaback_end.promotion.repository.PromotionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PromotionService {

    PromotionRepository promotionRepository;
    PromotionMapper promotionMapper;

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public PromotionResponse createPromotion(PromotionRequest request) {
        if (promotionRepository.existsByDiscountCode(request.getDiscountCode())) {
            throw new AppException(ErrorCode.PROMO_CODE_EXISTED);
        }

        Promotion promotion = promotionMapper.toPromotion(request);
        return promotionMapper.toPromotionResponse(promotionRepository.save(promotion));
    }

    // PUBLIC: Lấy các mã đang hoạt động cho người dùng
    public List<PromotionResponse> getActivePromotions() {
        return promotionRepository.findAllByActiveTrueOrderByValidUntilAsc().stream()
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
}
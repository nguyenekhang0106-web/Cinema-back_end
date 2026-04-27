package com.devteria.cinemaback_end.promotion.mapper;

import com.devteria.cinemaback_end.promotion.dto.PromotionRequest;
import com.devteria.cinemaback_end.promotion.dto.PromotionResponse;
import com.devteria.cinemaback_end.promotion.entity.Promotion;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface PromotionMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "usedCount", ignore = true) // Luôn khởi tạo từ 0
    Promotion toPromotion(PromotionRequest request);

    PromotionResponse toPromotionResponse(Promotion promotion);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "usedCount", ignore = true) // Không cho phép update số lượt đã dùng thủ công
    void updatePromotion(@MappingTarget Promotion promotion, PromotionRequest request);
}
package com.devteria.cinemaback_end.promotion.dto;

import com.devteria.cinemaback_end.promotion.entity.enums.PromotionTarget;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PromotionResponse {
    String id;
    String title;
    String description;
    String discountCode;
    Double discountPercent;

    // BỔ SUNG
    PromotionTarget target;

    LocalDateTime validFrom;
    LocalDateTime validUntil;
    Double minPurchaseAmount;
    Double maxDiscountAmount;
    Integer usageLimit;
    Integer usedCount;
    boolean active;
}
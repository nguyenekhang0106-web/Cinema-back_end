package com.devteria.cinemaback_end.promotion.dto;

import com.devteria.cinemaback_end.promotion.entity.enums.PromotionTarget;
import com.devteria.cinemaback_end.user.entity.enums.MemberTier;
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

    PromotionTarget target;

    LocalDateTime validFrom;
    LocalDateTime validUntil;
    Double minPurchaseAmount;
    Double maxDiscountAmount;
    Integer usageLimit;
    Integer usedCount;
    boolean active;

    Integer requiredRewardPoints;
    MemberTier requiredMemberTier;
    Boolean isBirthdayPromo;

    // 🔥 BỔ SUNG: Trạng thái User đã sử dụng mã này chưa (Chỉ dùng cho API Ví Voucher)
    Boolean isUsed;
}
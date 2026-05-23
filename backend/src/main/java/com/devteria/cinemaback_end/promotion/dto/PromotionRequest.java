package com.devteria.cinemaback_end.promotion.dto;

import com.devteria.cinemaback_end.promotion.entity.enums.PromotionTarget;
import com.devteria.cinemaback_end.user.entity.enums.MemberTier;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import jakarta.validation.constraints.Max;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PromotionRequest {

    @NotBlank(message = "PROMO_TITLE_NOT_BLANK")
    String title;

    String description;

    @NotBlank(message = "PROMO_CODE_NOT_BLANK")
    String discountCode;

    @NotNull(message = "DISCOUNT_PERCENT_NOT_NULL")
    @Min(value = 0, message = "DISCOUNT_PERCENT_INVALID")
    @Max(value = 100, message = "DISCOUNT_PERCENT_INVALID")
    Double discountPercent;

    // BỔ SUNG: Ràng buộc yêu cầu Admin phải chọn loại áp dụng
    @NotNull(message = "PROMO_TARGET_NOT_NULL")
    PromotionTarget target;

    @NotNull(message = "VALID_FROM_NOT_NULL")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime validFrom;

    @NotNull(message = "VALID_UNTIL_NOT_NULL")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    LocalDateTime validUntil;

    @Min(value = 0, message = "MIN_PURCHASE_INVALID")
    Double minPurchaseAmount;

    @Min(value = 0, message = "MAX_DISCOUNT_INVALID")
    Double maxDiscountAmount;

    @Min(value = 0, message = "USAGE_LIMIT_INVALID")
    Integer usageLimit;

    Integer requiredRewardPoints;
    MemberTier requiredMemberTier;
    Boolean isBirthdayPromo;
    Boolean active;
}
package com.devteria.cinemaback_end.promotion.entity;

import com.devteria.cinemaback_end.promotion.entity.enums.PromotionTarget;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false)
    String title;

    @Column(length = 500)
    String description;

    @Column(nullable = false, unique = true)
    String discountCode;

    @Column(nullable = false)
    Double discountPercent;

    // BỔ SUNG: Phạm vi áp dụng của mã giảm giá
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    PromotionTarget target;

    @Column(nullable = false)
    LocalDateTime validFrom;

    @Column(nullable = false)
    LocalDateTime validUntil;

    @Builder.Default
    Double minPurchaseAmount = 0.0;

    @Builder.Default
    Double maxDiscountAmount = 0.0;

    @Builder.Default
    Integer usageLimit = 0;

    @Builder.Default
    Integer usedCount = 0;

    @Builder.Default
    boolean active = true;
}
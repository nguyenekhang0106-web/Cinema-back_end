package com.devteria.cinemaback_end.promotion.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Promotion {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id; // promoId

    String title;
    String discountCode;
    Double discountPercent;
    LocalDateTime validFrom;
    LocalDateTime validUntil;
    Double minPurchaseAmount;
    Double maxDiscountAmount;
    Integer usageLimit;
}
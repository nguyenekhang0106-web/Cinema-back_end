package com.devteria.cinemaback_end.promotion.entity;

import com.devteria.cinemaback_end.promotion.entity.enums.PromotionTarget;
import com.devteria.cinemaback_end.user.entity.enums.MemberTier;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

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

    // 🔥 BỔ SUNG 1: Số điểm tối thiểu cần có (và sẽ bị trừ) để đổi mã này
    @Builder.Default
    Integer requiredRewardPoints = 0;

    // 🔥 BỔ SUNG 2: Hạng thành viên tối thiểu để thấy/nhận mã (null = áp dụng mọi hạng)
    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    MemberTier requiredMemberTier;

    // 🔥 BỔ SUNG 3: Mã này có phải quà sinh nhật không? (Chỉ nhận được trong tháng sinh)
    @Builder.Default
    boolean isBirthdayPromo = false;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "promotion", cascade = CascadeType.ALL, orphanRemoval = true)
    List<UserVoucher> userVouchers;
}
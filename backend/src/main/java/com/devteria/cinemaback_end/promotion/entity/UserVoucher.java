package com.devteria.cinemaback_end.promotion.entity;

import com.devteria.cinemaback_end.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_voucher",
        indexes = {
                @Index(name = "idx_user_voucher_user", columnList = "user_id"),
                @Index(name = "idx_user_voucher_promo", columnList = "promotion_id"),
                @Index(name = "idx_user_voucher_user_promo", columnList = "user_id, promotion_id")
        },
        uniqueConstraints = {
                // Đảm bảo 1 User chỉ được bấm "Nhận" mã này tối đa 1 lần
                @UniqueConstraint(name = "uk_user_promotion", columnNames = {"user_id", "promotion_id"})
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserVoucher {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    // Trạng thái đã sử dụng hay chưa
    @Column(nullable = false)
    @Builder.Default
    boolean used = false;

    // Ngày giờ bấm "Lưu mã"
    @Column(name = "collected_at", nullable = false)
    LocalDateTime collectedAt;

    // Ngày giờ thực tế sử dụng mã (bổ sung thêm để sau này làm thống kê rất tiện)
    @Column(name = "used_at")
    LocalDateTime usedAt;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id", nullable = false)
    Promotion promotion;

    // Tự động gán thời gian hiện tại khi User bấm nhận Voucher
    @PrePersist
    void prePersist() {
        if (this.collectedAt == null) {
            this.collectedAt = LocalDateTime.now();
        }
    }
}
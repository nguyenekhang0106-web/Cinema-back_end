package com.devteria.cinemaback_end.user.entity;

import com.devteria.cinemaback_end.cinema.entity.Cinema;
import com.devteria.cinemaback_end.movie.entity.enums.Area;
import com.devteria.cinemaback_end.promotion.entity.UserVoucher;
import com.devteria.cinemaback_end.user.entity.enums.Gender;
import com.devteria.cinemaback_end.user.entity.enums.MemberTier;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id; // userId

    @Column(nullable = false)
    String fullName;

    @Column(nullable = false, unique = true)
    @Email
    @NotBlank
    String email;

    @Column(unique = true)
    String phone;

    @Column(nullable = false)
    @NotBlank
    String password;

    @Column(unique = true)
    String citizenIdNumber;

    @Enumerated(EnumType.STRING)
    Gender gender;

    LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    Area area;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    MemberTier memberTier = MemberTier.BASIC;

    @Builder.Default
    Integer totalRewardPoints = 0;

    @Column(nullable = false)
    @Builder.Default
    boolean emailVerified = false;

    @Column(name = "avatar_url")
    String avatarUrl;

    // 🔥 BỔ SUNG: Trường lưu thời gian tạo tài khoản để làm thống kê biểu đồ
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    Set<Role> roles;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    List<UserVoucher> vouchers;

    // 🔥 BỔ SUNG: Tổng chi tiêu tích lũy (Không bao giờ bị trừ)
    @Builder.Default
    Double totalSpending = 0.0;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
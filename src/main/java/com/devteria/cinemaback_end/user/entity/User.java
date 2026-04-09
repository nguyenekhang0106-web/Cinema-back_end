package com.devteria.cinemaback_end.user.entity;

import com.devteria.cinemaback_end.cinema.entity.Cinema;
import com.devteria.cinemaback_end.user.entity.enums.Gender;
import com.devteria.cinemaback_end.user.entity.enums.MemberTier;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDate;
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
    String area;
    @Builder.Default
    @Enumerated(EnumType.STRING)
    MemberTier memberTier = MemberTier.BASIC;
    @Builder.Default
    Integer totalRewardPoints = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cinema_id", nullable = true)
    Cinema cinema;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_roles", // đúng với DB của bạn
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    Set<Role> roles;
}
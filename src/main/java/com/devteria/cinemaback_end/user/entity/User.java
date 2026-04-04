package com.devteria.cinemaback_end.user.entity;

import com.devteria.cinemaback_end.cinema.entity.Cinema;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDate;
import java.util.Set;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id; // userId

    String fullName;
    String email;
    String phone;
    String password;
    String citizenIdNumber;
    String gender;
    LocalDate dateOfBirth;
    String role;
    String area;
    String memberTier;
    Integer totalRewardPoints;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cinema_id", nullable = true)
    Cinema cinema;

    @ManyToMany
    Set<Role> roles;
}
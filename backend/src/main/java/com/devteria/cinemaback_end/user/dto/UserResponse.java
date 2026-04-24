package com.devteria.cinemaback_end.user.dto;

import com.devteria.cinemaback_end.movie.entity.enums.Area;
import com.devteria.cinemaback_end.user.entity.enums.Gender;
import com.devteria.cinemaback_end.user.entity.enums.MemberTier;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    String id;
    String fullName;
    String email;
    String phone;
    // Bỏ qua password
    String citizenIdNumber;
    Gender gender;
    LocalDate dateOfBirth;
    Area area;
    MemberTier memberTier;
    Integer totalRewardPoints;
    boolean emailVerified;
    String verificationToken;

    // BỔ SUNG TRƯỜNG NÀY: Trả về link ảnh cho Frontend
    String avatarUrl;
}
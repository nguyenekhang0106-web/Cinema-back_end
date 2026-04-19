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
    Area area; // Đổi String thành Area
    MemberTier memberTier; // Dùng Enum
    Integer totalRewardPoints;
    boolean emailVerified;
    String verificationToken;
}
package com.devteria.cinemaback_end.user.dto;

import com.devteria.cinemaback_end.movie.entity.enums.Area;
import com.devteria.cinemaback_end.user.entity.enums.Gender;
import com.devteria.cinemaback_end.user.entity.enums.MemberTier;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDate;
import java.time.LocalDateTime;

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
    String avatarUrl;

    // 🔥 BỔ SUNG: Trả về thời gian tạo tài khoản để Frontend hiển thị "Ngày Tham Gia"
    LocalDateTime createdAt;
}
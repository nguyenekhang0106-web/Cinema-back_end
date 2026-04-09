package com.devteria.cinemaback_end.user.dto;

import com.devteria.cinemaback_end.user.entity.enums.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserRequest {

    @NotBlank(message = "Họ tên không được để trống")
    String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    String email;

    String phone;

    @NotBlank(message = "Mật khẩu không được để trống")
    String password;

    String citizenIdNumber;

    Gender gender; // Dùng Enum thay vì String

    LocalDate dateOfBirth;
    String area;
}
package com.devteria.cinemaback_end.user.dto;

import com.devteria.cinemaback_end.user.entity.enums.Gender;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
    @Size(min = 3, message = "USERNAME_INVALID")
    String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    String email;

    String phone;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, message = "PASSWORD_INVALID")
    String password;

    String citizenIdNumber;

    Gender gender; // Dùng Enum thay vì String

    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate dateOfBirth;
    String area;
}
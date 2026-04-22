package com.devteria.cinemaback_end.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthenticationRequest {

    @NotBlank(message = "EMAIL_NOT_BLANK") // Bạn có thể đổi mã lỗi này trong ErrorCode nếu cần
    String username; // email hoặc phone

    @NotBlank(message = "PASSWORD_NOT_BLANK")
    String password;
}
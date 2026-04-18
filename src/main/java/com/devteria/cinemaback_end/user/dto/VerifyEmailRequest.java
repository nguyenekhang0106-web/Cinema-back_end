package com.devteria.cinemaback_end.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VerifyEmailRequest {

    @NotBlank(message = "EMAIL_NOT_BLANK")
    @Email(message = "EMAIL_NOT_FORMAT")
    String email;

    @NotBlank(message = "VERIFY_CODE_NOT_BLANK")
    @Pattern(regexp = "^\\d{6}$", message = "VERIFY_CODE_INVALID")
    String code;
}

package com.devteria.cinemaback_end.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResendVerificationRequest {

    @NotBlank(message = "VERIFY_TOKEN_NOT_BLANK")
    String verificationToken;
}

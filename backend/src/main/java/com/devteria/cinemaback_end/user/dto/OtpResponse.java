package com.devteria.cinemaback_end.user.dto;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OtpResponse {
    
    String message;
    
    Integer remainingAttempts;  // Số lần nhập còn lại
    
    Long resendCooldownSeconds; // Thời gian chờ trước khi resend (giây)
    
    Long registrationExpiryMinutes; // Thời hạn đăng kí còn lại (phút)
}

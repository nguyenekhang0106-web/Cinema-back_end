package com.devteria.cinemaback_end.user.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor // Bắt buộc phải có để Spring đọc được JSON
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE) // Bỏ makeFinal = true
public class LogoutRequest {
    String token;
}

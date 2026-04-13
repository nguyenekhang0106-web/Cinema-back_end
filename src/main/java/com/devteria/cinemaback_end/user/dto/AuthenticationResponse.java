package com.devteria.cinemaback_end.user.dto;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data // bao hàm nhiều annotation có cả setter và getter
@FieldDefaults(level = AccessLevel.PRIVATE) // khai báo mặc định sẽ là private
@Builder
public class AuthenticationResponse {
    String token;
    boolean authenticated;
}

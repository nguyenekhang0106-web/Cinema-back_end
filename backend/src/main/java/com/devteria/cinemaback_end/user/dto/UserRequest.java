package com.devteria.cinemaback_end.user.dto;

import com.devteria.cinemaback_end.movie.entity.enums.Area;
import com.devteria.cinemaback_end.user.entity.enums.Gender;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserRequest {

    @NotBlank(message = "FULLNAME_NOT_BLANK")
    @Size(min = 3, message = "FULLNAME_INVALID")
    @Pattern(regexp = "^[^<>]*$", message = "FULLNAME_CANNOT_CONTAIN_HTML_TAGS")
    String fullName;

    @NotBlank(message = "EMAIL_NOT_BLANK")
    @Email(message = "EMAIL_NOT_FORMAT")
    String email;

    @NotBlank(message = "PHONE_NOT_BLANK")
    @Pattern(regexp = "(84|0[3|5|7|8|9])+([0-9]{8})\\b", message = "PHONE_INVALID")
    String phone;

    @NotBlank(message = "PASSWORD_NOT_BLANK")
    @Size(min = 8, message = "PASSWORD_INVALID")
    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
            message = "PASSWORD_MUST_CONTAIN_UPPERCASE_LOWERCASE_DIGIT_SPECIAL_CHAR"
    )
    String password;

    @NotBlank(message = "CCCD_NOT_BLANK")
    @Pattern(regexp = "^[0-9]{12}$", message = "CITIZEN_ID_INVALID")
    String citizenIdNumber;

    Gender gender;

    @Past(message = "DOB_MUST_BE_PAST")
    @JsonFormat(pattern = "yyyy-MM-dd")
    LocalDate dateOfBirth;

    Area area;

    // BỔ SUNG TRƯỜNG NÀY: Nhận link ảnh từ Frontend truyền xuống
    String avatarUrl;
}
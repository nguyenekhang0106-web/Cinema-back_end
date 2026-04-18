package com.devteria.cinemaback_end.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "UNCATEGORIZED error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Invalid message key", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
    FULLNAME_INVALID(1003, "Fullname must be least 3 characters", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1004, "Password must be least 8 characters",  HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "User not existed", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You don't have permission", HttpStatus.FORBIDDEN),
    EMAIL_NOT_BLANK(1008, "Email không được để trống", HttpStatus.BAD_REQUEST),
    EMAIL_NOT_FORMAT(1009, "Email không đúng định dạng", HttpStatus.BAD_REQUEST),
    FULLNAME_NOT_BLANK(1010, "Họ tên không được để trống", HttpStatus.BAD_REQUEST),
    PASSWORD_NOT_BLANK(1011, "Mật khẩu không được để trống", HttpStatus.BAD_REQUEST),
    PHONE_INVALID(1012, "Số điện thoại không hợp lệ", HttpStatus.BAD_REQUEST),
    CITIZEN_ID_INVALID(1013, "CCCD không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_GENDER(1014, "Giới tính không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_DOB_FORMAT(1015, "Ngày sinh không đúng định dạng yyyy-MM-dd", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1016, "Email đã được sử dụng", HttpStatus.BAD_REQUEST),
    PHONE_EXISTED(1017, "Số điện thoại đã được sử dụng", HttpStatus.BAD_REQUEST),
    CITIZEN_ID_EXISTED(1018, "CCCD đã được sử dụng", HttpStatus.BAD_REQUEST),
    CCCD_NOT_BLANK(1019, "CCCD Không được để trống", HttpStatus.BAD_REQUEST),
    PHONE_NOT_BLANK(1020, "Số điện thoại không dược để trống", HttpStatus.BAD_REQUEST),
    INVALID_AREA(1021, "Khu vực (Tỉnh/Thành phố) không hợp lệ", HttpStatus.BAD_REQUEST),

    TITLE_NOT_BLANK(1022, "Tên phim không được để trống", HttpStatus.BAD_REQUEST),
    DURATION_NOT_NULL(1023, "Thời lượng phim không được để trống", HttpStatus.BAD_REQUEST),
    DURATION_MIN_INVALID(1024, "Thời lượng phim phải từ 1 phút trở lên", HttpStatus.BAD_REQUEST),
    GENRE_NOT_NULL(1025, "Thể loại phim không được để trống", HttpStatus.BAD_REQUEST),
    LANGUAGE_NOT_NULL(1026, "Ngôn ngữ phim không được để trống", HttpStatus.BAD_REQUEST),
    AGE_RESTRICTION_NOT_NULL(1027, "Giới hạn độ tuổi không được để trống", HttpStatus.BAD_REQUEST),
    RELEASE_DATE_NOT_NULL(1028, "Ngày phát hành không được để trống", HttpStatus.BAD_REQUEST),

    // Xử lý bắt lỗi khi nhập sai Enum của Movie
    INVALID_GENRE(1029, "Thể loại phim không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_LANGUAGE(1030, "Ngôn ngữ phim không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_AGE_RESTRICTION(1031, "Mã giới hạn độ tuổi không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_MOVIE_STATUS(1032, "Trạng thái phim không hợp lệ", HttpStatus.BAD_REQUEST),
    MOVIE_NOT_EXISTED(1033, "Phim không tồn tại", HttpStatus.NOT_FOUND),

    EMAIL_NOT_VERIFIED(1034, "Vui lòng xác thực email trước khi đăng nhập", HttpStatus.UNAUTHORIZED),
    INVALID_VERIFICATION_TOKEN(1035, "Mã xác thực không đúng hoặc đã hết hạn", HttpStatus.BAD_REQUEST),
    UNABLE_TO_SEND_EMAIL(1036, "Không thể gửi email xác thực", HttpStatus.INTERNAL_SERVER_ERROR),

    VERIFY_CODE_NOT_BLANK(1037, "Mã xác thực không được để trống", HttpStatus.BAD_REQUEST),
    VERIFY_CODE_INVALID(1038, "Mã xác thực phải gồm đúng 6 chữ số", HttpStatus.BAD_REQUEST)
    ;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private int code;
    private String message;
    private HttpStatusCode statusCode;

}

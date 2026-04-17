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
    CCCD_NOT_BLANK(1019, "CCCD Không được để trống", HttpStatus.BAD_REQUEST)
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

package com.devteria.cinemaback_end.exception;

import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.movie.entity.enums.*;
import com.devteria.cinemaback_end.user.entity.enums.Gender;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import tools.jackson.databind.exc.InvalidFormatException;

@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(value = Exception.class)
    ResponseEntity<ApiResponse> handlingRunTimeException(Exception exception){
        ApiResponse apiResponse = new ApiResponse<>();
        apiResponse.setCode(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode());
        apiResponse.setMessage(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage());
        return ResponseEntity
                .status(ErrorCode.UNCATEGORIZED_EXCEPTION.getStatusCode())
                .body(apiResponse);
    }

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse> handlingAppEXception(AppException exception){
        ErrorCode errorCode = exception.getErrorCode();
        ApiResponse apiResponse = new ApiResponse<>();
        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());
        return ResponseEntity.status(errorCode.getStatusCode())
                .body(apiResponse);
    }

    @ExceptionHandler(value = AccessDeniedException.class)
    ResponseEntity<ApiResponse> handlingAccessDeniedException(AccessDeniedException exception){
        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;
        ApiResponse apiResponse = new ApiResponse<>();
        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());
        return ResponseEntity.status(errorCode.getStatusCode()).body(apiResponse);
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse> handlingValidation(MethodArgumentNotValidException exception){
        String enumKey = exception.getFieldError().getDefaultMessage();
        ErrorCode errorCode = ErrorCode.INVALID_KEY;

        try{
            errorCode = ErrorCode.valueOf(enumKey);
        }
        catch (IllegalArgumentException e){

        }
        ApiResponse apiResponse = new ApiResponse();

        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());
        return ResponseEntity.badRequest().body(apiResponse);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiResponse> handleHttpMessageNotReadableException(HttpMessageNotReadableException exception) {
        // 1. Khởi tạo mã lỗi mặc định nếu không xác định được nguyên nhân cụ thể
        ErrorCode errorCode = ErrorCode.INVALID_KEY;

        // 2. Trích xuất nguyên nhân sâu xa của lỗi
        Throwable cause = exception.getCause();

        // 3. Nếu nguyên nhân là do Jackson ép kiểu thất bại (InvalidFormatException)
        if (cause instanceof InvalidFormatException invalidFormatException) {
            Class<?> targetType = invalidFormatException.getTargetType();

            if (targetType.equals(Area.class)) {
                errorCode = ErrorCode.INVALID_AREA;
            } else if (targetType.equals(Gender.class)) {
                errorCode = ErrorCode.INVALID_GENDER;
            } else if (targetType.equals(java.time.LocalDate.class)) {
                errorCode = ErrorCode.INVALID_DOB_FORMAT;
            } else if (targetType.equals(Genre.class)) {
                errorCode = ErrorCode.INVALID_GENRE;
            } else if (targetType.equals(Language.class)) {
                errorCode = ErrorCode.INVALID_LANGUAGE;
            } else if (targetType.equals(AgeRestriction.class)) {
                errorCode = ErrorCode.INVALID_AGE_RESTRICTION;
            } else if (targetType.equals(MovieStatus.class)) {
                errorCode = ErrorCode.INVALID_MOVIE_STATUS;
            }
        }

        // 4. Đóng gói và trả về Response chuẩn
        ApiResponse apiResponse = new ApiResponse<>();
        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());

        return ResponseEntity.badRequest().body(apiResponse);
    }
}
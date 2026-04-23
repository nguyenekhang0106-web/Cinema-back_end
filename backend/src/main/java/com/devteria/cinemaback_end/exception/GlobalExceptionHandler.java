package com.devteria.cinemaback_end.exception;

import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.movie.entity.enums.*;
import com.devteria.cinemaback_end.user.entity.enums.Gender;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;


@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    // =========================
    // 1. UNKNOWN EXCEPTION (fallback)
    // =========================
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse> handleRuntimeException(Exception ex) {
        log.error("Unhandled exception: ", ex);

        return buildResponse(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }

    // =========================
    // 2. CUSTOM APP EXCEPTION
    // =========================
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse> handleAppException(AppException ex) {
        return buildResponse(ex.getErrorCode());
    }

    // =========================
    // 3. AUTHENTICATION (401)
    // =========================
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse> handleAuthenticationException(AuthenticationException ex) {
        return buildResponse(ErrorCode.UNAUTHENTICATED);
    }

    // =========================
    // 4. AUTHORIZATION (403)
    // =========================
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse> handleAccessDeniedException(AccessDeniedException ex) {
        return buildResponse(ErrorCode.UNAUTHORIZED);
    }

    // =========================
    // 5. VALIDATION (@Valid - Body)
    // =========================
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse> handleValidationException(MethodArgumentNotValidException ex) {

        var fieldError = ex.getFieldError();

        ErrorCode errorCode = ErrorCode.INVALID_KEY;

        if (fieldError != null) {
            try {
                errorCode = ErrorCode.valueOf(fieldError.getDefaultMessage());
            } catch (IllegalArgumentException ignored) {
            }
        }

        return buildResponse(errorCode);
    }

    // =========================
    // 6. VALIDATION (Param, Path)
    // =========================
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse> handleConstraintViolation(ConstraintViolationException ex) {
        return buildResponse(ErrorCode.INVALID_KEY);
    }

    // =========================
    // 7. ENUM / JSON PARSE ERROR
    // =========================
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse> handleJsonParseException(HttpMessageNotReadableException ex) {

        ErrorCode errorCode = ErrorCode.INVALID_KEY;

        Throwable cause = ex.getCause();

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
            } else if (targetType.equals(MovieStatus.class)) {
                errorCode = ErrorCode.INVALID_MOVIE_STATUS;
            }
            // THÊM 2 DÒNG NÀY CHO SHOWTIME
            else if (targetType.equals(ShowtimeFormat.class)) {
                errorCode = ErrorCode.INVALID_SHOWTIME_FORMAT;
            } else if (targetType.equals(ShowtimeStatus.class)) {
                errorCode = ErrorCode.INVALID_SHOWTIME_STATUS;
            }else if (targetType.equals(Area.class)) {
                errorCode = ErrorCode.INVALID_AREA;
            }

        }

        return buildResponse(errorCode);
    }

    // =========================
    // 8. DATABASE ERROR
    // =========================
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse> handleDatabaseException(DataIntegrityViolationException ex) {
        log.error("Database error: ", ex);

        // Có thể parse message để detect duplicate field (nâng cấp sau)
        return buildResponse(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }

    // =========================
    // 9. BAD ARGUMENT (manual throw)
    // =========================
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse> handleIllegalArgument(IllegalArgumentException ex) {
        return buildResponse(ErrorCode.INVALID_KEY);
    }

    // =========================
    // 10. COMMON RESPONSE BUILDER
    // =========================
    private ResponseEntity<ApiResponse> buildResponse(ErrorCode errorCode) {
        ApiResponse response = new ApiResponse();
        response.setCode(errorCode.getCode());
        response.setMessage(errorCode.getMessage());

        return ResponseEntity
                .status(errorCode.getStatusCode())
                .body(response);
    }
}
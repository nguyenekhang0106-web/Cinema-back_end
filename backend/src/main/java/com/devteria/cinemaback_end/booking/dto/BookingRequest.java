package com.devteria.cinemaback_end.booking.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingRequest {

    @NotBlank(message = "SHOWTIME_NOT_BLANK")
    String showtimeId;

    @NotEmpty(message = "SEAT_LIST_NOT_EMPTY")
    List<String> seatIds; // Danh sách ID các ghế khách chọn

    // Danh sách bắp nước (Có thể null nếu khách không mua)
    List<ConcessionChoiceRequest> concessions;

    // Mã giảm giá (Có thể null nếu khách không nhập)
    String promoCode;

    // --- Tạo một Class con lồng bên trong để nhận số lượng bắp nước ---
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConcessionChoiceRequest {
        @NotBlank
        String concessionItemId; // Mua món gì

        @NotNull
        @Min(1)
        Integer quantity;        // Số lượng bao nhiêu
    }
}
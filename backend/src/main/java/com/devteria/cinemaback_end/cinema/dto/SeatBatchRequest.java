package com.devteria.cinemaback_end.cinema.dto;

import com.devteria.cinemaback_end.cinema.entity.enums.SeatType;
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
public class SeatBatchRequest {

    @NotBlank(message = "HALL_ID_NOT_BLANK")
    String hallId;

    @NotEmpty(message = "ROW_NAMES_NOT_EMPTY") // Ví dụ: ["A", "B", "C", "D", "E"]
    List<String> rowNames;

    @NotNull(message = "SEATS_PER_ROW_NOT_NULL")
    @Min(value = 1, message = "SEATS_PER_ROW_INVALID") // Ví dụ: 12 ghế 1 hàng
    Integer seatsPerRow;

    @NotNull(message = "SEAT_TYPE_NOT_NULL")
    SeatType type; // Thường khi tạo lô, người ta tạo trước toàn bộ là STANDARD, sau đó update riêng vài ghế thành VIP sau
}
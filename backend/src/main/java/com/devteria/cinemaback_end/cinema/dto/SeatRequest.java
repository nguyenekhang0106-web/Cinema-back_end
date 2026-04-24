package com.devteria.cinemaback_end.cinema.dto;

import com.devteria.cinemaback_end.cinema.entity.enums.SeatStatus;
import com.devteria.cinemaback_end.cinema.entity.enums.SeatType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatRequest {

    @NotBlank(message = "ROW_NAME_NOT_BLANK")
    String rowName;

    @NotNull(message = "SEAT_NUMBER_NOT_NULL")
    @Min(value = 1, message = "SEAT_NUMBER_INVALID")
    Integer number;

    @NotNull(message = "SEAT_TYPE_NOT_NULL")
    SeatType type;

    // Cho phép truyền status (để Admin có thể update ghế từ AVAILABLE sang BROKEN)
    // Nếu không truyền, Entity sẽ tự lấy mặc định là AVAILABLE
    SeatStatus status;

    @NotBlank(message = "HALL_ID_NOT_BLANK")
    String hallId;
}
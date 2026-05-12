package com.devteria.cinemaback_end.cinema.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatBatchRequest {

    @NotNull(message = "HALL_ID_NOT_NULL")
    String hallId;

    @NotNull(message = "ROW_COUNT_NOT_NULL")
    @Min(value = 5, message = "Tối thiểu phải có 5 hàng")
    Integer rowCount; // Số hàng ngang (VD: 10 hàng -> A đến J)

    @NotNull(message = "SEATS_PER_ROW_NOT_NULL")
    @Min(value = 5, message = "Tối thiểu phải có 5 ghế 1 hàng")
    Integer seatsPerRow; // Số cột

    @NotNull(message = "COUPLE_SEAT_COUNT_NOT_NULL")
    @Min(value = 1, message = "Tối thiểu phải có 1 cặp ghế đôi")
    Integer coupleSeatCount; // Số lượng ghế đôi (Sẽ được xếp ở cuối)
}
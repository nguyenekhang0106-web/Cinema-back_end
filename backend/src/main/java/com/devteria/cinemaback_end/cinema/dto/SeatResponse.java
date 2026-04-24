package com.devteria.cinemaback_end.cinema.dto;

import com.devteria.cinemaback_end.cinema.entity.enums.SeatStatus;
import com.devteria.cinemaback_end.cinema.entity.enums.SeatType;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatResponse {
    String id;
    String rowName;
    Integer number;
    SeatType type;
    SeatStatus status;

    // Gắn thêm thông tin phòng chiếu để Frontend dễ hiển thị
    String hallId;
    String hallName;
}
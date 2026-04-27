package com.devteria.cinemaback_end.booking.dto;

import com.devteria.cinemaback_end.booking.entity.enums.TicketStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TicketResponse {
    String id;
    Double price;
    TicketStatus status;

    // Trả về thông tin ghế để in lên vé (Ví dụ: Ghế A1, Loại VIP)
    String seatId;
    String seatRowName;
    Integer seatNumber;
    String seatType;
}
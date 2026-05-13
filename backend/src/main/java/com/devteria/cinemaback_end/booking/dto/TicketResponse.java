package com.devteria.cinemaback_end.booking.dto;

import com.devteria.cinemaback_end.booking.entity.enums.TicketStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TicketResponse {
    String id;
    String ticketCode;
    String qrCodeUrl;
    Double price;
    TicketStatus status;
    LocalDateTime issuedAt;
    LocalDateTime scannedAt;
    String scannedBy;

    // Trả về thông tin ghế để in lên vé (Ví dụ: Ghế A1, Loại VIP)
    String seatId;
    String seatRowName;
    Integer seatNumber;
    String seatType;
}

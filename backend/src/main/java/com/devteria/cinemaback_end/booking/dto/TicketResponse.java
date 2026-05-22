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

    // --- CÁC TRƯỜNG CỦA GHẾ ---
    String seatId;
    String seatRowName;
    Integer seatNumber;
    String seatType;

    // 🔥 BỔ SUNG CÁC TRƯỜNG THÔNG TIN HIỂN THỊ LÊN BẢNG VÉ CỦA USER
    String movieTitle;
    String cinemaName;
    LocalDateTime showtimeTime;
}
package com.devteria.cinemaback_end.booking.entity.enums;

public enum TicketStatus {
    VALID,      // Vé hợp lệ (Vừa mua xong)
    SCANNED,    // Vé đã quét mã QR (Khách đã vào rạp)
    CANCELLED   // Vé đã bị hủy
}
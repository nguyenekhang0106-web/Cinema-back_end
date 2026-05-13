package com.devteria.cinemaback_end.booking.entity.enums;

public enum BookingStatus {
    PENDING,    // Vừa tạo hóa đơn, đang chờ khách thanh toán
    PAID,       // Đã thanh toán thành công
    CANCELLED,  // Đã hủy (do khách tự hủy hoặc thanh toán thất bại)
    FAILED,     // Thanh toán thất bại
    EXPIRED     // Quá hạn giữ ghế/thanh toán
}

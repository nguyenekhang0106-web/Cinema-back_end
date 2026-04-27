package com.devteria.cinemaback_end.booking.entity.enums;

public enum BookingStatus {
    PENDING,    // Vừa tạo hóa đơn, đang chờ khách thanh toán
    PAID,       // Đã thanh toán thành công
    CANCELLED,  // Đã hủy (do quá giờ thanh toán hoặc khách tự hủy)
    FAILED      // Thanh toán thất bại
}
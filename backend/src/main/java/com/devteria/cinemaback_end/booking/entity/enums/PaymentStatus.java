package com.devteria.cinemaback_end.booking.entity.enums;

public enum PaymentStatus {
    PENDING,    // Đang chờ khách quét mã/chuyển khoản
    SUCCESS,    // Thanh toán thành công
    FAILED,     // Thanh toán thất bại hoặc bị hủy
    EXPIRED     // Quá thời gian thanh toán an toàn mà không có dấu hiệu thành công
}

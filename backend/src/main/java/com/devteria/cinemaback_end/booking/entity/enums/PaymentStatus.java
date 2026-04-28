package com.devteria.cinemaback_end.booking.entity.enums;

public enum PaymentStatus {
    PENDING,    // Đang chờ khách quét mã/chuyển khoản
    SUCCESS,    // Thanh toán thành công
    FAILED      // Thanh toán thất bại hoặc bị hủy
}
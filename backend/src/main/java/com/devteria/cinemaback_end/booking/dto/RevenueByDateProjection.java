package com.devteria.cinemaback_end.booking.dto;

public interface RevenueByDateProjection {
    String getDate();
    Number getRevenue(); // 🔥 Đổi thành Number
    Number getTicket();  // 🔥 Đổi thành Number
    Number getFnb();     // 🔥 Đổi thành Number
}
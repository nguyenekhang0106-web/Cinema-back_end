package com.devteria.cinemaback_end.booking.dto;

public interface MoviePerformanceProjection {
    String getTitle();
    String getGenre();
    Number getTicketsSold(); // 🔥 Đổi thành Number
    Number getRevenue();     // 🔥 Đổi thành Number
}
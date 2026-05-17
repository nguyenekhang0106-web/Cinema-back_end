package com.devteria.cinemaback_end.booking.dto;

public interface RevenueByMovieProjection {
    String getMovieName();
    Number getRevenue(); // 🔥 Đổi thành Number
    Number getTickets(); // 🔥 Đổi thành Number
}
package com.devteria.cinemaback_end.booking.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RevenueByDateDTO {
    String date;           // VD: "01/05"
    Double revenue;        // Tổng doanh thu
    Double ticket;         // Doanh thu tiền vé
    Double fnb;            // Doanh thu bắp nước

    // 🔥 CẬP NHẬT: Dùng chính xác kiểu Double để Hibernate 6 chịu map dữ liệu
    public RevenueByDateDTO(String date, Double revenue, Double ticket, Double fnb) {
        this.date = date;
        // Kiểm tra null đề phòng ngày đó không có doanh thu
        this.revenue = revenue != null ? revenue : 0.0;
        this.ticket = ticket != null ? ticket : 0.0;
        this.fnb = fnb != null ? fnb : 0.0;
    }
}
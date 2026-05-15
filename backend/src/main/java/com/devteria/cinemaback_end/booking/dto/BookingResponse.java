package com.devteria.cinemaback_end.booking.dto;

import com.devteria.cinemaback_end.booking.entity.enums.BookingStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingResponse {
    String id;
    String bookingCode;
    LocalDateTime bookingDate;
    LocalDateTime expiresAt;
    BookingStatus status;

    // Phân tích dòng tiền
    Double ticketTotal;
    Double concessionTotal;
    Double discountAmount;
    Double totalAmount;

    // Thông tin cơ bản để hiển thị nhanh
    String customerName;
    String movieTitle;
    String cinemaName;
    String hallName;
    LocalDateTime showTimeStart;

    // Danh sách vé và đồ ăn (Trả về dạng chuỗi cho gọn, hoặc bạn có thể tạo DTO riêng nếu muốn hiển thị phức tạp hơn)
    List<String> seatNames; // Vd: ["A1", "A2", "A3"]
    List<String> concessionDetails; // Vd: ["2x Bắp Phô Mai", "1x Nước Ngọt L"]
}

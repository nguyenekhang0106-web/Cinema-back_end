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

    // --- Phân tích dòng tiền ---
    Double ticketTotal;
    Double concessionTotal;

    // Giảm giá từ mã khuyến mãi (Voucher)
    Double discountAmount;

    // 🔥 BỔ SUNG: Tiền giảm từ đặc quyền hạng thẻ
    Double memberDiscountAmount;

    // Tiền cuối cùng khách phải trả
    Double totalAmount;

    // --- Thông tin cơ bản để hiển thị nhanh ---
    String customerName;
    String movieTitle;
    String cinemaName;
    String hallName;
    LocalDateTime showTimeStart;

    // Danh sách vé và đồ ăn
    List<String> seatNames;
    List<String> concessionDetails;
}
package com.devteria.cinemaback_end.concession.entity;

import com.devteria.cinemaback_end.booking.entity.Booking;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingConcession {

    // Tự động sinh ID riêng, bỏ qua Composite Key phức tạp
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    Booking booking;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    ConcessionItem item;

    @Column(nullable = false)
    Integer quantity;

    @Column(nullable = false)
    Double price; // Giá CỦA MÓN ĂN TẠI THỜI ĐIỂM ĐẶT (Tránh lỗi thay đổi giá sau này)

    // Subtotal (Tổng tiền = quantity * price) bạn KHÔNG CẦN lưu xuống Database.
    // Khi Query lấy dữ liệu lên, Backend hoặc Frontend tự nhân 2 số này với nhau là ra.
    // Việc này giúp chuẩn hóa Database (Normal Form).
}
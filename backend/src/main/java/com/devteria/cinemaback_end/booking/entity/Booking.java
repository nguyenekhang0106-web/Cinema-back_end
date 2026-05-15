package com.devteria.cinemaback_end.booking.entity;

import com.devteria.cinemaback_end.booking.entity.enums.BookingStatus;
import com.devteria.cinemaback_end.concession.entity.BookingConcession;
import com.devteria.cinemaback_end.promotion.entity.Promotion;
import com.devteria.cinemaback_end.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false, unique = true)
    String bookingCode; // Vd: BKG-123456 (Mã hiển thị cho khách)

    @Builder.Default
    LocalDateTime bookingDate = LocalDateTime.now();

    LocalDateTime expiresAt;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    @Builder.Default
    BookingStatus status = BookingStatus.PENDING;

    // 🔥 Lưu vết doanh thu chi tiết
    @Builder.Default
    Double ticketTotal = 0.0;     // Tổng tiền vé (trước giảm giá)

    @Builder.Default
    Double concessionTotal = 0.0; // Tổng tiền bắp nước (trước giảm giá)

    @Builder.Default
    Double discountAmount = 0.0;  // Số tiền được giảm

    @Column(nullable = false)
    Double totalAmount;           // Số tiền cuối cùng KHÁCH PHẢI TRẢ (Sau khi đã trừ discount)

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    User customer;

    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promo_id")
    Promotion promotion;

    // 🔥 CASCADE: Lưu Booking là tự lưu luôn danh sách Vé và Đồ ăn
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL)
    List<Ticket> tickets;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL)
    List<BookingConcession> concessions;
}

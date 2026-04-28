package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.entity.Booking;
import com.devteria.cinemaback_end.booking.entity.enums.BookingStatus;
import com.devteria.cinemaback_end.booking.repository.BookingRepository;
import com.devteria.cinemaback_end.booking.service.BookingService;
import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.booking.dto.PaymentRequest;
import com.devteria.cinemaback_end.booking.dto.PaymentResponse;
import com.devteria.cinemaback_end.booking.entity.Payment;
import com.devteria.cinemaback_end.booking.entity.enums.PaymentStatus;
import com.devteria.cinemaback_end.booking.mapper.PaymentMapper;
import com.devteria.cinemaback_end.booking.repository.PaymentRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PaymentService {

    PaymentRepository paymentRepository;
    BookingRepository bookingRepository;
    BookingService bookingService; // Gọi sang BookingService để xác nhận thanh toán
    PaymentMapper paymentMapper;

    @Transactional
    public PaymentResponse createPayment(PaymentRequest request) {
        // 1. Kiểm tra hóa đơn
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_EXISTED));

        // Nếu hóa đơn đã hủy (do quá hạn) hoặc đã thanh toán thì chặn lại
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new AppException(ErrorCode.INVALID_REQUEST); // Có thể tạo lỗi BOOKING_CANCELLED riêng
        }
        if (booking.getStatus() == BookingStatus.PAID) {
            throw new AppException(ErrorCode.PAYMENT_ALREADY_PROCESSED);
        }

        // 2. Tìm xem đã có giao dịch nào đang tạo dở chưa
        Optional<Payment> existingPayment = paymentRepository.findByBookingId(booking.getId());
        Payment payment;

        if (existingPayment.isPresent()) {
            payment = existingPayment.get();
            if (payment.getStatus() == PaymentStatus.SUCCESS) {
                throw new AppException(ErrorCode.PAYMENT_ALREADY_PROCESSED);
            }
            // Khách đổi phương thức thanh toán (VD: từ MoMo sang VNPay)
            payment.setMethod(request.getMethod());
        } else {
            // Tạo mới giao dịch
            payment = Payment.builder()
                    .booking(booking)
                    .amount(booking.getTotalAmount()) // 🔥 Backend tự lấy tiền từ DB, KHÔNG tin tưởng số tiền từ Client gửi lên
                    .method(request.getMethod())
                    .status(PaymentStatus.PENDING)
                    .build();
        }

        return paymentMapper.toPaymentResponse(paymentRepository.save(payment));
    }

    // 🔥 HÀM MÔ PHỎNG WEBHOOK TỪ VNPAY/MOMO TRẢ VỀ
    @Transactional
    public PaymentResponse executePayment(String paymentId, boolean isSuccess) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_EXISTED));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new AppException(ErrorCode.PAYMENT_ALREADY_PROCESSED);
        }

        if (isSuccess) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setTransactionId("TXN-" + System.currentTimeMillis()); // Mã giao dịch giả lập

            // ⚠️ CỰC KỲ QUAN TRỌNG: Báo cho BookingService chốt đơn và nhả Redis
            bookingService.confirmPayment(payment.getBooking().getId());
            log.info("Thanh toán thành công hóa đơn: {}", payment.getBooking().getBookingCode());
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            // Lưu ý: Thất bại thì cứ để Hóa đơn là PENDING, cho khách thử thanh toán lại cho đến khi hết 10 phút.
            log.warn("Thanh toán thất bại hóa đơn: {}", payment.getBooking().getBookingCode());
        }

        return paymentMapper.toPaymentResponse(paymentRepository.save(payment));
    }
}
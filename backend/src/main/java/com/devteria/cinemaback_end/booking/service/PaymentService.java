package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.dto.PaymentRequest;
import com.devteria.cinemaback_end.booking.dto.PaymentResponse;
import com.devteria.cinemaback_end.booking.entity.Booking;
import com.devteria.cinemaback_end.booking.entity.Payment;
import com.devteria.cinemaback_end.booking.entity.enums.BookingStatus;
import com.devteria.cinemaback_end.booking.entity.enums.PaymentStatus;
import com.devteria.cinemaback_end.booking.mapper.PaymentMapper;
import com.devteria.cinemaback_end.booking.repository.BookingRepository;
import com.devteria.cinemaback_end.booking.repository.PaymentRepository;
import com.devteria.cinemaback_end.booking.repository.PaymentTransactionRepository;
import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PaymentService {

    private static final Duration PAYMENT_RECONCILIATION_GRACE = SeatHoldService.HOLD_TIME.plusMinutes(5);

    PaymentRepository paymentRepository;
    BookingRepository bookingRepository;
    PaymentTransactionRepository paymentTransactionRepository;
    BookingService bookingService;
    PaymentMapper paymentMapper;
    SeatHoldService seatHoldService;

    @Transactional
    public PaymentResponse createPayment(PaymentRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_EXISTED));

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.EXPIRED) {
            throw new AppException(ErrorCode.BOOKING_ALREADY_CANCELLED);
        }
        if (booking.getStatus() == BookingStatus.PAID) {
            throw new AppException(ErrorCode.PAYMENT_ALREADY_PROCESSED);
        }
        if (!seatHoldService.hasValidSeatHolds(booking)) {
            throw new AppException(ErrorCode.SEAT_HOLD_EXPIRED);
        }

        Optional<Payment> existingPayment = paymentRepository.findByBookingId(booking.getId());
        Payment payment;

        if (existingPayment.isPresent()) {
            payment = existingPayment.get();
            if (payment.getStatus() == PaymentStatus.SUCCESS) {
                throw new AppException(ErrorCode.PAYMENT_ALREADY_PROCESSED);
            }
            payment.setMethod(request.getMethod());
            payment.setPaymentDate(LocalDateTime.now());
            payment.setStatus(PaymentStatus.PENDING);
        } else {
            payment = Payment.builder()
                    .booking(booking)
                    .amount(booking.getTotalAmount())
                    .method(request.getMethod())
                    .status(PaymentStatus.PENDING)
                    .build();
        }

        Payment savedPayment = paymentRepository.save(payment);
        log.info("[Payment] created PENDING paymentId={}, bookingId={}, method={}, amount={}",
                savedPayment.getId(), booking.getId(), savedPayment.getMethod(), savedPayment.getAmount());
        return paymentMapper.toPaymentResponse(savedPayment);
    }

    @Transactional
    public PaymentResponse executePayment(String paymentId, boolean isSuccess) {
        Payment payment = paymentRepository.findByIdForUpdate(paymentId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_EXISTED));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            throw new AppException(ErrorCode.PAYMENT_ALREADY_PROCESSED);
        }

        if (isSuccess) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setTransactionId("TXN-" + System.currentTimeMillis());
            Payment savedPayment = paymentRepository.save(payment);
            bookingService.confirmPayment(payment.getBooking().getId());
            log.info("[Payment] mock payment SUCCESS paymentId={}, bookingId={}",
                    payment.getId(), payment.getBooking().getId());
            return paymentMapper.toPaymentResponse(savedPayment);
        }

        payment.setStatus(PaymentStatus.FAILED);
        Payment savedPayment = paymentRepository.save(payment);
        bookingService.cancelBooking(payment.getBooking().getId());
        log.warn("[Payment] mock payment FAILED paymentId={}, bookingId={}",
                payment.getId(), payment.getBooking().getId());
        return paymentMapper.toPaymentResponse(savedPayment);
    }

    @Transactional
    public int expireStalePendingPayments() {
        LocalDateTime threshold = LocalDateTime.now().minus(PAYMENT_RECONCILIATION_GRACE);
        List<Payment> payments = paymentRepository.findByStatusAndPaymentDateBefore(PaymentStatus.PENDING, threshold);
        int expiredCount = 0;

        for (Payment payment : payments) {
            Payment lockedPayment = paymentRepository.findByIdForUpdate(payment.getId()).orElse(null);
            if (lockedPayment == null || lockedPayment.getStatus() != PaymentStatus.PENDING) {
                continue;
            }

            boolean hasSuccessEvidence = paymentTransactionRepository.existsByPaymentIdAndResponseCodeAndTransactionStatus(
                    lockedPayment.getId(), "00", "00");
            if (hasSuccessEvidence) {
                lockedPayment.setStatus(PaymentStatus.SUCCESS);
                paymentRepository.save(lockedPayment);
                boolean bookingConfirmed = bookingService.tryConfirmPaymentFromGateway(lockedPayment.getBooking().getId());
                if (!bookingConfirmed) {
                    log.error("[Payment Reconcile] payment has SUCCESS evidence but booking cannot be confirmed paymentId={}, bookingId={}, reason={}",
                            lockedPayment.getId(), lockedPayment.getBooking().getId(), "BOOKING_CONFIRM_FAILED");
                }
                log.warn("[Payment Reconcile] recovered SUCCESS payment from stored VNPay evidence paymentId={}, bookingId={}",
                        lockedPayment.getId(), lockedPayment.getBooking().getId());
                continue;
            }

            lockedPayment.setStatus(PaymentStatus.EXPIRED);
            paymentRepository.save(lockedPayment);
            if (lockedPayment.getBooking().getStatus() == BookingStatus.PENDING) {
                bookingService.expireBookingIfDue(lockedPayment.getBooking().getId());
            }
            expiredCount++;
            log.info("[Payment Reconcile] expired stale PENDING paymentId={}, bookingId={}",
                    lockedPayment.getId(), lockedPayment.getBooking().getId());
        }

        return expiredCount;
    }
}

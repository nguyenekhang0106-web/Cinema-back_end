package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.entity.Payment;
import com.devteria.cinemaback_end.booking.entity.PaymentTransaction;
import com.devteria.cinemaback_end.booking.repository.PaymentRepository;
import com.devteria.cinemaback_end.booking.repository.PaymentTransactionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PaymentTransactionService {

    private static final DateTimeFormatter VNPAY_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    PaymentTransactionRepository paymentTransactionRepository;
    PaymentRepository paymentRepository;
    ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public PaymentTransaction saveVnPayCallback(Map<String, String> params, boolean checksumValid) {
        String paymentId = params.get("vnp_TxnRef");
        Payment payment = paymentId == null ? null : paymentRepository.findById(paymentId).orElse(null);

        PaymentTransaction transaction = PaymentTransaction.builder()
                .paymentId(paymentId)
                .bookingId(payment == null ? null : payment.getBooking().getId())
                .vnpTxnRef(paymentId)
                .vnpTransactionNo(params.get("vnp_TransactionNo"))
                .responseCode(params.get("vnp_ResponseCode"))
                .transactionStatus(params.get("vnp_TransactionStatus"))
                .bankCode(params.get("vnp_BankCode"))
                .amount(parseVnPayAmount(params.get("vnp_Amount")))
                .payDate(parsePayDate(params.get("vnp_PayDate")))
                .rawPayload(writeRawPayload(params))
                .checksumValid(checksumValid)
                .build();

        PaymentTransaction savedTransaction = paymentTransactionRepository.save(transaction);
        log.info("[VNPay] saved payment transaction id={}, paymentId={}, checksumValid={}, responseCode={}, transactionStatus={}",
                savedTransaction.getId(), paymentId, checksumValid,
                savedTransaction.getResponseCode(), savedTransaction.getTransactionStatus());
        return savedTransaction;
    }

    private Double parseVnPayAmount(String rawAmount) {
        if (rawAmount == null || rawAmount.isBlank()) {
            return null;
        }
        try {
            return BigDecimal.valueOf(Long.parseLong(rawAmount))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                    .doubleValue();
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private LocalDateTime parsePayDate(String payDate) {
        if (payDate == null || payDate.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(payDate, VNPAY_DATE_FORMAT);
        } catch (RuntimeException exception) {
            return null;
        }
    }

    private String writeRawPayload(Map<String, String> params) {
        try {
            return objectMapper.writeValueAsString(params);
        } catch (JsonProcessingException exception) {
            return "{}";
        }
    }
}

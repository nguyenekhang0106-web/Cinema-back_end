package com.devteria.cinemaback_end.booking.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PaymentReconciliationJob {

    PaymentService paymentService;

    @Scheduled(fixedDelayString = "${app.payment.reconcile-delay-ms:60000}")
    public void reconcilePendingPayments() {
        int expiredCount = paymentService.expireStalePendingPayments();
        if (expiredCount > 0) {
            log.info("[Payment Reconcile] expired {} stale PENDING payment(s)", expiredCount);
        }
    }
}

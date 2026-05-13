package com.devteria.cinemaback_end.booking.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OutboxRetryJob {

    OutboxEventService outboxEventService;

    @Scheduled(fixedDelayString = "${app.outbox.stale-processing-scan-ms:60000}")
    public void releaseStaleProcessingEvents() {
        outboxEventService.releaseStaleProcessingEvents();
    }

    @Scheduled(fixedDelayString = "${app.outbox.failed-retry-delay-ms:300000}")
    public void retryFailedEvents() {
        outboxEventService.retryFailedEvents();
    }
}

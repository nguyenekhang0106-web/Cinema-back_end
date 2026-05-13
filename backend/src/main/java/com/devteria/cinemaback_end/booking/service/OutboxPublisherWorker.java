package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.dto.BookingPaidMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class OutboxPublisherWorker {

    final OutboxEventService outboxEventService;
    final BookingPaymentProducer bookingPaymentProducer;

    @Value("${app.outbox.batch-size:20}")
    int batchSize;

    @Scheduled(fixedDelayString = "${app.outbox.poll-delay-ms:5000}")
    public void publishReadyEvents() {
        List<String> eventIds = outboxEventService.findReadyEventIds(batchSize);
        if (eventIds.isEmpty()) {
            return;
        }

        log.info("[Outbox Worker] found {} event(s) ready to publish", eventIds.size());
        for (String eventId : eventIds) {
            if (!outboxEventService.claimEvent(eventId)) {
                continue;
            }
            try {
                BookingPaidMessage message = outboxEventService.readBookingPaidMessage(eventId);
                bookingPaymentProducer.sendBookingPaid(message);
                outboxEventService.markSent(eventId);
            } catch (Exception exception) {
                outboxEventService.markPublishFailed(eventId, exception);
            }
        }
    }
}

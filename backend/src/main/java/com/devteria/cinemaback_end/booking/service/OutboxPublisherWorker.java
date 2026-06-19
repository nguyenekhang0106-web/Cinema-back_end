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
    final BookingPaidTicketIssuer bookingPaidTicketIssuer;

    @Value("${app.outbox.batch-size:20}")
    int batchSize;

    @Scheduled(fixedDelayString = "${app.outbox.poll-delay-ms:5000}")
    public void publishReadyEvents() {
        List<String> eventIds = outboxEventService.findReadyEventIds(batchSize);
        if (eventIds.isEmpty()) {
            return;
        }

        log.info("[Outbox Worker] found {} event(s) ready to process", eventIds.size());
        for (String eventId : eventIds) {
            if (!outboxEventService.claimEvent(eventId)) {
                continue;
            }

            try {
                BookingPaidMessage message = outboxEventService.readBookingPaidMessage(eventId);

                // Xử lý nội bộ trước để không phụ thuộc hoàn toàn vào RabbitMQ trên môi trường deploy.
                // BookingPaidTicketIssuer có processed_message để chống xử lý trùng, nên nếu Rabbit consumer
                // cũng nhận được message thì nó sẽ tự bỏ qua duplicate event.
                boolean changed = bookingPaidTicketIssuer.issueTickets(message);
                log.info("[Outbox Worker] local BOOKING_PAID handled eventId={}, bookingId={}, changed={}",
                        eventId, message.getBookingId(), changed);

                // Vẫn publish sang RabbitMQ để giữ luồng async/consumer cũ. Nếu publish lỗi nhưng local đã xử lý xong,
                // không để việc gửi Rabbit làm kẹt vé/email của khách.
                try {
                    bookingPaymentProducer.sendBookingPaid(message);
                    log.info("[Outbox Worker] RabbitMQ publish success eventId={}, bookingId={}",
                            eventId, message.getBookingId());
                } catch (Exception publishException) {
                    log.warn("[Outbox Worker] RabbitMQ publish failed after local processing eventId={}, bookingId={}. Mark SENT to avoid duplicate ticket/email.",
                            eventId, message.getBookingId(), publishException);
                }

                outboxEventService.markSent(eventId);
            } catch (Exception exception) {
                log.error("[Outbox Worker] cannot process BOOKING_PAID eventId={}", eventId, exception);
                outboxEventService.markPublishFailed(eventId, exception);
            }
        }
    }
}

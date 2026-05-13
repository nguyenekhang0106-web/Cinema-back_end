package com.devteria.cinemaback_end.booking.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class DlqMonitoringJob {

    final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.booking-paid-dlq:cinema.booking.paid.dlq}")
    String bookingPaidDlq;

    @Scheduled(fixedDelayString = "${app.rabbitmq.dlq-monitor-delay-ms:300000}")
    public void logDlqDepth() {
        try {
            Long messageCount = rabbitTemplate.execute(channel ->
                    Long.valueOf(channel.queueDeclarePassive(bookingPaidDlq).getMessageCount()));
            if (messageCount != null && messageCount > 0) {
                log.error("[RabbitMQ DLQ] queue={} has {} message(s). Inspect and replay manually if needed.",
                        bookingPaidDlq, messageCount);
            }
        } catch (Exception exception) {
            log.warn("[RabbitMQ DLQ] cannot inspect queue={}: {}", bookingPaidDlq, exception.getMessage());
        }
    }
}

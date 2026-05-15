package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.dto.BookingPaidMessage;
import com.rabbitmq.client.Channel;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class BookingPaidConsumer {

    final BookingPaidTicketIssuer bookingPaidTicketIssuer;
    final TicketEmailService ticketEmailService;
    final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.booking-paid-dlx:cinema.booking.dlx}")
    String deadLetterExchange;

    @Value("${app.rabbitmq.booking-paid-dlq-routing-key:cinema.booking.paid.dlq}")
    String deadLetterRoutingKey;

    @Value("${app.rabbitmq.booking-paid-max-retry:5}")
    int maxRetry;

    @RabbitListener(
            queues = "${app.rabbitmq.booking-paid-queue:cinema.booking.paid.queue}",
            containerFactory = "rabbitListenerContainerFactory")
    public void consumeBookingPaid(BookingPaidMessage message, Message amqpMessage, Channel channel) throws IOException {
        long deliveryTag = amqpMessage.getMessageProperties().getDeliveryTag();
        log.info("[Booking Paid Consumer] received BOOKING_PAID eventId={}, bookingId={}",
                message.getEventId(), message.getBookingId());

        try {
            boolean ticketChanged = bookingPaidTicketIssuer.issueTickets(message);
            sendTicketEmailWithoutRollingBackTicket(message);
            channel.basicAck(deliveryTag, false);
            log.info("[Booking Paid Consumer] ACK eventId={}, bookingId={}, ticketChanged={}",
                    message.getEventId(), message.getBookingId(), ticketChanged);
        } catch (DuplicateBookingPaidMessageException duplicateException) {
            channel.basicAck(deliveryTag, false);
            log.info("[Booking Paid Consumer] ACK duplicate eventId={}, bookingId={}",
                    message.getEventId(), message.getBookingId());
        } catch (NonRetryableBookingPaidException exception) {
            sendToDlq(message, exception);
            channel.basicAck(deliveryTag, false);
            log.error("[Booking Paid Consumer] non-retryable event sent to DLQ eventId={}, bookingId={}",
                    message.getEventId(), message.getBookingId(), exception);
        } catch (Exception exception) {
            long retryCount = getRetryCount(amqpMessage);
            if (retryCount >= maxRetry) {
                sendToDlq(message, exception);
                channel.basicAck(deliveryTag, false);
                log.error("[Booking Paid Consumer] retry exhausted, sent to DLQ eventId={}, bookingId={}, retryCount={}",
                        message.getEventId(), message.getBookingId(), retryCount, exception);
                return;
            }

            channel.basicNack(deliveryTag, false, false);
            log.warn("[Booking Paid Consumer] NACK event for retry eventId={}, bookingId={}, retryCount={}",
                    message.getEventId(), message.getBookingId(), retryCount, exception);
        }
    }

    private void sendTicketEmailWithoutRollingBackTicket(BookingPaidMessage message) {
        try {
            ticketEmailService.sendBookingTickets(message.getBookingId());
            log.info("[Booking Paid Consumer] ticket email sent bookingId={}, email={}",
                    message.getBookingId(), message.getCustomerEmail());
        } catch (Exception exception) {
            log.error("[Booking Paid Consumer] cannot send ticket email bookingId={}, email={}",
                    message.getBookingId(), message.getCustomerEmail(), exception);
        }
    }

    private void sendToDlq(BookingPaidMessage message, Exception exception) {
        rabbitTemplate.convertAndSend(deadLetterExchange, deadLetterRoutingKey, message, amqpMessage -> {
            amqpMessage.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
            amqpMessage.getMessageProperties().setHeader("eventId", message.getEventId());
            amqpMessage.getMessageProperties().setHeader("deadLetterReason", exception.getMessage());
            return amqpMessage;
        });
    }

    @SuppressWarnings("unchecked")
    private long getRetryCount(Message amqpMessage) {
        Object xDeathHeader = amqpMessage.getMessageProperties().getHeaders().get("x-death");
        if (!(xDeathHeader instanceof List<?> xDeaths)) {
            return 0;
        }
        return xDeaths.stream()
                .filter(Map.class::isInstance)
                .map(Map.class::cast)
                .map(xDeath -> xDeath.get("count"))
                .filter(Number.class::isInstance)
                .map(Number.class::cast)
                .mapToLong(Number::longValue)
                .sum();
    }
}

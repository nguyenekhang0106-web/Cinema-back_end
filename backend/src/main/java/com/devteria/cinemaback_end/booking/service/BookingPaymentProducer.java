package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.dto.BookingPaidMessage;
import com.devteria.cinemaback_end.booking.entity.Booking;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class BookingPaymentProducer {

    final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.booking-paid-exchange:cinema.booking.exchange}")
    String exchange;

    @Value("${app.rabbitmq.booking-paid-routing-key:cinema.booking.paid}")
    String routingKey;

    public void sendBookingPaid(Booking booking) {
        BookingPaidMessage message = BookingPaidMessage.builder()
                .eventId("BOOKING_PAID:" + booking.getId())
                .bookingId(booking.getId())
                .bookingCode(booking.getBookingCode())
                .customerId(booking.getCustomer().getId())
                .customerEmail(booking.getCustomer().getEmail())
                .totalAmount(booking.getTotalAmount())
                .ticketIds(booking.getTickets().stream().map(ticket -> ticket.getId()).toList())
                .seatIds(booking.getTickets().stream().map(ticket -> ticket.getSeat().getId()).toList())
                .paidAt(LocalDateTime.now())
                .build();

        sendBookingPaid(message);
    }

    public void sendBookingPaid(BookingPaidMessage message) {
        try {
            CorrelationData correlationData = new CorrelationData(message.getEventId() + ":" + UUID.randomUUID());
            rabbitTemplate.convertAndSend(exchange, routingKey, message, amqpMessage -> {
                amqpMessage.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                amqpMessage.getMessageProperties().setMessageId(message.getEventId());
                amqpMessage.getMessageProperties().setHeader("eventId", message.getEventId());
                return amqpMessage;
            }, correlationData);

            CorrelationData.Confirm confirm = correlationData.getFuture().get(10, TimeUnit.SECONDS);
            if (confirm == null || !confirm.isAck()) {
                throw new AmqpException("RabbitMQ publisher confirm failed: "
                        + (confirm == null ? "timeout" : confirm.getReason()));
            }
            if (correlationData.getReturned() != null) {
                throw new AmqpException("RabbitMQ mandatory publish returned: "
                        + correlationData.getReturned().getReplyText());
            }

            log.info("[RabbitMQ] sent and confirmed booking paid message eventId={}, bookingId={}, exchange={}, routingKey={}",
                    message.getEventId(), message.getBookingId(), exchange, routingKey);
        } catch (AmqpException exception) {
            log.error("[RabbitMQ] cannot send booking paid message eventId={}, bookingId={}, exchange={}, routingKey={}",
                    message.getEventId(), message.getBookingId(), exchange, routingKey, exception);
            throw exception;
        } catch (Exception exception) {
            log.error("[RabbitMQ] publisher confirm failed eventId={}, bookingId={}, exchange={}, routingKey={}",
                    message.getEventId(), message.getBookingId(), exchange, routingKey, exception);
            throw new AmqpException("Cannot confirm booking paid message", exception);
        }
    }
}

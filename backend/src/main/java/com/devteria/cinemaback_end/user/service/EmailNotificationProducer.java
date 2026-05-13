package com.devteria.cinemaback_end.user.service;

import com.devteria.cinemaback_end.common.SecurityUtils;
import com.devteria.cinemaback_end.user.dto.EmailNotificationMessage;
import com.devteria.cinemaback_end.user.dto.EmailNotificationType;
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
public class EmailNotificationProducer {

    final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.email-exchange:cinema.email.exchange}")
    String exchange;

    @Value("${app.rabbitmq.email-routing-key:cinema.email.notification}")
    String routingKey;

    public void publishVerificationCode(String toEmail, String fullName, String verificationCode) {
        EmailNotificationMessage message = EmailNotificationMessage.builder()
                .messageId("EMAIL_VERIFICATION:" + UUID.randomUUID())
                .type(EmailNotificationType.EMAIL_VERIFICATION)
                .toEmail(toEmail)
                .fullName(fullName)
                .verificationCode(verificationCode)
                .createdAt(LocalDateTime.now())
                .build();

        publish(message);
    }

    public void publishPasswordResetLink(String toEmail, String resetLink) {
        EmailNotificationMessage message = EmailNotificationMessage.builder()
                .messageId("PASSWORD_RESET:" + UUID.randomUUID())
                .type(EmailNotificationType.PASSWORD_RESET)
                .toEmail(toEmail)
                .resetLink(resetLink)
                .createdAt(LocalDateTime.now())
                .build();

        publish(message);
    }

    private void publish(EmailNotificationMessage message) {
        try {
            CorrelationData correlationData = new CorrelationData(message.getMessageId() + ":" + UUID.randomUUID());
            rabbitTemplate.convertAndSend(exchange, routingKey, message, amqpMessage -> {
                amqpMessage.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                amqpMessage.getMessageProperties().setMessageId(message.getMessageId());
                amqpMessage.getMessageProperties().setHeader("messageId", message.getMessageId());
                amqpMessage.getMessageProperties().setHeader("emailType", message.getType().name());
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

            log.info("[Email Producer] queued email messageId={}, type={}, emailHash={}, exchange={}, routingKey={}",
                    message.getMessageId(), message.getType(), SecurityUtils.hashSensitiveData(message.getToEmail()),
                    exchange, routingKey);
        } catch (AmqpException exception) {
            log.error("[Email Producer] cannot queue email messageId={}, type={}, emailHash={}",
                    message.getMessageId(), message.getType(), SecurityUtils.hashSensitiveData(message.getToEmail()), exception);
            throw exception;
        } catch (Exception exception) {
            log.error("[Email Producer] publisher confirm failed messageId={}, type={}, emailHash={}",
                    message.getMessageId(), message.getType(), SecurityUtils.hashSensitiveData(message.getToEmail()), exception);
            throw new AmqpException("Cannot confirm email notification message", exception);
        }
    }
}

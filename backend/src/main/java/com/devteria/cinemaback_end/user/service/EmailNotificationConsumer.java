package com.devteria.cinemaback_end.user.service;

import com.devteria.cinemaback_end.common.SecurityUtils;
import com.devteria.cinemaback_end.user.dto.EmailNotificationMessage;
import com.devteria.cinemaback_end.user.dto.EmailNotificationType;
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
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class EmailNotificationConsumer {

    private static final String PROCESSED_EMAIL_MESSAGE_PREFIX = "cinema:email_message_processed:";
    private static final Duration PROCESSED_EMAIL_MESSAGE_TTL = Duration.ofDays(7);

    final EmailSenderService emailSenderService;
    final RabbitTemplate rabbitTemplate;
    final StringRedisTemplate redisTemplate;

    @Value("${app.rabbitmq.email-dlx:cinema.email.dlx}")
    String deadLetterExchange;

    @Value("${app.rabbitmq.email-dlq-routing-key:cinema.email.dlq}")
    String deadLetterRoutingKey;

    @Value("${app.rabbitmq.email-max-retry:5}")
    int maxRetry;

    @RabbitListener(
            queues = "${app.rabbitmq.email-queue:cinema.email.queue}",
            containerFactory = "rabbitListenerContainerFactory")
    public void consumeEmailNotification(
            EmailNotificationMessage message,
            Message amqpMessage,
            Channel channel) throws IOException {
        long deliveryTag = amqpMessage.getMessageProperties().getDeliveryTag();
        String messageId = resolveMessageId(message, amqpMessage);
        String emailHash = message != null && message.getToEmail() != null
                ? SecurityUtils.hashSensitiveData(message.getToEmail())
                : "unknown";

        log.info("[Email Consumer] received messageId={}, type={}, emailHash={}",
                messageId, message != null ? message.getType() : null, emailHash);

        try {
            validateMessage(message);

            if (Boolean.TRUE.equals(redisTemplate.hasKey(processedKey(messageId)))) {
                channel.basicAck(deliveryTag, false);
                log.info("[Email Consumer] ACK duplicate messageId={}, type={}, emailHash={}",
                        messageId, message.getType(), emailHash);
                return;
            }

            sendEmail(message);
            redisTemplate.opsForValue().set(processedKey(messageId), "1", PROCESSED_EMAIL_MESSAGE_TTL);

            channel.basicAck(deliveryTag, false);
            log.info("[Email Consumer] ACK sent messageId={}, type={}, emailHash={}",
                    messageId, message.getType(), emailHash);
        } catch (Exception exception) {
            handleFailure(message, messageId, emailHash, amqpMessage, channel, deliveryTag, exception);
        }
    }

    private void sendEmail(EmailNotificationMessage message) {
        if (message.getType() == EmailNotificationType.EMAIL_VERIFICATION) {
            emailSenderService.sendVerificationCode(
                    message.getToEmail(),
                    message.getFullName(),
                    message.getVerificationCode());
            return;
        }

        if (message.getType() == EmailNotificationType.PASSWORD_RESET) {
            emailSenderService.sendPasswordResetLink(message.getToEmail(), message.getResetLink());
            return;
        }

        throw new IllegalArgumentException("Unsupported email notification type: " + message.getType());
    }

    private void validateMessage(EmailNotificationMessage message) {
        if (message == null || message.getMessageId() == null || message.getType() == null || message.getToEmail() == null) {
            throw new IllegalArgumentException("Invalid email notification message");
        }
        if (message.getType() == EmailNotificationType.EMAIL_VERIFICATION && message.getVerificationCode() == null) {
            throw new IllegalArgumentException("Verification email message missing OTP");
        }
        if (message.getType() == EmailNotificationType.PASSWORD_RESET && message.getResetLink() == null) {
            throw new IllegalArgumentException("Password reset email message missing reset link");
        }
    }

    private void handleFailure(
            EmailNotificationMessage message,
            String messageId,
            String emailHash,
            Message amqpMessage,
            Channel channel,
            long deliveryTag,
            Exception exception) throws IOException {
        long retryCount = getRetryCount(amqpMessage);
        if (retryCount >= maxRetry) {
            sendToDlq(message, messageId, exception);
            channel.basicAck(deliveryTag, false);
            log.error("[Email Consumer] retry exhausted, sent to DLQ messageId={}, emailHash={}, retryCount={}",
                    messageId, emailHash, retryCount, exception);
            return;
        }

        channel.basicNack(deliveryTag, false, false);
        log.warn("[Email Consumer] NACK for retry messageId={}, emailHash={}, retryCount={}",
                messageId, emailHash, retryCount, exception);
    }

    private void sendToDlq(EmailNotificationMessage message, String messageId, Exception exception) {
        Object payload = message != null
                ? message
                : Map.of("messageId", messageId, "error", "Invalid email notification message");

        rabbitTemplate.convertAndSend(deadLetterExchange, deadLetterRoutingKey, payload, amqpMessage -> {
            amqpMessage.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
            amqpMessage.getMessageProperties().setMessageId(messageId);
            amqpMessage.getMessageProperties().setHeader("messageId", messageId);
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

    private String resolveMessageId(EmailNotificationMessage message, Message amqpMessage) {
        if (message != null && message.getMessageId() != null) {
            return message.getMessageId();
        }
        String amqpMessageId = amqpMessage.getMessageProperties().getMessageId();
        return amqpMessageId != null ? amqpMessageId : "UNKNOWN_EMAIL_MESSAGE";
    }

    private String processedKey(String messageId) {
        return PROCESSED_EMAIL_MESSAGE_PREFIX + messageId;
    }
}

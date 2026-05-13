package com.devteria.cinemaback_end.configuration;

import com.devteria.cinemaback_end.booking.service.SeatHoldExpirationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;

import java.nio.charset.StandardCharsets;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class RedisKeyExpirationConfig {

    SeatHoldExpirationService seatHoldExpirationService;

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(RedisConnectionFactory connectionFactory) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener((message, pattern) -> {
            String expiredKey = new String(message.getBody(), StandardCharsets.UTF_8);
            seatHoldExpirationService.handleExpiredSeatHold(expiredKey);
        }, new PatternTopic("__keyevent@*__:expired"));
        return container;
    }

    @Bean
    public ApplicationRunner redisKeyspaceNotificationRunner(RedisConnectionFactory connectionFactory) {
        return args -> {
            RedisConnection connection = null;
            try {
                connection = connectionFactory.getConnection();
                connection.serverCommands().setConfig("notify-keyspace-events", "Ex");
                log.info("Redis Keyspace Notifications enabled for expired events");
            } catch (Exception exception) {
                log.warn("Cannot enable Redis Keyspace Notifications automatically: {}", exception.getMessage());
            } finally {
                if (connection != null) {
                    connection.close();
                }
            }
        };
    }
}

package com.devteria.cinemaback_end.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableRabbit
@Slf4j
public class RabbitMQConfig {

    @Bean
    public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
        RabbitAdmin rabbitAdmin = new RabbitAdmin(connectionFactory);
        rabbitAdmin.setAutoStartup(true);
        rabbitAdmin.setIgnoreDeclarationExceptions(true);
        return rabbitAdmin;
    }

    // ========================= BOOKING PAID =========================

    @Bean
    public Queue bookingPaidQueue(
            @Value("${app.rabbitmq.booking-paid-queue:cinema.booking.paid.queue}") String queueName,
            @Value("${app.rabbitmq.booking-paid-retry-exchange:cinema.booking.retry.exchange}") String retryExchange,
            @Value("${app.rabbitmq.booking-paid-retry-routing-key:cinema.booking.paid.retry}") String retryRoutingKey) {

        return QueueBuilder.durable(queueName)
                .withArgument("x-dead-letter-exchange", retryExchange)
                .withArgument("x-dead-letter-routing-key", retryRoutingKey)
                .build();
    }

    @Bean
    public Queue bookingPaidRetryQueue(
            @Value("${app.rabbitmq.booking-paid-retry-queue:cinema.booking.paid.retry.queue}") String queueName,
            @Value("${app.rabbitmq.booking-paid-exchange:cinema.booking.exchange}") String exchange,
            @Value("${app.rabbitmq.booking-paid-routing-key:cinema.booking.paid}") String routingKey,
            @Value("${app.rabbitmq.booking-paid-retry-delay-ms:10000}") Integer retryDelayMs) {

        return QueueBuilder.durable(queueName)
                .withArgument("x-message-ttl", retryDelayMs)
                .withArgument("x-dead-letter-exchange", exchange)
                .withArgument("x-dead-letter-routing-key", routingKey)
                .build();
    }

    @Bean
    public Queue bookingPaidDlq(
            @Value("${app.rabbitmq.booking-paid-dlq:cinema.booking.paid.dlq}") String queueName) {

        return QueueBuilder.durable(queueName).build();
    }

    @Bean
    public DirectExchange bookingPaidExchange(
            @Value("${app.rabbitmq.booking-paid-exchange:cinema.booking.exchange}") String exchangeName) {

        return new DirectExchange(exchangeName, true, false);
    }

    @Bean
    public DirectExchange bookingPaidRetryExchange(
            @Value("${app.rabbitmq.booking-paid-retry-exchange:cinema.booking.retry.exchange}") String exchangeName) {

        return new DirectExchange(exchangeName, true, false);
    }

    @Bean
    public DirectExchange bookingPaidDeadLetterExchange(
            @Value("${app.rabbitmq.booking-paid-dlx:cinema.booking.dlx}") String exchangeName) {

        return new DirectExchange(exchangeName, true, false);
    }

    @Bean
    public Binding bookingPaidBinding(
            @Qualifier("bookingPaidQueue") Queue bookingPaidQueue,
            @Qualifier("bookingPaidExchange") DirectExchange bookingPaidExchange,
            @Value("${app.rabbitmq.booking-paid-routing-key:cinema.booking.paid}") String routingKey) {

        return BindingBuilder.bind(bookingPaidQueue)
                .to(bookingPaidExchange)
                .with(routingKey);
    }

    @Bean
    public Binding bookingPaidRetryBinding(
            @Qualifier("bookingPaidRetryQueue") Queue bookingPaidRetryQueue,
            @Qualifier("bookingPaidRetryExchange") DirectExchange bookingPaidRetryExchange,
            @Value("${app.rabbitmq.booking-paid-retry-routing-key:cinema.booking.paid.retry}") String routingKey) {

        return BindingBuilder.bind(bookingPaidRetryQueue)
                .to(bookingPaidRetryExchange)
                .with(routingKey);
    }

    @Bean
    public Binding bookingPaidDlqBinding(
            @Qualifier("bookingPaidDlq") Queue bookingPaidDlq,
            @Qualifier("bookingPaidDeadLetterExchange") DirectExchange bookingPaidDeadLetterExchange,
            @Value("${app.rabbitmq.booking-paid-dlq-routing-key:cinema.booking.paid.dlq}") String routingKey) {

        return BindingBuilder.bind(bookingPaidDlq)
                .to(bookingPaidDeadLetterExchange)
                .with(routingKey);
    }

    // ========================= EMAIL =========================

    @Bean
    public Queue emailQueue(
            @Value("${app.rabbitmq.email-queue:cinema.email.queue}") String queueName,
            @Value("${app.rabbitmq.email-retry-exchange:cinema.email.retry.exchange}") String retryExchange,
            @Value("${app.rabbitmq.email-retry-routing-key:cinema.email.retry}") String retryRoutingKey) {

        return QueueBuilder.durable(queueName)
                .withArgument("x-dead-letter-exchange", retryExchange)
                .withArgument("x-dead-letter-routing-key", retryRoutingKey)
                .build();
    }

    @Bean
    public Queue emailRetryQueue(
            @Value("${app.rabbitmq.email-retry-queue:cinema.email.retry.queue}") String queueName,
            @Value("${app.rabbitmq.email-exchange:cinema.email.exchange}") String exchange,
            @Value("${app.rabbitmq.email-routing-key:cinema.email.notification}") String routingKey,
            @Value("${app.rabbitmq.email-retry-delay-ms:30000}") Integer retryDelayMs) {

        return QueueBuilder.durable(queueName)
                .withArgument("x-message-ttl", retryDelayMs)
                .withArgument("x-dead-letter-exchange", exchange)
                .withArgument("x-dead-letter-routing-key", routingKey)
                .build();
    }

    @Bean
    public Queue emailDlq(
            @Value("${app.rabbitmq.email-dlq:cinema.email.dlq}") String queueName) {

        return QueueBuilder.durable(queueName).build();
    }

    @Bean
    public DirectExchange emailExchange(
            @Value("${app.rabbitmq.email-exchange:cinema.email.exchange}") String exchangeName) {

        return new DirectExchange(exchangeName, true, false);
    }

    @Bean
    public DirectExchange emailRetryExchange(
            @Value("${app.rabbitmq.email-retry-exchange:cinema.email.retry.exchange}") String exchangeName) {

        return new DirectExchange(exchangeName, true, false);
    }

    @Bean
    public DirectExchange emailDeadLetterExchange(
            @Value("${app.rabbitmq.email-dlx:cinema.email.dlx}") String exchangeName) {

        return new DirectExchange(exchangeName, true, false);
    }

    @Bean
    public Binding emailBinding(
            @Qualifier("emailQueue") Queue emailQueue,
            @Qualifier("emailExchange") DirectExchange emailExchange,
            @Value("${app.rabbitmq.email-routing-key:cinema.email.notification}") String routingKey) {

        return BindingBuilder.bind(emailQueue)
                .to(emailExchange)
                .with(routingKey);
    }

    @Bean
    public Binding emailRetryBinding(
            @Qualifier("emailRetryQueue") Queue emailRetryQueue,
            @Qualifier("emailRetryExchange") DirectExchange emailRetryExchange,
            @Value("${app.rabbitmq.email-retry-routing-key:cinema.email.retry}") String routingKey) {

        return BindingBuilder.bind(emailRetryQueue)
                .to(emailRetryExchange)
                .with(routingKey);
    }

    @Bean
    public Binding emailDlqBinding(
            @Qualifier("emailDlq") Queue emailDlq,
            @Qualifier("emailDeadLetterExchange") DirectExchange emailDeadLetterExchange,
            @Value("${app.rabbitmq.email-dlq-routing-key:cinema.email.dlq}") String routingKey) {

        return BindingBuilder.bind(emailDlq)
                .to(emailDeadLetterExchange)
                .with(routingKey);
    }

    // ========================= TOPOLOGY INIT =========================

    @Bean
    public ApplicationRunner rabbitTopologyInitializer(
            RabbitAdmin rabbitAdmin,
            @Qualifier("bookingPaidQueue") Queue bookingPaidQueue,
            @Qualifier("bookingPaidRetryQueue") Queue bookingPaidRetryQueue,
            @Qualifier("bookingPaidDlq") Queue bookingPaidDlq,
            @Qualifier("bookingPaidExchange") DirectExchange bookingPaidExchange,
            @Qualifier("bookingPaidRetryExchange") DirectExchange bookingPaidRetryExchange,
            @Qualifier("bookingPaidDeadLetterExchange") DirectExchange bookingPaidDeadLetterExchange,
            @Qualifier("bookingPaidBinding") Binding bookingPaidBinding,
            @Qualifier("bookingPaidRetryBinding") Binding bookingPaidRetryBinding,
            @Qualifier("bookingPaidDlqBinding") Binding bookingPaidDlqBinding) {

        return args -> {
            try {
                rabbitAdmin.declareExchange(bookingPaidExchange);
                rabbitAdmin.declareExchange(bookingPaidRetryExchange);
                rabbitAdmin.declareExchange(bookingPaidDeadLetterExchange);

                rabbitAdmin.declareQueue(bookingPaidQueue);
                rabbitAdmin.declareQueue(bookingPaidRetryQueue);
                rabbitAdmin.declareQueue(bookingPaidDlq);

                rabbitAdmin.declareBinding(bookingPaidBinding);
                rabbitAdmin.declareBinding(bookingPaidRetryBinding);
                rabbitAdmin.declareBinding(bookingPaidDlqBinding);

                log.info(
                        "[RabbitMQ] declared booking paid topology exchange={}, queue={}, retryQueue={}, dlq={}",
                        bookingPaidExchange.getName(),
                        bookingPaidQueue.getName(),
                        bookingPaidRetryQueue.getName(),
                        bookingPaidDlq.getName()
                );
            } catch (AmqpException exception) {
                log.error("[RabbitMQ] cannot declare booking paid topology", exception);
            }
        };
    }

    @Bean
    public ApplicationRunner emailRabbitTopologyInitializer(
            RabbitAdmin rabbitAdmin,
            @Qualifier("emailQueue") Queue emailQueue,
            @Qualifier("emailRetryQueue") Queue emailRetryQueue,
            @Qualifier("emailDlq") Queue emailDlq,
            @Qualifier("emailExchange") DirectExchange emailExchange,
            @Qualifier("emailRetryExchange") DirectExchange emailRetryExchange,
            @Qualifier("emailDeadLetterExchange") DirectExchange emailDeadLetterExchange,
            @Qualifier("emailBinding") Binding emailBinding,
            @Qualifier("emailRetryBinding") Binding emailRetryBinding,
            @Qualifier("emailDlqBinding") Binding emailDlqBinding) {

        return args -> {
            try {
                rabbitAdmin.declareExchange(emailExchange);
                rabbitAdmin.declareExchange(emailRetryExchange);
                rabbitAdmin.declareExchange(emailDeadLetterExchange);

                rabbitAdmin.declareQueue(emailQueue);
                rabbitAdmin.declareQueue(emailRetryQueue);
                rabbitAdmin.declareQueue(emailDlq);

                rabbitAdmin.declareBinding(emailBinding);
                rabbitAdmin.declareBinding(emailRetryBinding);
                rabbitAdmin.declareBinding(emailDlqBinding);

                log.info(
                        "[RabbitMQ] declared email topology exchange={}, queue={}, retryQueue={}, dlq={}",
                        emailExchange.getName(),
                        emailQueue.getName(),
                        emailRetryQueue.getName(),
                        emailDlq.getName()
                );
            } catch (AmqpException exception) {
                log.error("[RabbitMQ] cannot declare email topology", exception);
            }
        };
    }

    // ========================= MESSAGE CONVERTER =========================

    @Bean
    @SuppressWarnings("deprecation") // "Bùa" dập tắt cảnh báo gạch ngang
    public Jackson2JsonMessageConverter jackson2JsonMessageConverter() {
        ObjectMapper objectMapper = new ObjectMapper();

        // Dạy Jackson hiểu kiểu thời gian mới
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // Truyền thẳng objectMapper vào trong ngoặc (Đây là cách chuẩn nhất)
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    @Bean
    public RabbitTemplate rabbitTemplate(
            ConnectionFactory connectionFactory,
            Jackson2JsonMessageConverter jackson2JsonMessageConverter) {

        if (connectionFactory instanceof CachingConnectionFactory cachingConnectionFactory) {
            cachingConnectionFactory.setPublisherConfirmType(
                    CachingConnectionFactory.ConfirmType.CORRELATED
            );
            cachingConnectionFactory.setPublisherReturns(true);
        }

        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jackson2JsonMessageConverter);
        rabbitTemplate.setMandatory(true);

        rabbitTemplate.setReturnsCallback(returned -> log.error(
                "[RabbitMQ] mandatory publish returned exchange={}, routingKey={}, replyCode={}, replyText={}",
                returned.getExchange(),
                returned.getRoutingKey(),
                returned.getReplyCode(),
                returned.getReplyText()
        ));

        return rabbitTemplate;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            Jackson2JsonMessageConverter jackson2JsonMessageConverter) {

        SimpleRabbitListenerContainerFactory factory =
                new SimpleRabbitListenerContainerFactory();

        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jackson2JsonMessageConverter);
        factory.setAcknowledgeMode(AcknowledgeMode.MANUAL);
        factory.setDefaultRequeueRejected(false);

        return factory;
    }
}

package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.dto.BookingPaidMessage;
import com.devteria.cinemaback_end.booking.entity.Booking;
import com.devteria.cinemaback_end.booking.entity.OutboxEvent;
import com.devteria.cinemaback_end.booking.entity.enums.OutboxEventStatus;
import com.devteria.cinemaback_end.booking.entity.enums.OutboxEventType;
import com.devteria.cinemaback_end.booking.repository.OutboxEventRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class OutboxEventService {

    private static final int MAX_RETRY = 10;
    private static final List<OutboxEventStatus> READY_STATUSES = List.of(OutboxEventStatus.PENDING);

    OutboxEventRepository outboxEventRepository;
    ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    @Transactional
    public void enqueueBookingPaid(Booking booking) {
        upsertBookingPaid(booking, false);
    }

    @Transactional
    public void requeueBookingPaid(Booking booking) {
        upsertBookingPaid(booking, true);
    }

    private void upsertBookingPaid(Booking booking, boolean forceRequeue) {
        String eventKey = buildBookingPaidEventKey(booking.getId());
        BookingPaidMessage message = buildBookingPaidMessage(booking, eventKey);
        OutboxEvent existingEvent = outboxEventRepository.findByEventKey(eventKey).orElse(null);

        if (existingEvent != null) {
            if (!forceRequeue) {
                log.info("[Outbox] booking paid event already exists bookingId={}, status={}",
                        booking.getId(), existingEvent.getStatus());
                return;
            }
            existingEvent.setPayload(writePayload(message));
            existingEvent.setStatus(OutboxEventStatus.PENDING);
            existingEvent.setAvailableAt(LocalDateTime.now());
            existingEvent.setLockedAt(null);
            existingEvent.setRetryCount(0);
            existingEvent.setErrorMessage(null);
            outboxEventRepository.save(existingEvent);
            log.warn("[Outbox] requeued BOOKING_PAID event bookingId={}, eventKey={}", booking.getId(), eventKey);
            return;
        }

        OutboxEvent outboxEvent = OutboxEvent.builder()
                .eventType(OutboxEventType.BOOKING_PAID)
                .eventKey(eventKey)
                .aggregateId(booking.getId())
                .payload(writePayload(message))
                .status(OutboxEventStatus.PENDING)
                .build();

        outboxEventRepository.save(outboxEvent);
        log.info("[Outbox] saved BOOKING_PAID event bookingId={}, eventKey={}", booking.getId(), eventKey);
    }

    @Transactional(readOnly = true)
    public List<String> findReadyEventIds(int limit) {
        return outboxEventRepository.findReadyEventIds(
                READY_STATUSES,
                LocalDateTime.now(),
                PageRequest.of(0, limit));
    }

    @Transactional
    public boolean claimEvent(String eventId) {
        int updated = outboxEventRepository.claimEvent(
                eventId,
                READY_STATUSES,
                OutboxEventStatus.PROCESSING,
                LocalDateTime.now());
        if (updated > 0) {
            log.info("[Outbox] claimed event eventId={}", eventId);
            return true;
        }
        return false;
    }

    @Transactional(readOnly = true)
    public BookingPaidMessage readBookingPaidMessage(String eventId) {
        OutboxEvent outboxEvent = outboxEventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalStateException("Outbox event not found: " + eventId));
        if (outboxEvent.getEventType() != OutboxEventType.BOOKING_PAID) {
            throw new IllegalStateException("Unsupported outbox event type: " + outboxEvent.getEventType());
        }
        return readPayload(outboxEvent.getPayload());
    }

    @Transactional
    public void markSent(String eventId) {
        OutboxEvent outboxEvent = outboxEventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalStateException("Outbox event not found: " + eventId));
        outboxEvent.setStatus(OutboxEventStatus.SENT);
        outboxEvent.setSentAt(LocalDateTime.now());
        outboxEvent.setLockedAt(null);
        outboxEvent.setErrorMessage(null);
        outboxEventRepository.save(outboxEvent);
        log.info("[Outbox] marked event SENT eventId={}, eventKey={}", outboxEvent.getId(), outboxEvent.getEventKey());
    }

    @Transactional
    public void markPublishFailed(String eventId, Exception exception) {
        OutboxEvent outboxEvent = outboxEventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalStateException("Outbox event not found: " + eventId));
        int nextRetryCount = outboxEvent.getRetryCount() + 1;
        outboxEvent.setRetryCount(nextRetryCount);
        outboxEvent.setLockedAt(null);
        outboxEvent.setErrorMessage(truncate(exception.getMessage()));

        if (nextRetryCount >= MAX_RETRY) {
            outboxEvent.setStatus(OutboxEventStatus.FAILED);
            log.error("[Outbox] event FAILED after max retries eventId={}, eventKey={}",
                    outboxEvent.getId(), outboxEvent.getEventKey(), exception);
        } else {
            outboxEvent.setStatus(OutboxEventStatus.PENDING);
            outboxEvent.setAvailableAt(LocalDateTime.now().plusSeconds(nextDelaySeconds(nextRetryCount)));
            log.warn("[Outbox] event publish failed and will retry eventId={}, eventKey={}, retryCount={}",
                    outboxEvent.getId(), outboxEvent.getEventKey(), nextRetryCount, exception);
        }

        outboxEventRepository.save(outboxEvent);
    }

    @Transactional
    public int releaseStaleProcessingEvents() {
        int released = outboxEventRepository.releaseStaleProcessingEvents(
                OutboxEventStatus.PROCESSING,
                OutboxEventStatus.PENDING,
                LocalDateTime.now().minusMinutes(5),
                LocalDateTime.now(),
                "Released stale PROCESSING event");
        if (released > 0) {
            log.warn("[Outbox] released {} stale PROCESSING event(s)", released);
        }
        return released;
    }

    @Transactional
    public int retryFailedEvents() {
        int retried = outboxEventRepository.retryFailedEvents(
                OutboxEventStatus.FAILED,
                OutboxEventStatus.PENDING,
                LocalDateTime.now(),
                "Scheduled retry for FAILED event");
        if (retried > 0) {
            log.warn("[Outbox] requeued {} FAILED event(s)", retried);
        }
        return retried;
    }

    private BookingPaidMessage buildBookingPaidMessage(Booking booking, String eventKey) {
        return BookingPaidMessage.builder()
                .eventId(eventKey)
                .bookingId(booking.getId())
                .bookingCode(booking.getBookingCode())
                .customerId(booking.getCustomer().getId())
                .customerEmail(booking.getCustomer().getEmail())
                .totalAmount(booking.getTotalAmount())
                .ticketIds(booking.getTickets().stream().map(ticket -> ticket.getId()).toList())
                .seatIds(booking.getTickets().stream().map(ticket -> ticket.getSeat().getId()).toList())
                .paidAt(LocalDateTime.now())
                .build();
    }

    private String buildBookingPaidEventKey(String bookingId) {
        return OutboxEventType.BOOKING_PAID.name() + ":" + bookingId;
    }

    private String writePayload(BookingPaidMessage message) {
        try {
            return objectMapper.writeValueAsString(message);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Cannot serialize booking paid payload", exception);
        }
    }

    private BookingPaidMessage readPayload(String payload) {
        try {
            return objectMapper.readValue(payload, BookingPaidMessage.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Cannot deserialize booking paid payload", exception);
        }
    }

    private long nextDelaySeconds(int retryCount) {
        return Math.min(300L, retryCount * 10L);
    }

    private String truncate(String value) {
        if (value == null) {
            return null;
        }
        return value.length() <= 1000 ? value : value.substring(0, 1000);
    }
}

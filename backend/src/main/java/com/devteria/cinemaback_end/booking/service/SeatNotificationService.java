package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.dto.SeatStatusMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class SeatNotificationService {

    SimpMessagingTemplate messagingTemplate;

    public void sendSeatStatus(String showtimeId, List<String> seatIds, String status, String userId, String bookingId) {
        SeatStatusMessage message = SeatStatusMessage.builder()
                .showtimeId(showtimeId)
                .seatIds(seatIds)
                .status(status)
                .userId(userId)
                .bookingId(bookingId)
                .timestamp(LocalDateTime.now())
                .build();

        log.info("[Gửi WebSocket] showtimeId={}, seatIds={}, status={}", showtimeId, seatIds, status);
        messagingTemplate.convertAndSend("/topic/seats", message);
    }
}

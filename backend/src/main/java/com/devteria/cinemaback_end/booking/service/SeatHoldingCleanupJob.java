package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.entity.Booking;
import com.devteria.cinemaback_end.booking.entity.SeatHolding;
import com.devteria.cinemaback_end.booking.entity.enums.BookingStatus;
import com.devteria.cinemaback_end.booking.entity.enums.SeatHoldingStatus;
import com.devteria.cinemaback_end.booking.repository.BookingRepository;
import com.devteria.cinemaback_end.booking.repository.SeatHoldingRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class SeatHoldingCleanupJob {

    SeatHoldingRepository seatHoldingRepository;
    BookingRepository bookingRepository;
    BookingService bookingService;
    SeatNotificationService seatNotificationService; // 🔥 Bổ sung service bắn WebSocket

    // Chạy ngầm mỗi 10 giây (10000ms) để nhả ghế tức thì cho mượt mà
    @Scheduled(fixedRateString = "${app.booking.seat-holding-scan-ms:10000}")
    @Transactional
    public void expireStaleHoldings() {
        List<SeatHolding> expiredHoldings = seatHoldingRepository.findByStatusAndExpiresAtBefore(
                SeatHoldingStatus.HOLDING,
                LocalDateTime.now());

        if (expiredHoldings.isEmpty()) {
            return;
        }

        // Gom nhóm theo suất chiếu để bắn WebSocket 1 lần cho nhiều ghế
        Map<String, List<SeatHolding>> holdingsByShowtime = expiredHoldings.stream()
                .collect(Collectors.groupingBy(SeatHolding::getShowtimeId));

        for (Map.Entry<String, List<SeatHolding>> entry : holdingsByShowtime.entrySet()) {
            String showtimeId = entry.getKey();
            List<SeatHolding> holdings = entry.getValue();
            List<String> orphanSeatIds = new ArrayList<>();

            for (SeatHolding holding : holdings) {
                try {
                    Booking booking = bookingRepository.findById(holding.getBookingId()).orElse(null);

                    if (booking == null) {
                        // 🔥 TRƯỜNG HỢP 1: Khách giữ ghế nhưng chưa tạo đơn hàng (Bỏ ngang)
                        holding.setStatus(SeatHoldingStatus.EXPIRED);
                        holding.setActiveLockKey(null);
                        seatHoldingRepository.save(holding);
                        orphanSeatIds.add(holding.getSeatId());
                    } else if (booking.getStatus() == BookingStatus.PENDING) {
                        // 🔥 TRƯỜNG HỢP 2: Đã tạo đơn nhưng không thanh toán kịp
                        // Hàm này bên trong đã tự động gọi SeatNotificationService rồi nên ta không cần gom ID nữa
                        bookingService.expireBookingIfDue(booking.getId());
                    }
                } catch (Exception exception) {
                    log.error("[Seat Holding Cleanup] cannot release stale holdingId={}, bookingId={}",
                            holding.getId(), holding.getBookingId(), exception);
                }
            }

            // Bắn WebSocket để nhả ghế thành màu trắng (AVAILABLE) trên màn hình mọi người
            if (!orphanSeatIds.isEmpty()) {
                seatNotificationService.sendSeatStatus(showtimeId, orphanSeatIds, "AVAILABLE", "SYSTEM", null);
                log.info("[Cleanup Job] Đã tự động nhả {} ghế rác cho suất chiếu {}", orphanSeatIds.size(), showtimeId);
            }
        }
    }
}
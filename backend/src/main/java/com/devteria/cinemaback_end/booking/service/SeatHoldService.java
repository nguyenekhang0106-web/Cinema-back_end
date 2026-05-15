package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.dto.SeatHoldResponse;
import com.devteria.cinemaback_end.booking.entity.Booking;
import com.devteria.cinemaback_end.booking.entity.SeatHolding;
import com.devteria.cinemaback_end.booking.entity.enums.SeatHoldingStatus;
import com.devteria.cinemaback_end.booking.entity.enums.TicketStatus;
import com.devteria.cinemaback_end.booking.repository.SeatHoldingRepository;
import com.devteria.cinemaback_end.booking.repository.TicketRepository;
import com.devteria.cinemaback_end.cinema.entity.Seat;
import com.devteria.cinemaback_end.cinema.entity.enums.SeatStatus;
import com.devteria.cinemaback_end.cinema.repository.SeatRepository;
import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.movie.entity.Showtime;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class SeatHoldService {

    public static final Duration HOLD_TIME = Duration.ofMinutes(5);

    private static final List<TicketStatus> ACTIVE_TICKET_STATUSES = List.of(
            TicketStatus.PENDING,
            TicketStatus.VALID,
            TicketStatus.SCANNED
    );
    private static final List<SeatHoldingStatus> ACTIVE_HOLDING_STATUSES = List.of(
            SeatHoldingStatus.HOLDING,
            SeatHoldingStatus.CONFIRMED
    );
    private static final DefaultRedisScript<Long> RELEASE_SCRIPT = new DefaultRedisScript<>(
            "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
            Long.class
    );

    StringRedisTemplate redisTemplate;
    SeatRepository seatRepository;
    TicketRepository ticketRepository;
    SeatHoldingRepository seatHoldingRepository;
    SeatNotificationService seatNotificationService;

    @Transactional
    public SeatHoldResponse holdSeats(
            Showtime showtime,
            List<String> seatIds,
            String userId,
            String bookingId,
            LocalDateTime expiresAt) {
        List<String> distinctSeatIds = normalizeSeatIds(seatIds);
        List<Seat> selectedSeats = getSelectedSeats(showtime, distinctSeatIds);
        Set<String> activeSeatIds = getActiveSeatIds(showtime.getId());

        if (distinctSeatIds.stream().anyMatch(activeSeatIds::contains)) {
            throw new AppException(ErrorCode.SEAT_ALREADY_BOOKED);
        }

        log.info("[Seat Hold] checking orphan seats showtimeId={}, bookingId={}, userId={}, seatIds={}",
                showtime.getId(), bookingId, userId, distinctSeatIds);
        validateOrphanSeats(showtime, selectedSeats, activeSeatIds);

        List<String> lockedSeatIds = new ArrayList<>();
        try {
            for (String seatId : distinctSeatIds) {
                String key = buildSeatHoldKey(showtime.getId(), seatId);
                Boolean locked = redisTemplate.opsForValue().setIfAbsent(key, userId, HOLD_TIME);
                if (!Boolean.TRUE.equals(locked)) {
                    throw new AppException(ErrorCode.SEAT_ALREADY_BOOKED);
                }
                lockedSeatIds.add(seatId);
            }

            List<SeatHolding> holdings = distinctSeatIds.stream()
                    .map(seatId -> SeatHolding.builder()
                            .bookingId(bookingId)
                            .showtimeId(showtime.getId())
                            .seatId(seatId)
                            .activeLockKey(buildActiveLockKey(showtime.getId(), seatId))
                            .status(SeatHoldingStatus.HOLDING)
                            .expiresAt(expiresAt)
                            .build())
                    .toList();
            seatHoldingRepository.saveAll(holdings);
        } catch (RuntimeException exception) {
            releaseSeats(showtime.getId(), lockedSeatIds, userId);
            throw exception;
        }

        log.info("[Seat Hold] created DB holdings and Redis locks showtimeId={}, bookingId={}, userId={}, seatIds={}, expiresAt={}",
                showtime.getId(), bookingId, userId, distinctSeatIds, expiresAt);
        seatNotificationService.sendSeatStatus(showtime.getId(), distinctSeatIds, "PENDING", userId, bookingId);

        return SeatHoldResponse.builder()
                .showtimeId(showtime.getId())
                .seatIds(distinctSeatIds)
                .status("PENDING")
                .remainingSeconds(Math.max(0, Duration.between(LocalDateTime.now(), expiresAt).toSeconds()))
                .expiredAt(expiresAt)
                .build();
    }

    public void releaseSeatHolds(Booking booking) {
        updateHoldingStatus(booking, SeatHoldingStatus.RELEASED);
        if (booking.getTickets() == null || booking.getTickets().isEmpty()) {
            return;
        }
        releaseSeats(getShowtimeId(booking), getSeatIds(booking), booking.getCustomer().getId());
        log.info("[Seat Hold] released seat holds bookingId={}", booking.getId());
    }

    public void expireSeatHolds(Booking booking) {
        updateHoldingStatus(booking, SeatHoldingStatus.EXPIRED);
        if (booking.getTickets() == null || booking.getTickets().isEmpty()) {
            return;
        }
        releaseSeats(getShowtimeId(booking), getSeatIds(booking), booking.getCustomer().getId());
        log.info("[Seat Hold] expired seat holds bookingId={}", booking.getId());
    }

    public void confirmSeatHolds(Booking booking) {
        updateHoldingStatus(booking, SeatHoldingStatus.CONFIRMED);
        log.info("[Seat Hold] confirmed seat holds bookingId={}", booking.getId());
    }

    public void notifyAvailable(Booking booking) {
        if (booking.getTickets() == null || booking.getTickets().isEmpty()) {
            return;
        }
        String showtimeId = getShowtimeId(booking);
        List<String> availableSeatIds = getSeatIds(booking).stream()
                .filter(seatId -> isCurrentlyAvailable(showtimeId, seatId))
                .toList();
        if (availableSeatIds.isEmpty()) {
            return;
        }
        seatNotificationService.sendSeatStatus(
                showtimeId,
                availableSeatIds,
                "AVAILABLE",
                booking.getCustomer().getId(),
                booking.getId()
        );
    }

    public void notifyAvailable(String showtimeId, List<String> seatIds, String userId) {
        List<String> availableSeatIds = seatIds.stream()
                .filter(seatId -> isCurrentlyAvailable(showtimeId, seatId))
                .toList();
        if (!availableSeatIds.isEmpty()) {
            seatNotificationService.sendSeatStatus(showtimeId, availableSeatIds, "AVAILABLE", userId, null);
        }
    }

    public void notifyBooked(Booking booking) {
        if (booking.getTickets() == null || booking.getTickets().isEmpty()) {
            return;
        }
        seatNotificationService.sendSeatStatus(
                getShowtimeId(booking),
                getSeatIds(booking),
                "BOOKED",
                booking.getCustomer().getId(),
                booking.getId()
        );
    }

    public boolean hasValidSeatHolds(Booking booking) {
        return hasValidSeatHolds(booking, false);
    }

    public boolean hasValidSeatHolds(Booking booking, boolean allowExpiredGatewayConfirmation) {
        if (booking.getTickets() == null || booking.getTickets().isEmpty()) {
            return false;
        }
        if (!allowExpiredGatewayConfirmation
                && (booking.getExpiresAt() == null || !booking.getExpiresAt().isAfter(LocalDateTime.now()))) {
            return false;
        }

        List<String> seatIds = getSeatIds(booking);
        List<SeatHolding> holdings = seatHoldingRepository.findByBookingId(booking.getId()).stream()
                .filter(holding -> SeatHoldingStatus.HOLDING == holding.getStatus())
                .toList();
        Set<String> heldSeatIds = holdings.stream()
                .map(SeatHolding::getSeatId)
                .collect(Collectors.toSet());
        if (!heldSeatIds.containsAll(seatIds)) {
            return false;
        }

        if (allowExpiredGatewayConfirmation) {
            return true;
        }

        return holdings.stream().allMatch(holding -> holding.getExpiresAt().isAfter(LocalDateTime.now()));
    }

    public long getRemainingHoldTime(Booking booking) {
        if (booking.getTickets() == null || booking.getTickets().isEmpty()) {
            return 0;
        }
        if (booking.getExpiresAt() != null) {
            return Math.max(0, Duration.between(LocalDateTime.now(), booking.getExpiresAt()).toSeconds());
        }

        String showtimeId = getShowtimeId(booking);
        return getSeatIds(booking).stream()
                .map(seatId -> redisTemplate.getExpire(buildSeatHoldKey(showtimeId, seatId)))
                .filter(ttl -> ttl != null && ttl > 0)
                .min(Long::compareTo)
                .orElse(0L);
    }

    public static List<TicketStatus> activeTicketStatuses() {
        return ACTIVE_TICKET_STATUSES;
    }

    public static Collection<SeatHoldingStatus> activeHoldingStatuses() {
        return ACTIVE_HOLDING_STATUSES;
    }

    private void updateHoldingStatus(Booking booking, SeatHoldingStatus status) {
        List<SeatHolding> holdings = seatHoldingRepository.findByBookingIdAndStatusIn(
                booking.getId(),
                List.of(SeatHoldingStatus.HOLDING));
        if (holdings.isEmpty()) {
            return;
        }
        holdings.forEach(holding -> {
            holding.setStatus(status);
            if (status == SeatHoldingStatus.RELEASED || status == SeatHoldingStatus.EXPIRED) {
                holding.setActiveLockKey(null);
            } else {
                holding.setActiveLockKey(buildActiveLockKey(holding.getShowtimeId(), holding.getSeatId()));
            }
        });
        seatHoldingRepository.saveAll(holdings);
    }

    private List<String> normalizeSeatIds(List<String> seatIds) {
        if (seatIds == null || seatIds.isEmpty()) {
            throw new AppException(ErrorCode.SEAT_LIST_NOT_EMPTY);
        }

        List<String> distinctSeatIds = seatIds.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(seatId -> !seatId.isBlank())
                .distinct()
                .toList();

        if (distinctSeatIds.size() != seatIds.size()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        return distinctSeatIds;
    }

    private List<Seat> getSelectedSeats(Showtime showtime, List<String> seatIds) {
        Map<String, Seat> seatsById = seatRepository.findAllById(seatIds).stream()
                .collect(Collectors.toMap(Seat::getId, Function.identity()));

        if (seatsById.size() != seatIds.size()) {
            throw new AppException(ErrorCode.SEAT_NOT_EXISTED);
        }

        String hallId = showtime.getHall().getId();
        return seatIds.stream()
                .map(seatsById::get)
                .peek(seat -> {
                    if (!hallId.equals(seat.getHall().getId())) {
                        throw new AppException(ErrorCode.INVALID_REQUEST);
                    }
                    if (seat.getStatus() != SeatStatus.AVAILABLE) {
                        throw new AppException(ErrorCode.SEAT_ALREADY_BOOKED);
                    }
                })
                .toList();
    }

    private Set<String> getActiveSeatIds(String showtimeId) {
        Set<String> ticketSeatIds = ticketRepository.findByShowtimeIdAndStatusIn(showtimeId, ACTIVE_TICKET_STATUSES)
                .stream()
                .map(ticket -> ticket.getSeat().getId())
                .collect(Collectors.toSet());
        Set<String> holdingSeatIds = seatHoldingRepository.findByShowtimeIdAndStatusIn(showtimeId, ACTIVE_HOLDING_STATUSES)
                .stream()
                .map(SeatHolding::getSeatId)
                .collect(Collectors.toSet());
        ticketSeatIds.addAll(holdingSeatIds);
        return ticketSeatIds;
    }

    // ==============================================================================
    // THUẬT TOÁN KIỂM TRA GHẾ LẺ (TỐI ƯU HÓA)
    // ==============================================================================
    private void validateOrphanSeats(Showtime showtime, List<Seat> selectedSeats, Set<String> activeSeatIds) {
        String showtimeId = showtime.getId();
        String hallId = showtime.getHall().getId();

        // 1. Lấy tất cả ghế trong phòng chiếu (Đã sắp xếp theo Hàng và Số)
        List<Seat> allSeats = seatRepository.findAllByHallIdOrderByRowNameAscNumberAsc(hallId);

        // 2. Danh sách ID các ghế mà user ĐANG CHỌN trong request này
        Set<String> requestedSeatIds = selectedSeats.stream().map(Seat::getId).collect(Collectors.toSet());

        // 3. Gom nhóm toàn bộ ghế theo Hàng (Row)
        Map<String, List<Seat>> seatsByRow = allSeats.stream()
                .collect(Collectors.groupingBy(Seat::getRowName, LinkedHashMap::new, Collectors.toList()));

        // 4. Duyệt qua từng hàng để kiểm tra
        for (Map.Entry<String, List<Seat>> entry : seatsByRow.entrySet()) {
            List<Seat> rowSeats = entry.getValue();

            // Lấy danh sách số thứ tự (number) của các ghế ĐANG CHỌN trong hàng này
            Set<Integer> requestedNumbers = rowSeats.stream()
                    .filter(seat -> requestedSeatIds.contains(seat.getId()))
                    .map(Seat::getNumber)
                    .collect(Collectors.toSet());

            // Nếu user không chọn ghế nào ở hàng này thì bỏ qua (Không cần kiểm tra)
            if (requestedNumbers.isEmpty()) {
                continue;
            }

            // 5. Tìm các ghế "CÒN TRỐNG" (Không hỏng, chưa bán, chưa ai giữ, không nằm trong request)
            List<Integer> availableCols = new ArrayList<>();
            for (Seat seat : rowSeats) {
                boolean isSoldOrBroken = seat.getStatus() != SeatStatus.AVAILABLE;
                boolean isHeldInDB = activeSeatIds.contains(seat.getId());
                boolean isRequested = requestedSeatIds.contains(seat.getId());

                // Chỉ gọi Redis nếu ghế chưa bị khóa ở DB để tối ưu hiệu năng
                boolean isHeldInRedis = false;
                if (!isSoldOrBroken && !isHeldInDB && !isRequested) {
                    isHeldInRedis = Boolean.TRUE.equals(redisTemplate.hasKey(buildSeatHoldKey(showtimeId, seat.getId())));
                }

                if (!isSoldOrBroken && !isHeldInDB && !isRequested && !isHeldInRedis) {
                    availableCols.add(seat.getNumber());
                }
            }

            // 6. Thuật toán tìm các "Ghế Lẻ" (Orphan Seats) - Là các khoảng trống bị cô lập chỉ có 1 ghế
            List<Integer> orphanSeats = new ArrayList<>();
            int streak = 0;

            for (int i = 0; i < availableCols.size(); i++) {
                int currentCol = availableCols.get(i);
                int prevCol = (i > 0) ? availableCols.get(i - 1) : -1;

                // Nếu là ghế đầu tiên hoặc số ghế liên tiếp nhau -> Tăng chuỗi
                if (i == 0 || currentCol == prevCol + 1) {
                    streak++;
                } else {
                    // Nếu bị đứt đoạn, kiểm tra chuỗi trước đó có phải độ dài = 1 không?
                    if (streak == 1) {
                        orphanSeats.add(availableCols.get(i - 1));
                    }
                    streak = 1; // Reset chuỗi cho đoạn mới
                }
            }
            // Kiểm tra đoạn chuỗi cuối cùng
            if (streak == 1 && !availableCols.isEmpty()) {
                orphanSeats.add(availableCols.get(availableCols.size() - 1));
            }

            // 7. KIỂM TRA CHỐT HẠ: User có phải là người "TẠO RA" ghế lẻ này không?
            // Nếu ghế lẻ nằm ngay sát (trái hoặc phải) ghế user vừa chọn -> Reject!
            for (int orphanCol : orphanSeats) {
                if (requestedNumbers.contains(orphanCol - 1) || requestedNumbers.contains(orphanCol + 1)) {
                    log.warn("[Seat Hold] Hacker/User chặn do để trống ghế lẻ {} ở hàng {}", orphanCol, entry.getKey());

                    // Ném lỗi 1088 mà bạn đã khai báo trong ErrorCode.java ở Front-end
                    throw new AppException(ErrorCode.ORPHAN_SEAT_NOT_ALLOWED);
                }
            }
        }
    }

    private boolean isCurrentlyAvailable(String showtimeId, String seatId) {
        if (Boolean.TRUE.equals(redisTemplate.hasKey(buildSeatHoldKey(showtimeId, seatId)))) {
            return false;
        }
        if (seatHoldingRepository.existsByShowtimeIdAndSeatIdAndStatusIn(
                showtimeId,
                seatId,
                ACTIVE_HOLDING_STATUSES)) {
            return false;
        }
        return !ticketRepository.existsByShowtimeIdAndSeatIdAndStatusIn(showtimeId, seatId, ACTIVE_TICKET_STATUSES);
    }

    public void releaseSeats(String showtimeId, List<String> seatIds, String userId) {
        for (String seatId : seatIds) {
            redisTemplate.execute(RELEASE_SCRIPT, List.of(buildSeatHoldKey(showtimeId, seatId)), userId);
        }
    }

    private String buildSeatHoldKey(String showtimeId, String seatId) {
        return showtimeId + ":" + seatId;
    }

    private String buildActiveLockKey(String showtimeId, String seatId) {
        return showtimeId + ":" + seatId;
    }

    private String getShowtimeId(Booking booking) {
        return booking.getTickets().get(0).getShowtime().getId();
    }

    private List<String> getSeatIds(Booking booking) {
        return booking.getTickets().stream()
                .map(ticket -> ticket.getSeat().getId())
                .toList();
    }

    // ==============================================================================
    // LẤY TRẠNG THÁI GHẾ HIỆN TẠI CỦA SUẤT CHIẾU (Dành cho lúc Frontend vừa load trang)
    // ==============================================================================
    public Map<String, String> getSeatStatusByShowtime(String showtimeId) {
        Map<String, String> seatStatusMap = new java.util.HashMap<>();
        LocalDateTime now = LocalDateTime.now(); // Lấy thời gian hiện tại

        // 1. Lấy các ghế ĐÃ BÁN (Giữ nguyên)
        List<com.devteria.cinemaback_end.booking.entity.Ticket> tickets = ticketRepository.findByShowtimeIdAndStatusIn(showtimeId, ACTIVE_TICKET_STATUSES);
        for (com.devteria.cinemaback_end.booking.entity.Ticket ticket : tickets) {
            seatStatusMap.put(ticket.getSeat().getId(), "BOOKED");
        }

        // 2. Lấy các ghế ĐANG GIỮ
        List<SeatHolding> holdings = seatHoldingRepository.findByShowtimeIdAndStatusIn(showtimeId, ACTIVE_HOLDING_STATUSES);
        for (SeatHolding holding : holdings) {
            // 🔥 ĐÃ SỬA: Chỉ đưa vào danh sách PENDING nếu thời gian hết hạn vẫn còn lớn hơn hiện tại
            if (holding.getExpiresAt() != null && holding.getExpiresAt().isAfter(now)) {
                seatStatusMap.putIfAbsent(holding.getSeatId(), "PENDING");
            }
        }

        return seatStatusMap;
    }

    // ==============================================================================
    // HỦY GIỮ GHẾ NGAY LẬP TỨC (Khi user đóng Tab hoặc bấm Quay lại)
    // ==============================================================================
    @Transactional
    public void removeTemporaryHold(String showtimeId, List<String> seatIds, String userId) {
        if (seatIds == null || seatIds.isEmpty()) return;

        // 1. Xóa Lock trong Redis
        releaseSeats(showtimeId, seatIds, userId);

        // 2. Chuyển trạng thái trong DB về RELEASED
        List<SeatHolding> holdings = seatHoldingRepository.findByShowtimeIdAndStatusIn(showtimeId, List.of(SeatHoldingStatus.HOLDING))
                .stream()
                .filter(h -> seatIds.contains(h.getSeatId()))
                .toList();

        if (!holdings.isEmpty()) {
            holdings.forEach(h -> {
                h.setStatus(SeatHoldingStatus.RELEASED);
                h.setActiveLockKey(null);
            });
            seatHoldingRepository.saveAll(holdings);
        }

        // 3. Bắn tín hiệu WebSocket nhả ghế màu trắng cho tất cả mọi người
        seatNotificationService.sendSeatStatus(showtimeId, seatIds, "AVAILABLE", "SYSTEM", null);
        log.info("[Seat Hold] User {} đã hủy giữ ghế thủ công: {}", userId, seatIds);
    }
    // ==============================================================================
    // CHUYỂN GHẾ TẠM THỜI SANG HÓA ĐƠN CHÍNH THỨC
    // ==============================================================================
    @Transactional
    public void assignHoldsToBooking(String showtimeId, List<String> seatIds, String userId, String realBookingId) {
        List<String> distinctSeatIds = normalizeSeatIds(seatIds);

        // 1. Kiểm tra Redis xem User này có đang thực sự là người giữ ghế không
        for (String seatId : distinctSeatIds) {
            String lockedByUserId = redisTemplate.opsForValue().get(buildSeatHoldKey(showtimeId, seatId));
            if (!userId.equals(lockedByUserId)) {
                // Nếu Redis rỗng (đã hết hạn) hoặc là của ID khác -> Báo lỗi
                throw new AppException(ErrorCode.SEAT_ALREADY_BOOKED);
            }
        }

        // 2. Tìm các SeatHolding tạm thời và cập nhật thành mã Booking thật
        List<SeatHolding> holdings = seatHoldingRepository.findByShowtimeIdAndStatusIn(showtimeId, List.of(SeatHoldingStatus.HOLDING))
                .stream()
                .filter(h -> distinctSeatIds.contains(h.getSeatId()))
                .toList();

        if (holdings.size() != distinctSeatIds.size()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        // Cập nhật mã Booking
        holdings.forEach(h -> h.setBookingId(realBookingId));
        seatHoldingRepository.saveAll(holdings);
    }
}

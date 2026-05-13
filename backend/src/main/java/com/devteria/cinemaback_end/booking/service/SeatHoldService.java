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

    public static final Duration HOLD_TIME = Duration.ofMinutes(15);

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

    private void validateOrphanSeats(Showtime showtime, List<Seat> selectedSeats, Set<String> activeSeatIds) {
        String showtimeId = showtime.getId();
        String hallId = showtime.getHall().getId();
        Map<String, Set<Integer>> selectedNumbersByRow = selectedSeats.stream()
                .collect(Collectors.groupingBy(
                        Seat::getRowName,
                        Collectors.mapping(Seat::getNumber, Collectors.toSet())
                ));

        Map<String, List<Seat>> seatsByRow = seatRepository.findAllByHallIdOrderByRowNameAscNumberAsc(hallId).stream()
                .collect(Collectors.groupingBy(Seat::getRowName, LinkedHashMap::new, Collectors.toList()));

        for (Map.Entry<String, Set<Integer>> entry : selectedNumbersByRow.entrySet()) {
            List<Seat> rowSeats = seatsByRow.getOrDefault(entry.getKey(), List.of()).stream()
                    .sorted(Comparator.comparing(Seat::getNumber))
                    .toList();
            Set<Integer> selectedNumbers = entry.getValue();

            for (int i = 0; i < rowSeats.size(); ) {
                if (!isAvailableAfterSelection(showtimeId, rowSeats.get(i), selectedNumbers, activeSeatIds)) {
                    i++;
                    continue;
                }

                int start = i;
                while (i < rowSeats.size()
                        && isAvailableAfterSelection(showtimeId, rowSeats.get(i), selectedNumbers, activeSeatIds)) {
                    i++;
                }
                int end = i - 1;

                if (start == end && isSingleSeatNextToSelection(rowSeats, start, selectedNumbers)) {
                    log.warn("[Seat Hold] orphan seat rejected showtimeId={}, row={}, seatNumber={}",
                            showtimeId, entry.getKey(), rowSeats.get(start).getNumber());
                    throw new AppException(ErrorCode.ORPHAN_SEAT_NOT_ALLOWED);
                }
            }
        }
    }

    private boolean isAvailableAfterSelection(
            String showtimeId,
            Seat seat,
            Set<Integer> selectedNumbers,
            Set<String> activeSeatIds) {
        if (selectedNumbers.contains(seat.getNumber())) {
            return false;
        }
        if (seat.getStatus() != SeatStatus.AVAILABLE) {
            return false;
        }
        if (activeSeatIds.contains(seat.getId())) {
            return false;
        }
        return !Boolean.TRUE.equals(redisTemplate.hasKey(buildSeatHoldKey(showtimeId, seat.getId())));
    }

    private boolean isSingleSeatNextToSelection(List<Seat> rowSeats, int index, Set<Integer> selectedNumbers) {
        boolean leftSelected = index > 0 && selectedNumbers.contains(rowSeats.get(index - 1).getNumber());
        boolean rightSelected = index < rowSeats.size() - 1 && selectedNumbers.contains(rowSeats.get(index + 1).getNumber());
        return leftSelected || rightSelected;
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
}

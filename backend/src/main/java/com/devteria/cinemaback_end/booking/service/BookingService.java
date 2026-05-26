package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.dto.BookingRequest;
import com.devteria.cinemaback_end.booking.dto.BookingResponse;
import com.devteria.cinemaback_end.booking.entity.Booking;
import com.devteria.cinemaback_end.promotion.entity.UserVoucher;
import com.devteria.cinemaback_end.promotion.repository.UserVoucherRepository;
import com.devteria.cinemaback_end.user.entity.enums.MemberTier;
import com.devteria.cinemaback_end.booking.entity.Payment;
import com.devteria.cinemaback_end.booking.entity.Ticket;
import com.devteria.cinemaback_end.booking.entity.enums.BookingStatus;
import com.devteria.cinemaback_end.booking.entity.enums.PaymentStatus;
import com.devteria.cinemaback_end.booking.entity.enums.TicketStatus;
import com.devteria.cinemaback_end.booking.mapper.BookingMapper;
import com.devteria.cinemaback_end.booking.repository.BookingRepository;
import com.devteria.cinemaback_end.booking.repository.PaymentRepository;
import com.devteria.cinemaback_end.booking.repository.TicketRepository;
import com.devteria.cinemaback_end.cinema.entity.Seat;
import com.devteria.cinemaback_end.cinema.repository.SeatRepository;
import com.devteria.cinemaback_end.concession.entity.BookingConcession;
import com.devteria.cinemaback_end.concession.entity.ConcessionItem;
import com.devteria.cinemaback_end.concession.repository.ConcessionItemRepository;
import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.movie.entity.Showtime;
import com.devteria.cinemaback_end.movie.repository.ShowtimeRepository;
import com.devteria.cinemaback_end.promotion.entity.Promotion;
import com.devteria.cinemaback_end.promotion.repository.PromotionRepository;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class BookingService {

    private static final Duration PAYMENT_SAFE_WINDOW = SeatHoldService.HOLD_TIME.plusMinutes(5);

    BookingRepository bookingRepository;
    PaymentRepository paymentRepository;
    TicketRepository ticketRepository;
    ShowtimeRepository showtimeRepository;
    SeatRepository seatRepository;
    ConcessionItemRepository concessionRepository;
    UserRepository userRepository;
    PromotionRepository promotionRepository;
    BookingMapper bookingMapper;
    BookingRedisService bookingRedisService;
    SeatHoldService seatHoldService;
    OutboxEventService outboxEventService;
    UserVoucherRepository userVoucherRepository;

    @Transactional
    public BookingResponse createBooking(BookingRequest request) {
        User customer = getCurrentUser();
        Showtime showtime = showtimeRepository.findByIdForUpdate(request.getShowtimeId())
                .orElseThrow(() -> new AppException(ErrorCode.SHOWTIME_NOT_EXISTED));
        LocalDateTime expiresAt = LocalDateTime.now().plus(SeatHoldService.HOLD_TIME);

        Booking booking = Booking.builder()
                .bookingCode("BKG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .customer(customer)
                .status(BookingStatus.PENDING)
                .expiresAt(expiresAt)
                .ticketTotal(0.0)
                .concessionTotal(0.0)
                .discountAmount(0.0)
                .memberDiscountAmount(0.0) // 🔥 KHỞI TẠO TIỀN GIẢM HẠNG BẰNG 0
                .totalAmount(0.0)
                .tickets(new ArrayList<>())
                .concessions(new ArrayList<>())
                .build();
        Booking savedBooking = bookingRepository.save(booking);

        try {
            seatHoldService.assignHoldsToBooking(showtime.getId(), request.getSeatIds(), customer.getId(), savedBooking.getId());

            double ticketTotal = buildTickets(request, showtime, savedBooking);
            double concessionTotal = buildConcessions(request, savedBooking);

            // 1. Giảm giá từ mã khuyến mãi (Voucher)
            double promoDiscount = applyPromotion(
                    request,
                    savedBooking,
                    ticketTotal + concessionTotal,
                    ticketTotal,
                    concessionTotal);

            // 2. 🔥 TÍNH TIỀN GIẢM TỪ ĐẶC QUYỀN HẠNG THÀNH VIÊN
            double memberDiscountPercent = switch (customer.getMemberTier()) {
                case SILVER -> 0.05; // 5%
                case GOLD -> 0.10;   // 10%
                case PLATINUM -> 0.15; // 15%
                default -> 0.0;      // BASIC 0%
            };
            // Áp dụng giảm giá hạng thành viên trên tổng bill (Vé + Bắp nước)
            double memberDiscountAmount = (ticketTotal + concessionTotal) * memberDiscountPercent;

            savedBooking.setTicketTotal(ticketTotal);
            savedBooking.setConcessionTotal(concessionTotal);
            savedBooking.setDiscountAmount(promoDiscount); // Lưu tiền Voucher
            savedBooking.setMemberDiscountAmount(memberDiscountAmount); // 🔥 LƯU TIỀN GIẢM HẠNG

            // 🔥 TỔNG TIỀN CUỐI CÙNG = TỔNG - GIẢM VOUCHER - GIẢM HẠNG
            savedBooking.setTotalAmount(ticketTotal + concessionTotal - promoDiscount - memberDiscountAmount);

            Booking persistedBooking = bookingRepository.save(savedBooking);
            bookingRedisService.setBookingHold(persistedBooking.getId(), expiresAt);
            log.info("[Booking] created PENDING bookingId={}, bookingCode={}, expiresAt={}, seatIds={}",
                    persistedBooking.getId(), persistedBooking.getBookingCode(), expiresAt, request.getSeatIds());
            return bookingMapper.toBookingResponse(persistedBooking);
        } catch (Exception exception) {
            log.error("[Booking] create booking failed, releasing Redis seat locks bookingId={}",
                    savedBooking.getId(), exception);
            try {
                seatHoldService.releaseSeats(showtime.getId(), request.getSeatIds(), customer.getId());
                seatHoldService.notifyAvailable(showtime.getId(), request.getSeatIds(), customer.getId());
            } catch (Exception releaseException) {
                log.error("[Booking] cannot release seat locks after create failure bookingId={}",
                        savedBooking.getId(), releaseException);
            }
            if (exception instanceof AppException appException) {
                throw appException;
            }
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Transactional
    public BookingResponse confirmPayment(String bookingId) {
        return confirmPaymentInternal(bookingId, false);
    }

    @Transactional
    public BookingResponse confirmPaymentFromGateway(String bookingId) {
        return confirmPaymentInternal(bookingId, true);
    }

    @Transactional
    public boolean tryConfirmPaymentFromGateway(String bookingId) {
        try {
            confirmPaymentInternal(bookingId, true);
            return true;
        } catch (AppException exception) {
            log.error("[Booking] gateway payment confirmed but booking cannot be marked PAID bookingId={}, reason={}",
                    bookingId, exception.getErrorCode().name());
            return false;
        }
    }

    private BookingResponse confirmPaymentInternal(String bookingId, boolean allowExpiredGatewayConfirmation) {
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_EXISTED));

        if (booking.getStatus() == BookingStatus.PAID) {
            return bookingMapper.toBookingResponse(booking);
        }
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        if (!seatHoldService.hasValidSeatHolds(booking, allowExpiredGatewayConfirmation)) {
            throw new AppException(ErrorCode.SEAT_HOLD_EXPIRED);
        }

        booking.setStatus(BookingStatus.PAID);

        // 🔥 BỔ SUNG TỪ BƯỚC TRƯỚC: Chốt ghế thành CONFIRMED và bắn tín hiệu WebSocket đổi màu xám
        seatHoldService.confirmSeatHolds(booking);
        seatHoldService.notifyBooked(booking);

        // 🔥 BỔ SUNG MỚI: Chỉ khi thanh toán thành công mới chốt cộng lượt sử dụng Khuyến Mãi
        if (booking.getPromotion() != null) {
            Promotion promo = booking.getPromotion();

            promo.setUsedCount(promo.getUsedCount() + 1);
            promotionRepository.save(promo);

            UserVoucher userVoucher = userVoucherRepository
                    .findByUserAndPromotion(booking.getCustomer(), promo)
                    .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_OWNED));

            userVoucher.setUsed(true);
            userVoucherRepository.save(userVoucher);
        }

        User customer = booking.getCustomer();
        double amountPaid = booking.getTotalAmount();

        // 1. Cộng tổng chi tiêu
        double currentSpending = customer.getTotalSpending() != null ? customer.getTotalSpending() : 0.0;
        double newSpending = currentSpending + amountPaid;
        customer.setTotalSpending(newSpending);

        // 2. 🔥 XÉT THĂNG HẠNG TỰ ĐỘNG DỰA TRÊN TỔNG CHI TIÊU MỚI
        if (newSpending >= 5000000) {
            customer.setMemberTier(MemberTier.PLATINUM);
        } else if (newSpending >= 3000000) {
            customer.setMemberTier(MemberTier.GOLD);
        } else if (newSpending >= 1500000) {
            customer.setMemberTier(MemberTier.SILVER);
        } else {
            customer.setMemberTier(MemberTier.BASIC);
        }

        // 3. Cộng điểm thưởng (10.000 VNĐ = 1 điểm)
        int earnedPoints = (int) (amountPaid / 10000);
        int currentPoints = customer.getTotalRewardPoints() != null ? customer.getTotalRewardPoints() : 0;
        customer.setTotalRewardPoints(currentPoints + earnedPoints);

        userRepository.save(customer);
        // ======================================================================

        Booking savedBooking = bookingRepository.save(booking);
        outboxEventService.enqueueBookingPaid(savedBooking);

        registerPaymentSuccessAfterCommit(savedBooking);
        log.info("[Booking] updated PAID and created outbox BOOKING_PAID bookingId={}, bookingCode={}",
                savedBooking.getId(), savedBooking.getBookingCode());

        return bookingMapper.toBookingResponse(savedBooking);
    }

    private void registerPaymentSuccessAfterCommit(Booking booking) {
        String bookingId = booking.getId();
        String userId = booking.getCustomer().getId();
        String showtimeId = booking.getTickets().get(0).getShowtime().getId();
        List<String> seatIds = booking.getTickets().stream()
                .map(ticket -> ticket.getSeat().getId())
                .toList();

        Runnable afterCommit = () -> {
            bookingRedisService.clearBookingHold(bookingId);
            seatHoldService.releaseSeats(showtimeId, seatIds, userId);
            log.info("[Booking] cleared Redis locks after payment success bookingId={}", bookingId);
        };

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    afterCommit.run();
                }
            });
            return;
        }

        afterCommit.run();
    }

    @Transactional
    public void cancelBooking(String bookingId) {
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_EXISTED));

        if (booking.getStatus() == BookingStatus.PAID) {
            log.info("[Booking] skip cancelling PAID booking bookingId={}", bookingId);
            return;
        }
        if (booking.getStatus() == BookingStatus.PENDING || booking.getStatus() == BookingStatus.FAILED) {
            closeBooking(booking, BookingStatus.CANCELLED);
        }
    }

    @Transactional
    public boolean expireBookingIfDue(String bookingId) {
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_EXISTED));
        if (booking.getStatus() == BookingStatus.PAID) {
            return false;
        }
        if (booking.getStatus() != BookingStatus.PENDING) {
            return false;
        }
        if (booking.getExpiresAt() != null && booking.getExpiresAt().isAfter(LocalDateTime.now())) {
            return false;
        }
        if (hasPendingPaymentInsideSafeWindow(booking)) {
            log.info("[Booking] defer expiration because payment is still inside safe reconciliation window bookingId={}",
                    booking.getId());
            return false;
        }

        closeBooking(booking, BookingStatus.EXPIRED);
        return true;
    }

    private boolean hasPendingPaymentInsideSafeWindow(Booking booking) {
        Payment payment = paymentRepository.findByBookingId(booking.getId()).orElse(null);
        if (payment == null) {
            return false;
        }
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return true;
        }
        return payment.getStatus() == PaymentStatus.PENDING
                && payment.getPaymentDate() != null
                && payment.getPaymentDate().plus(PAYMENT_SAFE_WINDOW).isAfter(LocalDateTime.now());
    }

    private void closeBooking(Booking booking, BookingStatus closedStatus) {
        booking.setStatus(closedStatus);
        booking.getTickets().forEach(ticket -> {
            ticket.setStatus(TicketStatus.CANCELLED);
            ticket.setActiveLockKey(null);
        });
        bookingRepository.save(booking);
        bookingRedisService.clearBookingHold(booking.getId());
        if (closedStatus == BookingStatus.EXPIRED) {
            seatHoldService.expireSeatHolds(booking);
        } else {
            seatHoldService.releaseSeatHolds(booking);
        }
        seatHoldService.notifyAvailable(booking);
        log.info("[Booking] updated {} bookingId={}, bookingCode={}",
                closedStatus, booking.getId(), booking.getBookingCode());
    }

    public List<BookingResponse> getMyHistory() {
        User user = getCurrentUser();
        return bookingRepository.findAllByCustomerIdOrderByBookingDateDesc(user.getId())
                .stream().map(bookingMapper::toBookingResponse).toList();
    }

    public long getRemainingHoldTime(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_EXISTED));
        return seatHoldService.getRemainingHoldTime(booking);
    }

    private double buildTickets(BookingRequest request, Showtime showtime, Booking booking) {
        double ticketTotal = 0.0;

        for (String seatId : request.getSeatIds()) {
            if (ticketRepository.existsByShowtimeIdAndSeatIdAndStatusIn(
                    showtime.getId(), seatId, SeatHoldService.activeTicketStatuses())) {
                throw new AppException(ErrorCode.SEAT_ALREADY_BOOKED);
            }

            Seat seat = seatRepository.findById(seatId)
                    .orElseThrow(() -> new AppException(ErrorCode.SEAT_NOT_EXISTED));

            double seatPrice = showtime.getBasePrice().doubleValue();

            if (seat.getType() != null) {
                switch (seat.getType()) {
                    case VIP -> seatPrice += 10000;
                    case SWEETBOX -> seatPrice += 20000;
                    default -> {
                    }
                }
            }

            ticketTotal += seatPrice;

            Ticket ticket = Ticket.builder()
                    .booking(booking)
                    .showtime(showtime)
                    .seat(seat)
                    .price(seatPrice)
                    .activeLockKey(buildActiveLockKey(showtime.getId(), seatId))
                    .status(TicketStatus.PENDING)
                    .build();
            booking.getTickets().add(ticket);
        }

        return ticketTotal;
    }

    private double buildConcessions(BookingRequest request, Booking booking) {
        double concessionTotal = 0.0;
        if (request.getConcessions() == null) {
            return concessionTotal;
        }

        for (var choice : request.getConcessions()) {
            ConcessionItem item = concessionRepository.findById(choice.getConcessionItemId())
                    .orElseThrow(() -> new AppException(ErrorCode.CONCESSION_NOT_EXISTED));

            double itemPrice = item.getPrice().doubleValue();
            double subTotal = itemPrice * choice.getQuantity();
            concessionTotal += subTotal;

            BookingConcession bookingConcession = BookingConcession.builder()
                    .booking(booking)
                    .item(item)
                    .quantity(choice.getQuantity())
                    .price(itemPrice)
                    .build();
            booking.getConcessions().add(bookingConcession);
        }

        return concessionTotal;
    }

    private double applyPromotion(
            BookingRequest request,
            Booking booking,
            double subTotal,
            double ticketTotal,
            double concessionTotal) {
        if (request.getPromoCode() == null || request.getPromoCode().isBlank()) {
            return 0.0;
        }

        Promotion promo = promotionRepository.findByDiscountCode(request.getPromoCode())
                .orElseThrow(() -> new AppException(ErrorCode.PROMO_NOT_EXISTED));

        User customer = booking.getCustomer();

        UserVoucher userVoucher = userVoucherRepository
                .findByUserAndPromotion(customer, promo)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_OWNED));

        if (userVoucher.isUsed()) {
            throw new AppException(ErrorCode.VOUCHER_ALREADY_USED);
        }
        userVoucher.setUsed(true);

        validatePromotion(promo, subTotal);

        double promoPercent = promo.getDiscountPercent().doubleValue();
        double discountAmount = switch (promo.getTarget()) {
            case TICKET -> (ticketTotal * promoPercent) / 100;
            case CONCESSION -> (concessionTotal * promoPercent) / 100;
            case ALL -> ((ticketTotal + concessionTotal) * promoPercent) / 100;
        };

        double maxDiscount = promo.getMaxDiscountAmount().doubleValue();
        if (maxDiscount > 0 && discountAmount > maxDiscount) {
            discountAmount = maxDiscount;
        }

        booking.setPromotion(promo);

        // 🔥 ĐÃ XÓA DÒNG `promo.setUsedCount(...)` Ở ĐÂY
        // Lý do: Không trừ số lượng khi khách mới chỉ tạo đơn nháp (PENDING) để tránh mất oan mã

        return discountAmount;
    }

    private void validatePromotion(Promotion promo, double subTotal) {
        if (!promo.isActive() || LocalDateTime.now().isBefore(promo.getValidFrom())
                || LocalDateTime.now().isAfter(promo.getValidUntil())) {
            throw new AppException(ErrorCode.PROMO_EXPIRED);
        }
        if (promo.getUsageLimit() > 0 && promo.getUsedCount() >= promo.getUsageLimit()) {
            throw new AppException(ErrorCode.PROMO_OUT_OF_USAGE);
        }
        if (subTotal < promo.getMinPurchaseAmount()) {
            throw new AppException(ErrorCode.PROMO_MIN_PURCHASE_NOT_MET);
        }
    }

    private User getCurrentUser() {
        var context = SecurityContextHolder.getContext();
        String email = context.getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private String buildActiveLockKey(String showtimeId, String seatId) {
        return showtimeId + ":" + seatId;
    }
}

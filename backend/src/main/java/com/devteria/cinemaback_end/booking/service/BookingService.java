package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.dto.BookingRequest;
import com.devteria.cinemaback_end.booking.dto.BookingResponse;
import com.devteria.cinemaback_end.booking.entity.Booking;
import com.devteria.cinemaback_end.booking.entity.Ticket;
import com.devteria.cinemaback_end.booking.entity.enums.BookingStatus;
import com.devteria.cinemaback_end.booking.entity.enums.TicketStatus;
import com.devteria.cinemaback_end.booking.mapper.BookingMapper;
import com.devteria.cinemaback_end.booking.repository.BookingRepository;
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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookingService {

    BookingRepository bookingRepository;
    TicketRepository ticketRepository;
    ShowtimeRepository showtimeRepository;
    SeatRepository seatRepository;
    ConcessionItemRepository concessionRepository;
    UserRepository userRepository;
    PromotionRepository promotionRepository;
    BookingMapper bookingMapper;
    BookingRedisService bookingRedisService;

    @Transactional
    public BookingResponse createBooking(BookingRequest request) {
        User customer = getCurrentUser();
        Showtime showtime = showtimeRepository.findById(request.getShowtimeId())
                .orElseThrow(() -> new AppException(ErrorCode.SHOWTIME_NOT_EXISTED));

        // 1. Khởi tạo Booking
        Booking booking = Booking.builder()
                .bookingCode("BKG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .customer(customer)
                .status(BookingStatus.PENDING) // Hóa đơn đang chờ thanh toán
                .tickets(new ArrayList<>())
                .concessions(new ArrayList<>())
                .build();

        // 2. Xử lý Vé (Tickets) và tính TicketTotal
        double ticketTotal = 0.0;
        List<TicketStatus> activeStatuses = Arrays.asList(TicketStatus.VALID, TicketStatus.SCANNED);

        for (String seatId : request.getSeatIds()) {
            // Kiểm tra ghế đã bị đặt chưa (Bỏ qua những vé đã CANCELLED để có thể mua lại)
            if (ticketRepository.existsByShowtimeIdAndSeatIdAndStatusIn(showtime.getId(), seatId, activeStatuses)) {
                throw new AppException(ErrorCode.SEAT_ALREADY_BOOKED);
            }

            Seat seat = seatRepository.findById(seatId)
                    .orElseThrow(() -> new AppException(ErrorCode.SEAT_NOT_EXISTED));

            double seatPrice = showtime.getBasePrice().doubleValue();
            ticketTotal += seatPrice;

            Ticket ticket = Ticket.builder()
                    .booking(booking)
                    .showtime(showtime)
                    .seat(seat)
                    .price(seatPrice)
                    .status(TicketStatus.VALID)
                    .build();
            booking.getTickets().add(ticket);
        }

        // 3. Xử lý Bắp nước (Concessions) và tính ConcessionTotal
        double concessionTotal = 0.0;
        if (request.getConcessions() != null) {
            for (var choice : request.getConcessions()) {
                ConcessionItem item = concessionRepository.findById(choice.getConcessionItemId())
                        .orElseThrow(() -> new AppException(ErrorCode.CONCESSION_NOT_EXISTED));

                double itemPrice = item.getPrice().doubleValue();
                double subTotal = itemPrice * choice.getQuantity();
                concessionTotal += subTotal;

                BookingConcession bc = BookingConcession.builder()
                        .booking(booking)
                        .item(item)
                        .quantity(choice.getQuantity())
                        .price(itemPrice)
                        .build();
                booking.getConcessions().add(bc);
            }
        }

        // 4. Áp dụng Khuyến mãi (Promotion)
        double discountAmount = 0.0;
        if (request.getPromoCode() != null && !request.getPromoCode().isBlank()) {
            Promotion promo = promotionRepository.findByDiscountCode(request.getPromoCode())
                    .orElseThrow(() -> new AppException(ErrorCode.PROMO_NOT_EXISTED));

            // Kiểm tra điều kiện Promo
            validatePromotion(promo, ticketTotal + concessionTotal);

            double promoPercent = promo.getDiscountPercent().doubleValue();

            // Logic tính giảm giá theo Target
            switch (promo.getTarget()) {
                case TICKET -> discountAmount = (ticketTotal * promoPercent) / 100;
                case CONCESSION -> discountAmount = (concessionTotal * promoPercent) / 100;
                case ALL -> discountAmount = ((ticketTotal + concessionTotal) * promoPercent) / 100;
            }

            // Giới hạn mức giảm tối đa
            double maxDiscount = promo.getMaxDiscountAmount().doubleValue();
            if (maxDiscount > 0 && discountAmount > maxDiscount) {
                discountAmount = maxDiscount;
            }

            booking.setPromotion(promo);
            promo.setUsedCount(promo.getUsedCount() + 1);
        }

        // 5. Cập nhật các con số cuối cùng
        booking.setTicketTotal(ticketTotal);
        booking.setConcessionTotal(concessionTotal);
        booking.setDiscountAmount(discountAmount);
        booking.setTotalAmount(ticketTotal + concessionTotal - discountAmount);

        // 6. Lưu xuống Database và Kích hoạt Redis (QUAN TRỌNG)
        Booking savedBooking = bookingRepository.save(booking);

        // 🔥 Bắt đầu đếm ngược 10 phút trên Redis cho hóa đơn này
        bookingRedisService.setBookingHold(savedBooking.getId());

        return bookingMapper.toBookingResponse(savedBooking);
    }

    // API Mô phỏng Thanh toán thành công (Sau này ghép VNPay/MoMo vào đây)
    @Transactional
    public BookingResponse confirmPayment(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_EXISTED));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new AppException(ErrorCode.INVALID_REQUEST); // Không thể thanh toán hóa đơn đã hủy/đã thanh toán
        }

        // 1. Cập nhật DB
        booking.setStatus(BookingStatus.PAID);
        Booking savedBooking = bookingRepository.save(booking);

        // 2. Dọn dẹp Redis
        bookingRedisService.clearBookingHold(bookingId);

        return bookingMapper.toBookingResponse(savedBooking);
    }

    // Hàm Hủy hóa đơn (Do người dùng tự bấm nút Hủy hoặc do hết hạn)
    @Transactional
    public void cancelBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_EXISTED));

        if (booking.getStatus() == BookingStatus.PENDING || booking.getStatus() == BookingStatus.FAILED) {
            booking.setStatus(BookingStatus.CANCELLED);

            // Giải phóng toàn bộ vé để ghế trống trở lại
            booking.getTickets().forEach(ticket -> ticket.setStatus(TicketStatus.CANCELLED));

            bookingRepository.save(booking);
            bookingRedisService.clearBookingHold(bookingId);
        }
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

    public List<BookingResponse> getMyHistory() {
        User user = getCurrentUser();
        return bookingRepository.findAllByCustomerIdOrderByBookingDateDesc(user.getId())
                .stream().map(bookingMapper::toBookingResponse).toList();
    }
}
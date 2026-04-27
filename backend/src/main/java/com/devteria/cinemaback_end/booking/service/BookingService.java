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

    @Transactional
    public BookingResponse createBooking(BookingRequest request) {
        User customer = getCurrentUser();
        Showtime showtime = showtimeRepository.findById(request.getShowtimeId())
                .orElseThrow(() -> new AppException(ErrorCode.SHOWTIME_NOT_EXISTED));

        // 1. Khởi tạo Booking
        Booking booking = Booking.builder()
                .bookingCode("BKG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .customer(customer)
                .status(BookingStatus.PAID) // Giả định thanh toán thành công luôn
                .tickets(new ArrayList<>())
                .concessions(new ArrayList<>())
                .build();

        // 2. Xử lý Vé (Tickets) và tính TicketTotal
        double ticketTotal = 0.0;
        for (String seatId : request.getSeatIds()) {
            // Kiểm tra ghế đã bị đặt chưa (Double Booking check)
            if (ticketRepository.existsByShowtimeIdAndSeatId(showtime.getId(), seatId)) {
                throw new AppException(ErrorCode.SEAT_ALREADY_BOOKED);
            }

            Seat seat = seatRepository.findById(seatId)
                    .orElseThrow(() -> new AppException(ErrorCode.SEAT_NOT_EXISTED));

            // 🔥 SỬA LỖI Ở ĐÂY: Dùng .doubleValue() để ép kiểu an toàn
            double seatPrice = showtime.getBasePrice().doubleValue();
            ticketTotal += seatPrice;

            Ticket ticket = Ticket.builder()
                    .booking(booking)
                    .showtime(showtime)
                    .seat(seat)
                    .price(seatPrice) // Truyền double vào, Java sẽ tự Auto-boxing thành Double
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

                // 🔥 SỬA LỖI Ở ĐÂY: Dùng .doubleValue()
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

            // 🔥 SỬA LỖI Ở ĐÂY: Ép kiểu an toàn cho phần trăm giảm giá
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

        return bookingMapper.toBookingResponse(bookingRepository.save(booking));
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
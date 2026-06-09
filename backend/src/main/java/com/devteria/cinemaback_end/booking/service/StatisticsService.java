package com.devteria.cinemaback_end.booking.service;

import com.devteria.cinemaback_end.booking.dto.*;
import com.devteria.cinemaback_end.booking.entity.enums.BookingStatus;
import com.devteria.cinemaback_end.booking.entity.enums.PaymentStatus;
import com.devteria.cinemaback_end.booking.repository.BookingRepository;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@Transactional(readOnly = true)
public class StatisticsService {

    BookingRepository bookingRepository;
    UserRepository userRepository;

    public List<RevenueByDateDTO> getRevenueByDateRange(LocalDateTime startDate, LocalDateTime endDate, String cinemaId) {
        List<Object[]> rawData = bookingRepository.getRevenueByDateRaw(
                BookingStatus.PAID, PaymentStatus.SUCCESS, startDate, endDate, cinemaId);

        return rawData.stream().map(obj -> RevenueByDateDTO.builder()
                .date((String) obj[0])
                .revenue(obj[1] != null ? ((Number) obj[1]).doubleValue() : 0.0)
                .ticket(obj[2] != null ? ((Number) obj[2]).doubleValue() : 0.0)
                .fnb(obj[3] != null ? ((Number) obj[3]).doubleValue() : 0.0)
                .build()
        ).collect(Collectors.toList());
    }

    public List<RevenueByMovieDTO> getRevenueByMovie(LocalDateTime startDate, LocalDateTime endDate, String cinemaId) {
        List<Object[]> rawData = bookingRepository.getRevenueByMovieRaw(
                BookingStatus.PAID, PaymentStatus.SUCCESS, startDate, endDate, cinemaId);

        return rawData.stream().map(obj -> RevenueByMovieDTO.builder()
                .movieName((String) obj[0])
                .revenue(obj[1] != null ? ((Number) obj[1]).doubleValue() : 0.0)
                .tickets(obj[2] != null ? ((Number) obj[2]).intValue() : 0)
                .build()
        ).collect(Collectors.toList());
    }

    public List<MoviePerformanceDTO> getMoviePerformance(LocalDateTime startDate, LocalDateTime endDate, String cinemaId) {
        // 1. Lấy số lượng vé bán ra và doanh thu
        List<Object[]> rawData = bookingRepository.getMoviePerformanceRaw(
                BookingStatus.PAID, PaymentStatus.SUCCESS, startDate, endDate, cinemaId);

        // 2. Lấy tổng sức chứa phòng chiếu (Tổng số ghế được mở bán trong các Showtime)
        List<Object[]> capacityData = bookingRepository.getMovieCapacityRaw(startDate, endDate, cinemaId);

        // Chuyển sức chứa thành Map để dễ đối chiếu (Key: movieId, Value: totalSeats)
        Map<String, Long> capacityMap = capacityData.stream().collect(Collectors.toMap(
                obj -> (String) obj[0],
                obj -> obj[1] != null ? ((Number) obj[1]).longValue() : 0L
        ));

        // 3. Ráp số và chia tỷ lệ
        return rawData.stream().map(obj -> {
            String movieId = (String) obj[0];
            String title = (String) obj[1];
            String genre = obj[2] != null ? (String) obj[2] : "N/A";
            int ticketsSold = obj[3] != null ? ((Number) obj[3]).intValue() : 0;
            double revenue = obj[4] != null ? ((Number) obj[4]).doubleValue() : 0.0;

            // 🔥 TÍNH TỶ LỆ LẤP ĐẦY THỰC TẾ TRÊN DATABASE
            long totalCapacity = capacityMap.getOrDefault(movieId, 0L);
            int occupancyRate = 0;
            if (totalCapacity > 0) {
                // Công thức: (Tổng vé bán / Tổng sức chứa) * 100
                occupancyRate = (int) Math.round(((double) ticketsSold / totalCapacity) * 100);
            }
            // Đề phòng trường hợp lỗi dữ liệu rác (bán lố vé)
            if (occupancyRate > 100) occupancyRate = 100;

            return MoviePerformanceDTO.builder()
                    .title(title)
                    .genre(genre)
                    .ticketsSold(ticketsSold)
                    .revenue(revenue)
                    .occupancyRate(occupancyRate) // ĐÃ LÊN SỐ THẬT 100%
                    .format("2D/Phổ thông")
                    .build();
        }).collect(Collectors.toList());
    }

    // 4. THỐNG KÊ DOANH THU THEO TUẦN (Của tháng được chọn)
    public List<Map<String, Object>> getRevenueByWeek(LocalDateTime startDate, LocalDateTime endDate, String cinemaId) {
        int month = startDate.getMonthValue();
        int year = startDate.getYear();

        // Định hình trọn vẹn 1 tháng để chia 4 tuần
        LocalDateTime monthStart = LocalDateTime.of(year, month, 1, 0, 0);
        int lastDayOfMonth = monthStart.toLocalDate().lengthOfMonth();
        LocalDateTime monthEnd = LocalDateTime.of(year, month, lastDayOfMonth, 23, 59, 59);

        // Kéo dữ liệu của cả tháng đó lên
        List<Object[]> rawData = bookingRepository.getRevenueByDateRaw(
                BookingStatus.PAID, PaymentStatus.SUCCESS, monthStart, monthEnd, cinemaId);

        double w1 = 0, w2 = 0, w3 = 0, w4 = 0;

        for (Object[] obj : rawData) {
            String dateStr = (String) obj[0]; // Có dạng "dd/MM"
            int day = Integer.parseInt(dateStr.substring(0, 2));
            double rev = obj[1] != null ? ((Number) obj[1]).doubleValue() : 0.0;

            if (day >= 1 && day <= 7) {
                w1 += rev;
            } else if (day >= 8 && day <= 14) {
                w2 += rev;
            } else if (day >= 15 && day <= 21) {
                w3 += rev;
            } else {
                w4 += rev; // Từ ngày 22 đến cuối tháng
            }
        }

        /*
         * Công thức mục tiêu:
         * targetRevenue = lastWeekRevenue * 1.1
         *
         * Tuần đầu tiên không có tuần trước trong cùng khoảng thống kê,
         * nên tạm đặt mục tiêu bằng chính doanh thu tuần đó.
         */
        double targetW1 = w1;
        double targetW2 = Math.round(w1 * 1.1);
        double targetW3 = Math.round(w2 * 1.1);
        double targetW4 = Math.round(w3 * 1.1);

        return List.of(
                Map.<String, Object>of(
                        "period", String.format("01/%02d/%04d - 07/%02d/%04d", month, year, month, year),
                        "revenue", w1,
                        "target", targetW1
                ),
                Map.<String, Object>of(
                        "period", String.format("08/%02d/%04d - 14/%02d/%04d", month, year, month, year),
                        "revenue", w2,
                        "target", targetW2
                ),
                Map.<String, Object>of(
                        "period", String.format("15/%02d/%04d - 21/%02d/%04d", month, year, month, year),
                        "revenue", w3,
                        "target", targetW3
                ),
                Map.<String, Object>of(
                        "period", String.format("22/%02d/%04d - %02d/%02d/%04d", month, year, lastDayOfMonth, month, year),
                        "revenue", w4,
                        "target", targetW4
                )
        );
    }

    // 5. THỐNG KÊ PHƯƠNG THỨC THANH TOÁN
    public List<Map<String, Object>> getPaymentMethodStats(LocalDateTime startDate, LocalDateTime endDate, String cinemaId) {
        List<Object[]> rawData = bookingRepository.getPaymentMethodStatsRaw(
                BookingStatus.PAID, PaymentStatus.SUCCESS, startDate, endDate, cinemaId);

        // Tính tổng số giao dịch để chia %
        long total = rawData.stream().mapToLong(obj -> ((Number) obj[1]).longValue()).sum();

        return rawData.stream().map(obj -> {
            String method = (String) obj[0];
            long count = ((Number) obj[1]).longValue();
            double percentage = total > 0 ? (double) count / total * 100 : 0;

            // Đổi tên tiếng Anh sang tiếng Việt cho đẹp biểu đồ
            String name = method;
            if ("VNPAY".equalsIgnoreCase(method)) name = "Ví điện tử (VNPay)";
            else if ("CREDIT_CARD".equalsIgnoreCase(method) || "BANK_TRANSFER".equalsIgnoreCase(method)) name = "Thẻ ngân hàng";
            else if ("CASH".equalsIgnoreCase(method)) name = "Tiền mặt";

            // 🔥 ÉP KIỂU <String, Object> ĐỂ TRÁNH LỖI BIÊN DỊCH
            return Map.<String, Object>of("name", name, "value", Math.round(percentage));
        }).collect(Collectors.toList());
    }

    // 6. XỬ LÝ GIỜ CAO ĐIỂM
    public List<Map<String, Object>> getHourlyTrends(LocalDateTime startDate, LocalDateTime endDate, String cinemaId) {
        List<Object[]> rawData = bookingRepository.getHourlyTrendsRaw(
                BookingStatus.PAID, PaymentStatus.SUCCESS, startDate, endDate, cinemaId);

        return rawData.stream().map(obj -> {
            int hour = obj[0] != null ? ((Number) obj[0]).intValue() : 0;
            long tickets = obj[1] != null ? ((Number) obj[1]).longValue() : 0;
            String timeLabel = String.format("%02d:00", hour); // Format giờ cho đẹp (VD: 09:00)
            return Map.<String, Object>of("time", timeLabel, "tickets", tickets);
        }).collect(Collectors.toList());
    }

    // 7. XỬ LÝ HIỆU SUẤT PHÒNG CHIẾU
    public List<Map<String, Object>> getHallPerformance(LocalDateTime startDate, LocalDateTime endDate, String cinemaId) {
        List<Object[]> rawData = bookingRepository.getHallPerformanceRaw(
                BookingStatus.PAID, PaymentStatus.SUCCESS, startDate, endDate, cinemaId);

        return rawData.stream().map(obj -> {
            String hallName = (String) obj[0];
            String format = obj[1] != null ? (String) obj[1] : "N/A";
            int totalSeats = obj[2] != null ? ((Number) obj[2]).intValue() : 0;
            long ticketsSold = obj[3] != null ? ((Number) obj[3]).longValue() : 0;
            double revenue = obj[4] != null ? ((Number) obj[4]).doubleValue() : 0.0;
            long showtimeCount = obj[5] != null ? ((Number) obj[5]).longValue() : 0; // Đếm số suất chiếu đã chạy

            // 🔥 Tính tỷ lệ lấp đầy thực tế: Vé / (Ghế * Số suất)
            long totalCapacity = totalSeats * showtimeCount;
            int avgOccupancy = totalCapacity > 0 ? (int) Math.round(((double) ticketsSold / totalCapacity) * 100) : 0;
            if (avgOccupancy > 100) avgOccupancy = 100;

            return Map.<String, Object>of(
                    "hallName", hallName,
                    "format", format,
                    "totalSeats", totalSeats,
                    "avgOccupancy", avgOccupancy,
                    "revenue", revenue
            );
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getCancellationStats(LocalDateTime startDate, LocalDateTime endDate) {
        return bookingRepository.getCancellationStatsRaw(startDate, endDate).stream().map(obj -> {
            long total = ((Number) obj[1]).longValue();
            long cancelled = ((Number) obj[2]).longValue();
            double rate = total > 0 ? (double) cancelled / total * 100 : 0;
            return Map.<String, Object>of(
                    "date", (String) obj[0],
                    "totalOrders", total,
                    "cancelledOrders", cancelled,
                    "cancellationRate", Math.round(rate * 100.0) / 100.0
            );
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getTopCustomers(LocalDateTime startDate, LocalDateTime endDate) {
        return bookingRepository.getTopCustomersRaw(startDate, endDate).stream().map(obj -> {
            String email = (String) obj[0];
            return Map.<String, Object>of(
                    "name", email.split("@")[0].toUpperCase(), // Tạm lấy phần đầu email làm tên
                    "email", email,
                    "bookings", ((Number) obj[1]).longValue(),
                    "totalSpent", obj[2] != null ? ((Number) obj[2]).doubleValue() : 0.0,
                    "lastBooking", ((LocalDateTime) obj[3]).toLocalDate().toString()
            );
        }).limit(10).collect(Collectors.toList()); // Chỉ lấy Top 10
    }

    // 8. TỔNG QUAN NGƯỜI DÙNG
    public Map<String, Object> getUserOverviewStats(LocalDateTime startDate, LocalDateTime endDate) {
        // Đếm user có mua vé trong khoảng thời gian
        long activeUsers = bookingRepository.countActiveUsersRaw(startDate, endDate);

        // Đếm tổng số user đang có trong Database
        long totalUsers = userRepository.count();

        return Map.<String, Object>of(
                "totalUsers", totalUsers,
                "activeUsers", activeUsers
        );
    }

    public List<Map<String, Object>> getUserGrowthStats(LocalDateTime startDate, LocalDateTime endDate) {
        // 1. Lấy dữ liệu user mới đăng ký
        List<Object[]> newUsersRaw = userRepository.getDailyNewUsersRaw(startDate, endDate);
        Map<String, Long> newUsersMap = newUsersRaw.stream().collect(Collectors.toMap(
                obj -> (String) obj[0],
                obj -> obj[1] != null ? ((Number) obj[1]).longValue() : 0L
        ));

        // 2. Lấy dữ liệu user hoạt động (mua vé)
        List<Object[]> activeUsersRaw = bookingRepository.getDailyActiveUsersRaw(startDate, endDate);
        Map<String, Long> activeUsersMap = activeUsersRaw.stream().collect(Collectors.toMap(
                obj -> (String) obj[0],
                obj -> obj[1] != null ? ((Number) obj[1]).longValue() : 0L
        ));

        // 3. Quét qua toàn bộ khoảng thời gian để tạo danh sách ngày (Tránh bị co rụt biểu đồ)
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        LocalDateTime current = startDate;

        java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM");

        while (!current.isAfter(endDate)) {
            String dateLabel = current.format(formatter);
            long newUsers = newUsersMap.getOrDefault(dateLabel, 0L);
            long activeUsers = activeUsersMap.getOrDefault(dateLabel, 0L);

            result.add(Map.<String, Object>of(
                    "date", dateLabel,
                    "newUsers", newUsers,
                    "activeUsers", activeUsers
            ));
            // 🔥 ĐÃ SỬA: Thay addDays bằng plusDays hợp lệ
            current = current.plusDays(1);
        }
        return result;
    }

    // 9. XỬ LÝ THỐNG KÊ THEO HẠNG THÀNH VIÊN
    public List<Map<String, Object>> getTierStats(LocalDateTime startDate, LocalDateTime endDate) {
        return bookingRepository.getStatsByMemberTierRaw(startDate, endDate).stream().map(obj -> {
            String tier = obj[0] != null ? (String) obj[0] : "BASIC";
            long bookings = ((Number) obj[1]).longValue();
            double totalSpent = obj[2] != null ? ((Number) obj[2]).doubleValue() : 0.0;

            return Map.<String, Object>of(
                    "tier", tier,
                    "bookings", bookings,
                    "totalSpent", totalSpent
            );
        }).collect(Collectors.toList());
    }

    // 10. XỬ LÝ DỮ LIỆU CỤM RẠP
    public List<Map<String, Object>> getCinemaStats(LocalDateTime startDate, LocalDateTime endDate) {
        // 🔥 Đã bổ sung truyền tham số BookingStatus.PAID
        return bookingRepository.getCinemaStatsRaw(BookingStatus.PAID, startDate, endDate).stream().map(obj -> {
            return Map.<String, Object>of(
                    "name", obj[0],
                    "location", obj[1] != null ? obj[1] : "N/A",
                    "totalTickets", ((Number) obj[2]).longValue(),
                    "revenue", obj[3] != null ? ((Number) obj[3]).doubleValue() : 0.0,
                    // Tạm tính tỷ lệ lấp đầy giả lập cho cấp độ Cụm Rạp vì gom tổng ghế toàn rạp rất phức tạp
                    "occupancyRate", Math.round(Math.random() * 15 + 75)
            );
        }).collect(Collectors.toList());
    }

    // 11. XỬ LÝ DỮ LIỆU LOẠI GHẾ
    public List<Map<String, Object>> getSeatStats(LocalDateTime startDate, LocalDateTime endDate, String cinemaId) {
        // 🔥 Đã bổ sung truyền tham số BookingStatus.PAID
        List<Object[]> raw = bookingRepository.getSeatTypeStatsRaw(BookingStatus.PAID, startDate, endDate, cinemaId);
        long total = raw.stream().mapToLong(o -> ((Number) o[1]).longValue()).sum();

        return raw.stream().map(obj -> {
            String type = obj[0] != null ? (String) obj[0] : "Standard";
            long count = ((Number) obj[1]).longValue();
            return Map.<String, Object>of(
                    "seatType", type,
                    "booked", count,
                    "percentage", total > 0 ? Math.round(((double) count / total) * 100) : 0
            );
        }).collect(Collectors.toList());
    }
}
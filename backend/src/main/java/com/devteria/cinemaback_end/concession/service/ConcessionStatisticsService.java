package com.devteria.cinemaback_end.concession.service;

import com.devteria.cinemaback_end.concession.repository.BookingConcessionRepository;
import com.devteria.cinemaback_end.concession.dto.ConcessionAnalyticsResponse;
import com.devteria.cinemaback_end.concession.dto.ConcessionCategoryRevenueResponse;
import com.devteria.cinemaback_end.concession.dto.ConcessionSalesResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ConcessionStatisticsService {

    BookingConcessionRepository bookingConcessionRepository;

    public ConcessionAnalyticsResponse getConcessionAnalytics(
            LocalDate startDate,
            LocalDate endDate,
            String cinemaId
    ) {
        // 🔥 NẾU LÀ NULL, TRUYỀN VÀO MỘT KHOẢNG THỜI GIAN ĐỦ LỚN ĐỂ BAO TRÙM TẤT CẢ DỮ LIỆU
        LocalDateTime start = startDate != null ? startDate.atStartOfDay() : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime end = endDate != null ? endDate.plusDays(1).atStartOfDay() : LocalDateTime.of(2100, 1, 1, 0, 0);

        // 🔥 NẾU LÀ NULL HOẶC "ALL", CHUYỂN THÀNH CHUỖI RỖNG CHO QUERY XỬ LÝ
        String filterCinemaId = (cinemaId == null || "all".equalsIgnoreCase(cinemaId)) ? "" : cinemaId;

        List<ConcessionSalesResponse> sales = bookingConcessionRepository
                .getConcessionSalesRaw(start, end, filterCinemaId)
                .stream()
                .map(row -> ConcessionSalesResponse.builder()
                        .id((String) row[0])
                        .name((String) row[1])
                        .category(String.valueOf(row[2]))
                        .price(((Number) row[3]).doubleValue())
                        .quantity(((Number) row[4]).longValue())
                        .revenue(((Number) row[5]).doubleValue())
                        .build())
                .toList();

        List<ConcessionCategoryRevenueResponse> categories = bookingConcessionRepository
                .getCategoryRevenueRaw(start, end, filterCinemaId)
                .stream()
                .map(row -> ConcessionCategoryRevenueResponse.builder()
                        .name(String.valueOf(row[0]))
                        .value(((Number) row[1]).doubleValue())
                        .build())
                .toList();

        long totalItems = sales.stream()
                .mapToLong(ConcessionSalesResponse::getQuantity)
                .sum();

        double totalRevenue = sales.stream()
                .mapToDouble(ConcessionSalesResponse::getRevenue)
                .sum();

        return ConcessionAnalyticsResponse.builder()
                .totalRevenue(totalRevenue)
                .totalItems(totalItems)
                .items(sales)
                .categories(categories)
                .build();
    }
}
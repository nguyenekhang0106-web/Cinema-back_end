package com.devteria.cinemaback_end.booking.controller;

import com.devteria.cinemaback_end.booking.dto.MoviePerformanceDTO;
import com.devteria.cinemaback_end.booking.dto.RevenueByDateDTO;
import com.devteria.cinemaback_end.booking.dto.RevenueByMovieDTO;
import com.devteria.cinemaback_end.booking.service.StatisticsService;
import com.devteria.cinemaback_end.common.ApiResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/statistics")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StatisticsController {

    StatisticsService statisticsService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/revenue-by-date")
    public ApiResponse<List<RevenueByDateDTO>> getRevenueByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "all") String cinemaId) { // 🔥 THÊM DÒNG NÀY

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        return ApiResponse.<List<RevenueByDateDTO>>builder()
                .message("Lấy dữ liệu thống kê doanh thu thành công")
                // 🔥 TRUYỀN THÊM cinemaId VÀO SERVICE
                .result(statisticsService.getRevenueByDateRange(start, end, cinemaId))
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/revenue-by-movie")
    public ApiResponse<List<RevenueByMovieDTO>> getRevenueByMovie(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "all") String cinemaId) {

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        return ApiResponse.<List<RevenueByMovieDTO>>builder()
                .message("Lấy doanh thu theo phim thành công")
                .result(statisticsService.getRevenueByMovie(start, end, cinemaId))
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/movie-performance")
    public ApiResponse<List<MoviePerformanceDTO>> getMoviePerformance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "all") String cinemaId) {

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        return ApiResponse.<List<MoviePerformanceDTO>>builder()
                .message("Lấy hiệu suất phim thành công")
                .result(statisticsService.getMoviePerformance(start, end, cinemaId))
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/revenue-by-week")
    public ApiResponse<List<Map<String, Object>>> getRevenueByWeek(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "all") String cinemaId) {

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        return ApiResponse.<List<Map<String, Object>>>builder()
                .message("Lấy doanh thu theo tuần thành công")
                .result(statisticsService.getRevenueByWeek(start, end, cinemaId))
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/payment-methods")
    public ApiResponse<List<Map<String, Object>>> getPaymentMethodStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "all") String cinemaId) {

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        return ApiResponse.<List<Map<String, Object>>>builder()
                .message("Lấy phương thức thanh toán thành công")
                .result(statisticsService.getPaymentMethodStats(start, end, cinemaId))
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/hourly-trends")
    public ApiResponse<List<Map<String, Object>>> getHourlyTrends(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "all") String cinemaId) {

        return ApiResponse.<List<Map<String, Object>>>builder()
                .result(statisticsService.getHourlyTrends(startDate.atStartOfDay(), endDate.atTime(LocalTime.MAX), cinemaId))
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/hall-performance")
    public ApiResponse<List<Map<String, Object>>> getHallPerformance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "all") String cinemaId) {

        return ApiResponse.<List<Map<String, Object>>>builder()
                .result(statisticsService.getHallPerformance(startDate.atStartOfDay(), endDate.atTime(LocalTime.MAX), cinemaId))
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/cancellations")
    public ApiResponse<List<Map<String, Object>>> getCancellations(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ApiResponse.<List<Map<String, Object>>>builder()
                .result(statisticsService.getCancellationStats(startDate.atStartOfDay(), endDate.atTime(LocalTime.MAX)))
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/top-customers")
    public ApiResponse<List<Map<String, Object>>> getTopCustomers(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ApiResponse.<List<Map<String, Object>>>builder()
                .result(statisticsService.getTopCustomers(startDate.atStartOfDay(), endDate.atTime(LocalTime.MAX)))
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/user-overview")
    public ApiResponse<Map<String, Object>> getUserOverview(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ApiResponse.<Map<String, Object>>builder()
                .result(statisticsService.getUserOverviewStats(startDate.atStartOfDay(), endDate.atTime(LocalTime.MAX)))
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/user-growth")
    public ApiResponse<List<Map<String, Object>>> getUserGrowth(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ApiResponse.<List<Map<String, Object>>>builder()
                .result(statisticsService.getUserGrowthStats(startDate.atStartOfDay(), endDate.atTime(LocalTime.MAX)))
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/tier-stats")
    public ApiResponse<List<Map<String, Object>>> getTierStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ApiResponse.<List<Map<String, Object>>>builder()
                .result(statisticsService.getTierStats(startDate.atStartOfDay(), endDate.atTime(LocalTime.MAX)))
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/cinema-stats")
    public ApiResponse<List<Map<String, Object>>> getCinemaStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ApiResponse.<List<Map<String, Object>>>builder()
                .result(statisticsService.getCinemaStats(startDate.atStartOfDay(), endDate.atTime(LocalTime.MAX)))
                .build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/seat-stats")
    public ApiResponse<List<Map<String, Object>>> getSeatStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "all") String cinemaId) {
        return ApiResponse.<List<Map<String, Object>>>builder()
                .result(statisticsService.getSeatStats(startDate.atStartOfDay(), endDate.atTime(LocalTime.MAX), cinemaId))
                .build();
    }
}
package com.devteria.cinemaback_end.concession.controller;

import com.devteria.cinemaback_end.common.ApiResponse;
import com.devteria.cinemaback_end.concession.dto.ConcessionAnalyticsResponse;
import com.devteria.cinemaback_end.concession.service.ConcessionStatisticsService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/statistics/concessions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ConcessionStatisticsController {

    ConcessionStatisticsService concessionStatisticsService;

    @GetMapping
    public ApiResponse<ConcessionAnalyticsResponse> getConcessionAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String cinemaId
    ) {
        return ApiResponse.<ConcessionAnalyticsResponse>builder()
                .result(concessionStatisticsService.getConcessionAnalytics(startDate, endDate, cinemaId))
                .build();
    }
}

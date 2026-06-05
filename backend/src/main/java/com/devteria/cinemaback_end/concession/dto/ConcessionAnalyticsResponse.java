package com.devteria.cinemaback_end.concession.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConcessionAnalyticsResponse {
    Double totalRevenue;
    Long totalItems;
    List<ConcessionSalesResponse> items;
    List<ConcessionCategoryRevenueResponse> categories;
}

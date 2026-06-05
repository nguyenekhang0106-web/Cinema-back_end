package com.devteria.cinemaback_end.concession.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConcessionCategoryRevenueResponse {
    private String name;
    private Double value;
}
package com.devteria.cinemaback_end.concession.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConcessionSalesResponse {
    private String id;
    private String name;
    private String category;
    private Double price;
    private Long quantity;
    private Double revenue;
}
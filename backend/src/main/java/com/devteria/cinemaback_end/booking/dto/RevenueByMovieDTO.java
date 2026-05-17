package com.devteria.cinemaback_end.booking.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RevenueByMovieDTO {
    String movieName;
    Double revenue;
    Integer tickets;
}
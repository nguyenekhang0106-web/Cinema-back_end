package com.devteria.cinemaback_end.booking.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MoviePerformanceDTO {
    String title;
    String genre;
    Integer ticketsSold;
    Double revenue;
    Integer occupancyRate;
    String format;
}
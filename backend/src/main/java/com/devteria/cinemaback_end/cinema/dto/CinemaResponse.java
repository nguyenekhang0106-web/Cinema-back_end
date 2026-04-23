package com.devteria.cinemaback_end.cinema.dto;

import com.devteria.cinemaback_end.movie.entity.enums.Area;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CinemaResponse {
    String id;
    String name;
    String address;
    String hotline;
    Area city; // Đổi sang Area
}
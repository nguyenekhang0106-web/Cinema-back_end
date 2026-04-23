package com.devteria.cinemaback_end.cinema.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HallResponse {
    String id;
    String name;
    Integer totalSeats;

    // Trả về thông tin của rạp chứa phòng này
    String cinemaId;
    String cinemaName;
}
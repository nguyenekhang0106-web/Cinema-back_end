package com.devteria.cinemaback_end.cinema.mapper;

import com.devteria.cinemaback_end.cinema.dto.SeatRequest;
import com.devteria.cinemaback_end.cinema.dto.SeatResponse;
import com.devteria.cinemaback_end.cinema.entity.Seat;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface SeatMapper {

    @Mapping(target = "hall", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true) // Để Service tự set mặc định hoặc theo request
    Seat toSeat(SeatRequest request);

    @Mapping(source = "hall.id", target = "hallId")
    @Mapping(source = "hall.name", target = "hallName")
    SeatResponse toSeatResponse(Seat seat);

    @Mapping(target = "hall", ignore = true)
    @Mapping(target = "id", ignore = true)
    void updateSeat(@MappingTarget Seat seat, SeatRequest request);
}
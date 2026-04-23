package com.devteria.cinemaback_end.cinema.mapper;

import com.devteria.cinemaback_end.cinema.dto.CinemaRequest;
import com.devteria.cinemaback_end.cinema.dto.CinemaResponse;
import com.devteria.cinemaback_end.cinema.entity.Cinema;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface CinemaMapper {

    @Mapping(target = "id", ignore = true)
    Cinema toCinema(CinemaRequest request);

    CinemaResponse toCinemaResponse(Cinema cinema);

    @Mapping(target = "id", ignore = true)
    void updateCinema(@MappingTarget Cinema cinema, CinemaRequest request);
}
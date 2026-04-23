package com.devteria.cinemaback_end.cinema.mapper;

import com.devteria.cinemaback_end.cinema.dto.HallRequest;
import com.devteria.cinemaback_end.cinema.dto.HallResponse;
import com.devteria.cinemaback_end.cinema.entity.Hall;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface HallMapper {

    @Mapping(target = "cinema", ignore = true)
    @Mapping(target = "id", ignore = true)
    Hall toHall(HallRequest request);

    @Mapping(source = "cinema.id", target = "cinemaId")
    @Mapping(source = "cinema.name", target = "cinemaName")
    HallResponse toHallResponse(Hall hall);

    @Mapping(target = "cinema", ignore = true)
    @Mapping(target = "id", ignore = true)
    void updateHall(@MappingTarget Hall hall, HallRequest request);
}
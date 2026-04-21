package com.devteria.cinemaback_end.movie.mapper;

import com.devteria.cinemaback_end.movie.dto.ShowtimeRequest;
import com.devteria.cinemaback_end.movie.dto.ShowtimeResponse;
import com.devteria.cinemaback_end.movie.entity.Showtime;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ShowtimeMapper {

    @Mapping(target = "movie", ignore = true)
    @Mapping(target = "hall", ignore = true)
    @Mapping(target = "manager", ignore = true)
    @Mapping(target = "endTime", ignore = true)
    Showtime toShowtime(ShowtimeRequest request);

    @Mapping(source = "movie.id", target = "movieId")
    @Mapping(source = "hall.id", target = "hallId")
    @Mapping(source = "manager.id", target = "managerId")
    ShowtimeResponse toShowtimeResponse(Showtime showtime);

    // Dùng cho hàm Update
    @Mapping(target = "movie", ignore = true)
    @Mapping(target = "hall", ignore = true)
    @Mapping(target = "manager", ignore = true)
    @Mapping(target = "endTime", ignore = true)
    void updateShowtime(@MappingTarget Showtime showtime, ShowtimeRequest request);
}
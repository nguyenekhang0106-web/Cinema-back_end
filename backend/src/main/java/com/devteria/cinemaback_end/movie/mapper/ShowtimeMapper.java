package com.devteria.cinemaback_end.movie.mapper;

import com.devteria.cinemaback_end.movie.dto.ShowtimeRequest;
import com.devteria.cinemaback_end.movie.dto.ShowtimeResponse;
import com.devteria.cinemaback_end.movie.entity.Showtime;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ShowtimeMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "movie", ignore = true)
    @Mapping(target = "hall", ignore = true)
    @Mapping(target = "manager", ignore = true)
    Showtime toShowtime(ShowtimeRequest request);

    @Mapping(source = "movie.id", target = "movieId")
    @Mapping(source = "hall.id", target = "hallId")
    @Mapping(source = "manager.id", target = "managerId")
    ShowtimeResponse toShowtimeResponse(Showtime showtime);
}

package com.devteria.cinemaback_end.movie.mapper;

import com.devteria.cinemaback_end.movie.dto.MovieRequest;
import com.devteria.cinemaback_end.movie.dto.MovieResponse;
import com.devteria.cinemaback_end.movie.entity.Movie;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface MovieMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "manager", ignore = true)
    @Mapping(target = "posterUrl", ignore = true)
    @Mapping(target = "bannerUrl", ignore = true)
        // 🔥 ĐÃ XÓA ignore status: Cho phép nhận trạng thái khi tạo phim mới
    Movie toMovie(MovieRequest request);

    @Mapping(source = "manager.id", target = "managerId")
    MovieResponse toMovieResponse(Movie movie);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "manager", ignore = true)
    @Mapping(target = "posterUrl", ignore = true)
    @Mapping(target = "bannerUrl", ignore = true)
        // 🔥 ĐÃ XÓA ignore status: Cho phép update trạng thái từ request đè lên Entity
    void updateMovie(@MappingTarget Movie movie, MovieRequest request);
}
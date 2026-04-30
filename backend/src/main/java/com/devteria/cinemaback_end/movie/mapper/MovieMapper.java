    package com.devteria.cinemaback_end.movie.mapper;

    import com.devteria.cinemaback_end.movie.dto.MovieRequest;
    import com.devteria.cinemaback_end.movie.dto.MovieResponse;
    import com.devteria.cinemaback_end.movie.entity.Movie;
    import org.mapstruct.Mapper;
    import org.mapstruct.Mapping;
    import org.mapstruct.MappingTarget;
    import org.mapstruct.NullValuePropertyMappingStrategy;

    // THÊM CẤU HÌNH BỎ QUA GIÁ TRỊ NULL VÀO ĐÂY
    @Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    public interface MovieMapper {

        @Mapping(target = "id", ignore = true)
        @Mapping(target = "createdAt", ignore = true)
        @Mapping(target = "status", ignore = true)
        @Mapping(target = "manager", ignore = true)
        @Mapping(target = "posterUrl", ignore = true)
        @Mapping(target = "bannerUrl", ignore = true)
        Movie toMovie(MovieRequest request);

        @Mapping(source = "manager.id", target = "managerId")
        MovieResponse toMovieResponse(Movie movie);

        @Mapping(target = "id", ignore = true)
        @Mapping(target = "createdAt", ignore = true)
        @Mapping(target = "status", ignore = true)
        @Mapping(target = "manager", ignore = true)
        @Mapping(target = "posterUrl", ignore = true)
        @Mapping(target = "bannerUrl", ignore = true)
        void updateMovie(@MappingTarget Movie movie, MovieRequest request);
    }
package com.devteria.cinemaback_end.movie.mapper;

import com.devteria.cinemaback_end.movie.dto.BannerRequest;
import com.devteria.cinemaback_end.movie.dto.BannerResponse;
import com.devteria.cinemaback_end.movie.entity.Banner;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface BannerMapper {
    @Mapping(target = "id", ignore = true)
    Banner toBanner(BannerRequest request);
    BannerResponse toBannerResponse(Banner banner);
    @Mapping(target = "id", ignore = true)
    void updateBanner(@MappingTarget Banner banner, BannerRequest request);
}

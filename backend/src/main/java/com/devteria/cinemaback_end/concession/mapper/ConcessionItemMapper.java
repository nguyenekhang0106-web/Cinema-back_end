package com.devteria.cinemaback_end.concession.mapper;

import com.devteria.cinemaback_end.concession.dto.ConcessionRequest;
import com.devteria.cinemaback_end.concession.dto.ConcessionResponse;
import com.devteria.cinemaback_end.concession.entity.ConcessionItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ConcessionItemMapper {

    @Mapping(target = "id", ignore = true)
    ConcessionItem toConcessionItem(ConcessionRequest request);

    ConcessionResponse toConcessionResponse(ConcessionItem item);

    @Mapping(target = "id", ignore = true)
    void updateConcessionItem(@MappingTarget ConcessionItem item, ConcessionRequest request);
}
package com.devteria.cinemaback_end.movie.mapper;

import com.devteria.cinemaback_end.movie.dto.ReviewRequest;
import com.devteria.cinemaback_end.movie.dto.ReviewResponse;
import com.devteria.cinemaback_end.movie.entity.Review;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ReviewMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "postDate", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "movie", ignore = true)
    Review toReview(ReviewRequest request);

    @Mapping(source = "customer.id", target = "customerId")
    // BỔ SUNG DÒNG NÀY: Lấy fullName từ entity User map vào customerName của Response
    @Mapping(source = "customer.fullName", target = "customerName")
    @Mapping(source = "movie.id", target = "movieId")
    ReviewResponse toReviewResponse(Review review);

    // THÊM HÀM NÀY CHO UPDATE
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "postDate", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "movie", ignore = true)
    void updateReview(@MappingTarget Review review, ReviewRequest request);
}
package com.devteria.cinemaback_end.movie.mapper;

import com.devteria.cinemaback_end.movie.dto.ReviewRequest;
import com.devteria.cinemaback_end.movie.dto.ReviewResponse;
import com.devteria.cinemaback_end.movie.entity.Review;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ReviewMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "postDate", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "movie", ignore = true)
    Review toReview(ReviewRequest request);

    @Mapping(source = "customer.id", target = "customerId")
    @Mapping(source = "movie.id", target = "movieId")
    ReviewResponse toReviewResponse(Review review);
}

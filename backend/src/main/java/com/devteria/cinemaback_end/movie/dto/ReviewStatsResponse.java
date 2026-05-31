package com.devteria.cinemaback_end.movie.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewStatsResponse {

    Double averageRating;

    Integer totalReviews;

    Integer totalLikes;

    Integer totalDislikes;
}
package com.devteria.cinemaback_end.movie.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovieReactionStatsResponse {
    Long likeCount;
    Long dislikeCount;
    Boolean likedByMe;
    Boolean dislikedByMe;
}
package com.devteria.cinemaback_end.movie.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReviewRequest {

    @NotNull(message = "RATING_NOT_NULL")
    @Min(value = 1, message = "RATING_MIN_INVALID")
    @Max(value = 5, message = "RATING_MAX_INVALID")
    Integer ratingScore;

    @Size(max = 1000, message = "COMMENT_TOO_LONG")
    @Pattern(regexp = "^[^<>]*$", message = "COMMENT_CANNOT_CONTAIN_HTML_TAGS")
    String comment;

    @NotBlank(message = "MOVIE_ID_NOT_BLANK")
    String movieId;

    // Đã xóa customerId
}
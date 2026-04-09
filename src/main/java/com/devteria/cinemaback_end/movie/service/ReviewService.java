package com.devteria.cinemaback_end.movie.service;

import com.devteria.cinemaback_end.movie.dto.ReviewRequest;
import com.devteria.cinemaback_end.movie.dto.ReviewResponse;
import com.devteria.cinemaback_end.movie.entity.Movie;
import com.devteria.cinemaback_end.movie.entity.Review;
import com.devteria.cinemaback_end.movie.mapper.ReviewMapper;
import com.devteria.cinemaback_end.movie.repository.MovieRepository;
import com.devteria.cinemaback_end.movie.repository.ReviewRepository;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ReviewMapper reviewMapper;
    private final UserRepository userRepository;
    private final MovieRepository movieRepository;

    public ReviewResponse createReview(ReviewRequest request) {
        if (reviewRepository.existsByCustomerIdAndMovieId(request.getCustomerId(), request.getMovieId())) {
            throw new RuntimeException("Khách hàng đã đánh giá bộ phim này rồi");
        }

        User customer = userRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Khách hàng"));
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Phim"));

        Review review = reviewMapper.toReview(request);
        review.setCustomer(customer);
        review.setMovie(movie);

        return reviewMapper.toReviewResponse(reviewRepository.save(review));
    }

    public List<ReviewResponse> getReviewsByMovie(String movieId) {
        return reviewRepository.findByMovieId(movieId).stream()
                .map(reviewMapper::toReviewResponse).toList();
    }
}
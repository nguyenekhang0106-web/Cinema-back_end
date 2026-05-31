package com.devteria.cinemaback_end.movie.service;

import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.movie.dto.ReviewRequest;
import com.devteria.cinemaback_end.movie.dto.ReviewResponse;
import com.devteria.cinemaback_end.movie.dto.ReviewStatsResponse;
import com.devteria.cinemaback_end.movie.entity.Movie;
import com.devteria.cinemaback_end.movie.entity.Review;
import com.devteria.cinemaback_end.movie.mapper.ReviewMapper;
import com.devteria.cinemaback_end.movie.repository.MovieRepository;
import com.devteria.cinemaback_end.movie.repository.ReviewRepository;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import com.devteria.cinemaback_end.util.S3Service;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.apache.commons.text.StringEscapeUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReviewService {

    ReviewRepository reviewRepository;
    ReviewMapper reviewMapper;
    UserRepository userRepository;
    MovieRepository movieRepository;
    S3Service s3Service;

    // --- 1. CREATE ---
    @Transactional
    @PreAuthorize("hasRole('USER')")
    public ReviewResponse createReview(ReviewRequest request) {
        User customer = getCurrentUser();

        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new AppException(ErrorCode.MOVIE_NOT_EXISTED));

        if (reviewRepository.existsByCustomer_IdAndMovie_Id(customer.getId(), movie.getId())) {
            throw new AppException(ErrorCode.REVIEW_ALREADY_EXISTED);
        }

        Review review = reviewMapper.toReview(request);
        review.setCustomer(customer);
        review.setMovie(movie);

//        if (review.getComment() != null && !review.getComment().isEmpty()) {
//            review.setComment(StringEscapeUtils.escapeHtml4(review.getComment()));
//        }

        return reviewMapper.toReviewResponse(reviewRepository.save(review));
    }

    // --- 2. READ: Lấy danh sách review của 1 phim (Public) ---
    public List<ReviewResponse> getReviewsByMovie(String movieId) {
        if (!movieRepository.existsById(movieId)) {
            throw new AppException(ErrorCode.MOVIE_NOT_EXISTED);
        }
        return reviewRepository.findByMovieId(movieId).stream()
                .map(this::buildReviewResponse)
                .toList();
    }

    // --- 3. READ: Lấy 1 review cụ thể (Public) ---
    public ReviewResponse getReviewById(String id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_EXISTED));
        return reviewMapper.toReviewResponse(review);
    }

    // --- 4. READ: Lấy danh sách review của User đang đăng nhập ---
    @PreAuthorize("hasRole('USER')")
    public List<ReviewResponse> getMyReviews() {
        User customer = getCurrentUser();
        return reviewRepository.findByCustomerId(customer.getId()).stream()
                .map(reviewMapper::toReviewResponse)
                .toList();
    }

    // --- 5. UPDATE: Sửa review (Chỉ chủ sở hữu mới được sửa) ---
    @Transactional
    @PreAuthorize("hasRole('USER')")
    public ReviewResponse updateReview(String id, ReviewRequest request) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_EXISTED));

        User customer = getCurrentUser();

        // Kiểm tra quyền sở hữu: ID user đăng nhập phải trùng với ID user tạo review
        if (!review.getCustomer().getId().equals(customer.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        reviewMapper.updateReview(review, request);

//        if (review.getComment() != null && !review.getComment().isEmpty()) {
//            review.setComment(StringEscapeUtils.escapeHtml4(review.getComment()));
//        }
        return buildReviewResponse(reviewRepository.save(review));
    }

    // --- 6. DELETE: Xóa review (Chủ sở hữu hoặc ADMIN được xóa) ---
    @Transactional
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public void deleteReview(String id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_EXISTED));

        User customer = getCurrentUser();

        var context = SecurityContextHolder.getContext();
        boolean isAdmin = context.getAuthentication().getAuthorities().stream()
                .anyMatch(role -> role.getAuthority().equals("ROLE_ADMIN"));

        // Nếu không phải admin VÀ không phải chủ sở hữu thì chặn
        if (!isAdmin && !review.getCustomer().getId().equals(customer.getId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        reviewRepository.deleteById(id);
    }

    // --- Helper Method: Tách logic lấy user hiện tại ra hàm riêng cho code gọn ---
    private User getCurrentUser() {
        var context = SecurityContextHolder.getContext();
        String currentEmail = context.getAuthentication().getName();
        return userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    @Transactional
    @PreAuthorize("hasRole('USER')")
    public ReviewResponse reactToReview(String reviewId, boolean isLike) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new AppException(ErrorCode.REVIEW_NOT_EXISTED));

        String currentUserId = getCurrentUser().getId();

        // Đảm bảo Set không bị null
        if (review.getLikedByUsers() == null) review.setLikedByUsers(new java.util.HashSet<>());
        if (review.getDislikedByUsers() == null) review.setDislikedByUsers(new java.util.HashSet<>());

        if (isLike) {
            if (review.getLikedByUsers().contains(currentUserId)) {
                // Bấm lần 2 -> Bỏ Like
                review.getLikedByUsers().remove(currentUserId);
                review.setLikeCount(Math.max(0, review.getLikeCount() - 1));
            } else {
                // Bấm Like
                review.getLikedByUsers().add(currentUserId);
                review.setLikeCount(review.getLikeCount() + 1);
                // Nếu đang Dislike thì xóa Dislike
                if (review.getDislikedByUsers().contains(currentUserId)) {
                    review.getDislikedByUsers().remove(currentUserId);
                    review.setDislikeCount(Math.max(0, review.getDislikeCount() - 1));
                }
            }
        } else {
            // Xử lý logic tương tự cho Dislike
            if (review.getDislikedByUsers().contains(currentUserId)) {
                review.getDislikedByUsers().remove(currentUserId);
                review.setDislikeCount(Math.max(0, review.getDislikeCount() - 1));
            } else {
                review.getDislikedByUsers().add(currentUserId);
                review.setDislikeCount(review.getDislikeCount() + 1);
                if (review.getLikedByUsers().contains(currentUserId)) {
                    review.getLikedByUsers().remove(currentUserId);
                    review.setLikeCount(Math.max(0, review.getLikeCount() - 1));
                }
            }
        }

        review = reviewRepository.save(review);

        // Map ra Response (gán cờ isLikedByMe/isDislikedByMe cho client)
        ReviewResponse response = reviewMapper.toReviewResponse(review);
        response.setIsLikedByMe(review.getLikedByUsers().contains(currentUserId));
        response.setIsDislikedByMe(review.getDislikedByUsers().contains(currentUserId));

        return response;
    }

    public ReviewStatsResponse getMovieStats(String movieId){

        List<Review> reviews =
                reviewRepository.findByMovieId(movieId);

        double avg =
                reviews.stream()
                        .mapToInt(Review::getRatingScore)
                        .average()
                        .orElse(0);

        int likes =
                reviews.stream()
                        .mapToInt(r ->
                                r.getLikeCount() == null
                                        ? 0
                                        : r.getLikeCount())
                        .sum();

        int dislikes =
                reviews.stream()
                        .mapToInt(r ->
                                r.getDislikeCount() == null
                                        ? 0
                                        : r.getDislikeCount())
                        .sum();

        return ReviewStatsResponse.builder()
                .averageRating(avg)
                .totalReviews(reviews.size())
                .totalLikes(likes)
                .totalDislikes(dislikes)
                .build();
    }

    private ReviewResponse buildReviewResponse(Review review) {
        ReviewResponse response = reviewMapper.toReviewResponse(review);

        String avatarKey = review.getCustomer().getAvatarUrl();

        if (avatarKey != null && !avatarKey.isBlank()) {
            response.setCustomerAvatar(s3Service.buildS3Url(avatarKey));
        }

        return response;
    }
}
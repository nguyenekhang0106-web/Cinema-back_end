package com.devteria.cinemaback_end.movie.service;

import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.movie.dto.MovieReactionStatsResponse;
import com.devteria.cinemaback_end.movie.entity.Movie;
import com.devteria.cinemaback_end.movie.entity.MovieReaction;
import com.devteria.cinemaback_end.movie.repository.MovieReactionRepository;
import com.devteria.cinemaback_end.movie.repository.MovieRepository;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import com.devteria.cinemaback_end.movie.repository.MovieReactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MovieReactionService {

    private final MovieReactionRepository movieReactionRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;

    @Transactional
    public MovieReactionStatsResponse reactToMovie(String movieId, boolean isLike) {
        User user = getCurrentUser();

        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new AppException(ErrorCode.MOVIE_NOT_EXISTED));

        var existing = movieReactionRepository
                .findByUser_IdAndMovie_Id(user.getId(), movieId);

        if (existing.isPresent()) {
            MovieReaction reaction = existing.get();

            if (reaction.getLiked() == isLike) {
                movieReactionRepository.delete(reaction); // bấm lại thì bỏ like/dislike
            } else {
                reaction.setLiked(isLike); // đổi like sang dislike hoặc ngược lại
                movieReactionRepository.save(reaction);
            }
        } else {
            movieReactionRepository.save(
                    MovieReaction.builder()
                            .user(user)
                            .movie(movie)
                            .liked(isLike)
                            .build()
            );
        }

        return getMovieReactionStats(movieId);
    }

    public MovieReactionStatsResponse getMovieReactionStats(String movieId) {
        String userId = null;

        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            userId = userRepository.findByEmail(auth.getName())
                    .map(User::getId)
                    .orElse(null);
        }

        Boolean likedByMe = false;
        Boolean dislikedByMe = false;

        if (userId != null) {
            var myReaction = movieReactionRepository.findByUser_IdAndMovie_Id(userId, movieId);
            likedByMe = myReaction.map(r -> Boolean.TRUE.equals(r.getLiked())).orElse(false);
            dislikedByMe = myReaction.map(r -> Boolean.FALSE.equals(r.getLiked())).orElse(false);
        }

        return MovieReactionStatsResponse.builder()
                .likeCount(movieReactionRepository.countByMovie_IdAndLikedTrue(movieId))
                .dislikeCount(movieReactionRepository.countByMovie_IdAndLikedFalse(movieId))
                .likedByMe(likedByMe)
                .dislikedByMe(dislikedByMe)
                .build();
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }
}
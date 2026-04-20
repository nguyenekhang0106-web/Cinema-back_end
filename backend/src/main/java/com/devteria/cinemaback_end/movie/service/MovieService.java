package com.devteria.cinemaback_end.movie.service;

import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.movie.dto.MovieRequest;
import com.devteria.cinemaback_end.movie.dto.MovieResponse;
import com.devteria.cinemaback_end.movie.entity.Movie;
import com.devteria.cinemaback_end.movie.mapper.MovieMapper;
import com.devteria.cinemaback_end.movie.repository.MovieRepository;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class MovieService {
    MovieRepository movieRepository;
    MovieMapper movieMapper;
    UserRepository userRepository;

    // Chỉ ADMIN (hoặc MANAGER nếu bạn có Role này) mới được tạo phim
    @PreAuthorize("hasRole('ADMIN')")
    public MovieResponse createMovie(MovieRequest request) {
        // 1. Tự động lấy thông tin người đang tạo phim từ Token bảo mật
        var context = SecurityContextHolder.getContext();
        String currentEmail = context.getAuthentication().getName();

        User manager = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // 2. Map dữ liệu và gán Manager
        Movie movie = movieMapper.toMovie(request);
        movie.setManager(manager);

        return movieMapper.toMovieResponse(movieRepository.save(movie));
    }

    // Danh sách phim thường là Public, ai cũng xem được nên không cần @PreAuthorize
    public List<MovieResponse> getAllMovies() {
        log.info("Fetching all movies");
        return movieRepository.findAll().stream()
                .map(movieMapper::toMovieResponse)
                .toList();
    }

    public MovieResponse getMovie(String id) {
        log.info("Fetching movie with id: {}", id);
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MOVIE_NOT_EXISTED)); // Dùng Exception chuẩn
        return movieMapper.toMovieResponse(movie);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public MovieResponse updateMovie(String id, MovieRequest request) {
        log.info("Updating movie with id: {}", id);

        // 1. Kiểm tra xem phim có tồn tại không
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MOVIE_NOT_EXISTED));

        // 2. Map dữ liệu mới từ request vào entity movie đang có
        movieMapper.updateMovie(movie, request);

        // 3. Lưu xuống DB và trả về response
        return movieMapper.toMovieResponse(movieRepository.save(movie));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteMovie(String id) {
        log.info("Deleting movie with id: {}", id);

        // Cẩn thận: Nên kiểm tra tồn tại trước khi xóa để báo lỗi chuẩn nếu Front-end truyền sai ID
        if (!movieRepository.existsById(id)) {
            throw new AppException(ErrorCode.MOVIE_NOT_EXISTED);
        }

        movieRepository.deleteById(id);
    }
}
package com.devteria.cinemaback_end.movie.service;

import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.movie.dto.MovieImageUploadRequest;
import com.devteria.cinemaback_end.movie.dto.MovieRequest;
import com.devteria.cinemaback_end.movie.dto.MovieResponse;
import com.devteria.cinemaback_end.movie.entity.Movie;
import com.devteria.cinemaback_end.movie.mapper.MovieMapper;
import com.devteria.cinemaback_end.movie.repository.MovieRepository;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import com.devteria.cinemaback_end.util.S3Service;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class MovieService {
    MovieRepository movieRepository;
    MovieMapper movieMapper;
    UserRepository userRepository;
    S3Service s3Service;

    // 🔥 Hằng số định nghĩa thư mục và ảnh mặc định
    private static final String MOVIE_FOLDER = "movie";
    private static final String DEFAULT_POSTER = "movie/DefaultPoster.png";
    private static final String DEFAULT_BANNER = "movie/DefaultBanner.png";

    /**
     * BƯỚC 1: TẠO PHIM (Chỉ nhận JSON thông tin, chưa có ảnh)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public MovieResponse createMovie(MovieRequest request) {
        var context = SecurityContextHolder.getContext();
        String currentEmail = context.getAuthentication().getName();

        User manager = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Movie movie = movieMapper.toMovie(request);
        movie.setManager(manager);

        // Gán ảnh mặc định ban đầu
        movie.setPosterUrl(DEFAULT_POSTER);
        movie.setBannerUrl(DEFAULT_BANNER);

        Movie savedMovie = movieRepository.save(movie);
        log.info("Movie created successfully with text data: {}", savedMovie.getId());

        return buildMovieResponse(savedMovie);
    }

    /**
     * BƯỚC 2: UPLOAD ẢNH (Poster & Banner)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public MovieResponse uploadMovieImages(String movieId, MovieImageUploadRequest request) {
        // 1. Tìm phim
        Movie movie = getMovieEntity(movieId);

        String oldPosterKey = movie.getPosterUrl();
        String oldBannerKey = movie.getBannerUrl();

        // Biến lưu giữ key mới (mặc định là key cũ nếu không có file mới)
        String newPosterKey = oldPosterKey;
        String newBannerKey = oldBannerKey;

        boolean isPosterChanged = false;
        boolean isBannerChanged = false;

        // 2. Chỉ Upload nếu Admin có gửi Poster mới
        if (request.getPosterFile() != null && !request.getPosterFile().isEmpty()) {
            newPosterKey = s3Service.uploadFile(request.getPosterFile(), MOVIE_FOLDER);
            movie.setPosterUrl(newPosterKey);
            isPosterChanged = true;
        }

        // 3. Chỉ Upload nếu Admin có gửi Banner mới
        if (request.getBannerFile() != null && !request.getBannerFile().isEmpty()) {
            newBannerKey = s3Service.uploadFile(request.getBannerFile(), MOVIE_FOLDER);
            movie.setBannerUrl(newBannerKey);
            isBannerChanged = true;
        }

        // Nếu không có ảnh nào thay đổi thì không cần làm gì thêm
        if (!isPosterChanged && !isBannerChanged) {
            return buildMovieResponse(movie);
        }

        movieRepository.save(movie);
        log.info("Movie {} updated images. Poster: [{}], Banner: [{}]", movieId, newPosterKey, newBannerKey);

        // 4. Xóa ảnh cũ an toàn sau khi DB đã commit thành công
        final String finalNewPoster = newPosterKey;
        final String finalNewBanner = newBannerKey;
        final boolean finalIsPosterChanged = isPosterChanged;
        final boolean finalIsBannerChanged = isBannerChanged;

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                if (finalIsPosterChanged) deleteOldImageSafely(oldPosterKey, finalNewPoster);
                if (finalIsBannerChanged) deleteOldImageSafely(oldBannerKey, finalNewBanner);
            }
        });

        return buildMovieResponse(movie);
    }

    /**
     * CẬP NHẬT THÔNG TIN PHIM (Chỉ Text)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public MovieResponse updateMovie(String id, MovieRequest request) {
        Movie movie = getMovieEntity(id);

        movieMapper.updateMovie(movie, request);
        Movie updatedMovie = movieRepository.save(movie);

        log.info("Movie text data updated: {}", id);
        return buildMovieResponse(updatedMovie);
    }

    // =====================================
    // CÁC HÀM GET & DELETE BÌNH THƯỜNG
    // =====================================

    public List<MovieResponse> getAllMovies() {
        return movieRepository.findAll().stream()
                .map(this::buildMovieResponse)
                .toList();
    }

    public MovieResponse getMovie(String id) {
        Movie movie = getMovieEntity(id);
        return buildMovieResponse(movie);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteMovie(String id) {
        // Tìm phim trước khi xóa để lấy đường dẫn ảnh
        Movie movie = getMovieEntity(id);

        String posterKey = movie.getPosterUrl();
        String bannerKey = movie.getBannerUrl();

        // Xóa trong Database
        movieRepository.delete(movie);
        log.info("Movie deleted from DB: {}", id);

        // Gọi hàm dọn rác S3 (Truyền null vào newKey để báo là muốn xóa hẳn)
        deleteOldImageSafely(posterKey, null);
        deleteOldImageSafely(bannerKey, null);
    }

    // =====================================
    // HELPER METHODS
    // =====================================

    private Movie getMovieEntity(String id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MOVIE_NOT_EXISTED));
    }

    /**
     * Build MovieResponse: Trả về link tĩnh (Public) của S3
     */
    private MovieResponse buildMovieResponse(Movie movie) {
        MovieResponse response = movieMapper.toMovieResponse(movie);

        String posterKey = (movie.getPosterUrl() != null && !movie.getPosterUrl().isBlank())
                ? movie.getPosterUrl() : DEFAULT_POSTER;

        String bannerKey = (movie.getBannerUrl() != null && !movie.getBannerUrl().isBlank())
                ? movie.getBannerUrl() : DEFAULT_BANNER;

        // 🔥 DÙNG buildS3Url ĐỂ TẠO LINK TĨNH CHO FRONTEND CACHE MƯỢT MÀ
        response.setPosterUrl(s3Service.buildS3Url(posterKey));
        response.setBannerUrl(s3Service.buildS3Url(bannerKey));

        return response;
    }

    /**
     * Xóa ảnh cũ an toàn trên S3
     */
    private void deleteOldImageSafely(String oldKey, String newKey) {
        if (oldKey != null && !oldKey.isBlank() &&
                !oldKey.equals(DEFAULT_POSTER) && !oldKey.equals(DEFAULT_BANNER) &&
                !oldKey.equals(newKey)) {
            try {
                s3Service.deleteFile(oldKey);
                log.info("Old movie image deleted successfully from S3: {}", oldKey);
            } catch (Exception e) {
                log.warn("Failed to delete old movie image from S3: {}", oldKey, e);
            }
        }
    }
}
package com.devteria.cinemaback_end.movie.service;

import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.movie.dto.BannerRequest;
import com.devteria.cinemaback_end.movie.dto.MovieImageUploadRequest;
import com.devteria.cinemaback_end.movie.dto.MovieRequest;
import com.devteria.cinemaback_end.movie.dto.MovieResponse;
import com.devteria.cinemaback_end.movie.entity.Movie;
import com.devteria.cinemaback_end.movie.mapper.MovieMapper;
import com.devteria.cinemaback_end.movie.repository.MovieRepository;
import com.devteria.cinemaback_end.movie.repository.BannerRepository;
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

    // 🔥 1. INJECT THÊM BANNER SERVICE VÀO ĐÂY
    BannerService bannerService;
    BannerRepository bannerRepository;

    // Hằng số định nghĩa thư mục và ảnh mặc định
    private static final String MOVIE_FOLDER = "movie";
    private static final String DEFAULT_POSTER = "movie/DefaultPoster.png";
    private static final String DEFAULT_BANNER = "movie/DefaultBanner.png";

    /**
     * BƯỚC 1: TẠO PHIM VÀ TỰ ĐỘNG TẠO BANNER ẨN
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

        // 🔥 2. TỰ ĐỘNG TẠO BANNER SAU KHI TẠO PHIM
        try {
            // Lấy tên phim (Chú ý: nếu Entity Movie của bạn dùng trường 'title' thay vì 'name' thì đổi thành savedMovie.getTitle())
            String movieTitle = savedMovie.getTitle();

            BannerRequest autoBannerReq = BannerRequest.builder()
                    .title(movieTitle) // Tên banner trùng tên phim
                    .link("") // Link để trống
                    .displayOrder(0) // Thứ tự mặc định là 0
                    .active(false) // Mặc định không bật
                    .imageUrl(s3Service.buildS3Url(DEFAULT_BANNER)) // Cấp tạm url mặc định để pass validation @NotBlank
                    .build();

            bannerService.createBanner(autoBannerReq);
            log.info("Auto-created inactive banner for movie: {}", movieTitle);
        } catch (Exception e) {
            log.error("Failed to auto-create banner for movie: {}", savedMovie.getId(), e);
        }

        return buildMovieResponse(savedMovie);
    }

    /**
     * BƯỚC 2: UPLOAD ẢNH (Poster & Banner)
     * Đã điều chỉnh để tự động cập nhật link vào bảng Banner
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public MovieResponse uploadMovieImages(String movieId, MovieImageUploadRequest request) {
        Movie movie = getMovieEntity(movieId);

        String oldPosterKey = movie.getPosterUrl();
        String oldBannerKey = movie.getBannerUrl();
        String newPosterKey = oldPosterKey;
        String newBannerKey = oldBannerKey;

        boolean isPosterChanged = false;
        boolean isBannerChanged = false;

        // 1. Cập nhật Poster cho Phim
        if (request.getPosterFile() != null && !request.getPosterFile().isEmpty()) {
            newPosterKey = s3Service.uploadFile(request.getPosterFile(), MOVIE_FOLDER);
            movie.setPosterUrl(newPosterKey);
            isPosterChanged = true;
        }

        // 2. Cập nhật Banner cho Phim VÀ đồng bộ sang bảng Banner
        if (request.getBannerFile() != null && !request.getBannerFile().isEmpty()) {
            newBannerKey = s3Service.uploadFile(request.getBannerFile(), MOVIE_FOLDER);
            movie.setBannerUrl(newBannerKey);
            isBannerChanged = true;

            // 🔥 TỰ ĐỘNG ĐỒNG BỘ SANG BẢNG BANNER
            try {
                String movieTitle = movie.getTitle(); // Hoặc movie.getTitle() tùy entity của bạn
                String fullS3Url = s3Service.buildS3Url(newBannerKey);

                // Tìm banner có tiêu đề trùng tên phim để cập nhật link ảnh mới
                bannerRepository.findByTitle(movieTitle).ifPresent(banner -> {
                    banner.setImageUrl(fullS3Url);
                    bannerRepository.save(banner);
                    log.info("Synced new image URL to Banner table for movie: {}", movieTitle);
                });
            } catch (Exception e) {
                log.error("Failed to sync image to Banner table for movie: {}", movieId, e);
            }
        }

        if (!isPosterChanged && !isBannerChanged) {
            return buildMovieResponse(movie);
        }

        movieRepository.save(movie);

        // Dọn rác ảnh cũ trên S3 (giữ nguyên logic cũ của bạn)
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
        Movie movie = getMovieEntity(id);

        String posterKey = movie.getPosterUrl();
        String bannerKey = movie.getBannerUrl();

        movieRepository.delete(movie);
        log.info("Movie deleted from DB: {}", id);

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

    private MovieResponse buildMovieResponse(Movie movie) {
        MovieResponse response = movieMapper.toMovieResponse(movie);

        String posterKey = (movie.getPosterUrl() != null && !movie.getPosterUrl().isBlank())
                ? movie.getPosterUrl() : DEFAULT_POSTER;

        String bannerKey = (movie.getBannerUrl() != null && !movie.getBannerUrl().isBlank())
                ? movie.getBannerUrl() : DEFAULT_BANNER;

        response.setPosterUrl(s3Service.buildS3Url(posterKey));
        response.setBannerUrl(s3Service.buildS3Url(bannerKey));

        return response;
    }

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
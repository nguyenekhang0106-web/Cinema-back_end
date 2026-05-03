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
import org.springframework.web.multipart.MultipartFile;

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

    private static final String DEFAULT_POSTER = "movie/DefaultPoster.png";
    private static final String DEFAULT_BANNER = "movie/DefaultBanner.png";

    /**
     * Create a new movie with optional poster and banner upload
     * Flow: Map request → Save movie → Upload images (if provided) → Build response with absolute URLs
     * 
     * @param request MovieRequest containing movie info and optional posterFile/bannerFile
     * @return MovieResponse with absolute image URLs
     */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public MovieResponse createMovie(MovieRequest request) {
        // 1. Get current user (manager) from security context
        var context = SecurityContextHolder.getContext();
        String currentEmail = context.getAuthentication().getName();

        User manager = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // 2. Map request to movie entity and set manager
        Movie movie = movieMapper.toMovie(request);
        movie.setManager(manager);

        // Save movie first to get ID for image naming
        Movie savedMovie = movieRepository.save(movie);
        log.info("Movie created: {}", savedMovie.getId());

        // 3. Upload images if provided (optional fields)
        if (request.getPosterFile() != null && !request.getPosterFile().isEmpty()) {
            String posterKey = uploadMovieImage(savedMovie.getId(), request.getPosterFile(), "POSTER");
            savedMovie.setPosterUrl(posterKey);
            log.info("Poster uploaded for movie: {}", savedMovie.getId());
        }

        if (request.getBannerFile() != null && !request.getBannerFile().isEmpty()) {
            String bannerKey = uploadMovieImage(savedMovie.getId(), request.getBannerFile(), "BANNER");
            savedMovie.setBannerUrl(bannerKey);
            log.info("Banner uploaded for movie: {}", savedMovie.getId());
        }

        // 4. Save movie with image URLs
        savedMovie = movieRepository.save(savedMovie);

        return buildMovieResponseWithAbsoluteUrls(savedMovie);
    }

    // Danh sách phim thường là Public, ai cũng xem được nên không cần @PreAuthorize
    public List<MovieResponse> getAllMovies() {
        log.info("Fetching all movies");
        return movieRepository.findAll().stream()
                .map(this::buildMovieResponseWithAbsoluteUrls)
                .toList();
    }

    public MovieResponse getMovie(String id) {
        log.info("Fetching movie with id: {}", id);
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MOVIE_NOT_EXISTED)); // Dùng Exception chuẩn
        return buildMovieResponseWithAbsoluteUrls(movie);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public MovieResponse updateMovie(String id, MovieRequest request) {
        log.info("Updating movie with id: {}", id);

        // 1. Kiểm tra xem phim có tồn tại không
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.MOVIE_NOT_EXISTED));

        // 2. Map dữ liệu mới từ request vào entity movie đang có
        movieMapper.updateMovie(movie, request);

        // 3. Handle image uploads if provided
        if (request.getPosterFile() != null && !request.getPosterFile().isEmpty()) {
            String oldPosterKey = movie.getPosterUrl();
            String newPosterKey = uploadMovieImage(id, request.getPosterFile(), "POSTER");
            movie.setPosterUrl(newPosterKey);

            // Delete old poster if exists and not default
            if (oldPosterKey != null && !oldPosterKey.isEmpty() && !isDefaultImage(oldPosterKey)) {
                try {
                    s3Service.deleteFile(oldPosterKey);
                    log.info("Old poster deleted: {}", oldPosterKey);
                } catch (Exception e) {
                    log.warn("Failed to delete old poster: {}", oldPosterKey);
                }
            }
        }

        if (request.getBannerFile() != null && !request.getBannerFile().isEmpty()) {
            String oldBannerKey = movie.getBannerUrl();
            String newBannerKey = uploadMovieImage(id, request.getBannerFile(), "BANNER");
            movie.setBannerUrl(newBannerKey);

            // Delete old banner if exists and not default
            if (oldBannerKey != null && !oldBannerKey.isEmpty() && !isDefaultImage(oldBannerKey)) {
                try {
                    s3Service.deleteFile(oldBannerKey);
                    log.info("Old banner deleted: {}", oldBannerKey);
                } catch (Exception e) {
                    log.warn("Failed to delete old banner: {}", oldBannerKey);
                }
            }
        }

        // 4. Lưu xuống DB và trả về response với absolute URLs
        Movie updatedMovie = movieRepository.save(movie);
        return buildMovieResponseWithAbsoluteUrls(updatedMovie);
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

    /**
     * Internal method to upload a single movie image (poster or banner)
     * Standardizes folder and filename automatically - backend controls naming
     *
     * @param movieId Movie ID
     * @param file MultipartFile to upload
     * @param imageType "POSTER" or "BANNER"
     * @return S3 key (e.g., "movie/movie{id}poster.jpg")
     */
    private String uploadMovieImage(String movieId, MultipartFile file, String imageType) {
        // 1. Standardize folder (always "movie")
        String folder = "movie";

        // 2. Upload file to S3 (S3Service sẽ tự lo việc tạo tên file an toàn bằng UUID)
        // CÚ PHÁP MỚI: Chỉ truyền 2 tham số
        String imageKey = s3Service.uploadFile(file, folder);

        log.info("Movie image uploaded: type={}, movieId={}, key={}", imageType, movieId, imageKey);

        return imageKey;
    }

    /**
     * Upload poster or banner image for movie (separate endpoint)
     *
     * @param movieId Movie ID
     * @param request Image upload request containing file and imageType
     * @return Absolute S3 URL of new image
     */
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public String uploadMovieImageViaApi(String movieId, MovieImageUploadRequest request) {
        // 1. Find movie
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new AppException(ErrorCode.MOVIE_NOT_EXISTED));

        String imageType = request.getImageType().toString();
        String oldImageKey = imageType.equals("POSTER") ? movie.getPosterUrl() : movie.getBannerUrl();

        // 2. Upload using internal method
        String newImageKey = uploadMovieImage(movieId, request.getFile(), imageType);

        // 3. Update database
        if (imageType.equals("POSTER")) {
            movie.setPosterUrl(newImageKey);
        } else if (imageType.equals("BANNER")) {
            movie.setBannerUrl(newImageKey);
        }
        movieRepository.save(movie);

        // 4. Delete old image if exists
        if (oldImageKey != null && !oldImageKey.isEmpty() && !isDefaultImage(oldImageKey)) {
            if (!oldImageKey.equals(newImageKey)) {
                try {
                    s3Service.deleteFile(oldImageKey);
                    log.info("Old {} deleted: {}", imageType.toLowerCase(), oldImageKey);
                } catch (Exception e) {
                    log.warn("Failed to delete old {}: {}", imageType.toLowerCase(), oldImageKey);
                }
            }
        }

        return s3Service.buildS3Url(newImageKey);
    }

    /**
     * Get movie with absolute image URLs
     *
     * @param movieId Movie ID
     * @return MovieResponse with absolute S3 URLs
     */
    public MovieResponse getMovieWithImages(String movieId) {
        log.info("Fetching movie with id: {}", movieId);
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new AppException(ErrorCode.MOVIE_NOT_EXISTED));
        return buildMovieResponseWithAbsoluteUrls(movie);
    }

    /**
     * Build MovieResponse with absolute image URLs
     *
     * @param movie Movie entity
     * @return MovieResponse with absolute S3 URLs
     */
    public MovieResponse buildMovieResponseWithAbsoluteUrls(Movie movie) {
        MovieResponse response = movieMapper.toMovieResponse(movie);
        String absolutePosterUrl = s3Service.buildS3Url(movie.getPosterUrl());
        String absoluteBannerUrl = s3Service.buildS3Url(movie.getBannerUrl());
        response.setPosterUrl(absolutePosterUrl);
        response.setBannerUrl(absoluteBannerUrl);
        return response;
    }

    /**
     * Check if image is a default image
     *
     * @param imageKey S3 image key
     * @return True if image is default
     */
    private boolean isDefaultImage(String imageKey) {
        return imageKey.equals(DEFAULT_POSTER) || imageKey.equals(DEFAULT_BANNER);
    }
}
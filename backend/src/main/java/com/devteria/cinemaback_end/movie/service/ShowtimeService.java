package com.devteria.cinemaback_end.movie.service;

import com.devteria.cinemaback_end.cinema.entity.Hall;
import com.devteria.cinemaback_end.cinema.repository.HallRepository;
import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import com.devteria.cinemaback_end.movie.dto.ShowtimeRequest;
import com.devteria.cinemaback_end.movie.dto.ShowtimeResponse;
import com.devteria.cinemaback_end.movie.entity.Movie;
import com.devteria.cinemaback_end.movie.entity.Showtime;
import com.devteria.cinemaback_end.movie.entity.enums.ShowtimeStatus;
import com.devteria.cinemaback_end.movie.mapper.ShowtimeMapper;
import com.devteria.cinemaback_end.movie.repository.MovieRepository;
import com.devteria.cinemaback_end.movie.repository.ShowtimeRepository;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ShowtimeService {

    ShowtimeRepository showtimeRepository;
    MovieRepository movieRepository;
    HallRepository hallRepository;
    ShowtimeMapper showtimeMapper;
    UserRepository userRepository;

    // --- 1. CREATE ---
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ShowtimeResponse createShowtime(ShowtimeRequest request) {
        if (request.getStartTime().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.START_TIME_IN_PAST);
        }

        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new AppException(ErrorCode.MOVIE_NOT_EXISTED));

        Hall hall = hallRepository.findById(request.getHallId())
                .orElseThrow(() -> new AppException(ErrorCode.HALL_NOT_EXISTED));

        var context = SecurityContextHolder.getContext();
        String currentEmail = context.getAuthentication().getName();
        User manager = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Integer duration = movie.getDurationMin();
        LocalDateTime calculatedEndTime = request.getStartTime().plusMinutes(duration + 15);

        if (showtimeRepository.existsOverlappingShowtime(hall.getId(), request.getStartTime(), calculatedEndTime)) {
            throw new AppException(ErrorCode.SHOWTIME_OVERLAP);
        }

        Showtime showtime = showtimeMapper.toShowtime(request);
        showtime.setEndTime(calculatedEndTime);
        showtime.setStatus(ShowtimeStatus.SCHEDULED);
        showtime.setMovie(movie);
        showtime.setHall(hall);
        showtime.setManager(manager);

        return showtimeMapper.toShowtimeResponse(showtimeRepository.save(showtime));
    }

    // --- 2. READ (Public) - CÓ LAZY UPDATE COMPLETED ---
    public List<ShowtimeResponse> getAllShowtimes() {
        List<Showtime> showtimes = showtimeRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        // Cập nhật trạng thái COMPLETED tự động khi thời gian hiện tại qua endTime
        List<Showtime> updatedShowtimes = showtimes.stream().peek(showtime -> {
            if (showtime.getStatus() == ShowtimeStatus.SCHEDULED && now.isAfter(showtime.getEndTime())) {
                showtime.setStatus(ShowtimeStatus.COMPLETED);
                showtimeRepository.save(showtime); // Lưu cập nhật xuống DB
            }
        }).toList();

        return updatedShowtimes.stream()
                .map(showtimeMapper::toShowtimeResponse)
                .toList();
    }

    // --- 3. READ BY ID (Public) - CÓ LAZY UPDATE COMPLETED ---
    public ShowtimeResponse getShowtimeById(String id) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SHOWTIME_NOT_EXISTED));

        // Cập nhật trạng thái nếu truy vấn chi tiết 1 lịch chiếu đã qua giờ kết thúc
        if (showtime.getStatus() == ShowtimeStatus.SCHEDULED && LocalDateTime.now().isAfter(showtime.getEndTime())) {
            showtime.setStatus(ShowtimeStatus.COMPLETED);
            showtimeRepository.save(showtime);
        }

        return showtimeMapper.toShowtimeResponse(showtime);
    }

    // --- 4. UPDATE ---
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ShowtimeResponse updateShowtime(String id, ShowtimeRequest request) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SHOWTIME_NOT_EXISTED));

        if (showtime.getStatus() != ShowtimeStatus.SCHEDULED) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (request.getStartTime().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.START_TIME_IN_PAST);
        }

        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new AppException(ErrorCode.MOVIE_NOT_EXISTED));

        Hall hall = hallRepository.findById(request.getHallId())
                .orElseThrow(() -> new AppException(ErrorCode.HALL_NOT_EXISTED));

        Integer duration = movie.getDurationMin();
        LocalDateTime calculatedEndTime = request.getStartTime().plusMinutes(duration + 15);

        if (showtimeRepository.existsOverlappingShowtimeForUpdate(hall.getId(), request.getStartTime(), calculatedEndTime, id)) {
            throw new AppException(ErrorCode.SHOWTIME_OVERLAP);
        }

        showtimeMapper.updateShowtime(showtime, request);
        showtime.setEndTime(calculatedEndTime);
        showtime.setMovie(movie);
        showtime.setHall(hall);

        return showtimeMapper.toShowtimeResponse(showtimeRepository.save(showtime));
    }

    // --- 5. CANCEL ---
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void cancelShowtime(String id) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SHOWTIME_NOT_EXISTED));

        if (showtime.getStartTime().isBefore(LocalDateTime.now()) && showtime.getStatus() != ShowtimeStatus.SCHEDULED) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        showtime.setStatus(ShowtimeStatus.CANCELLED);
        showtimeRepository.save(showtime);
    }

    // --- 6. DELETE (Chuyển thành Soft Delete) ---
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public void deleteShowtime(String id) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SHOWTIME_NOT_EXISTED));

        // Đã sửa: Không xóa cứng khỏi DB, chỉ đổi Status thành CANCELLED
        showtime.setStatus(ShowtimeStatus.CANCELLED);
        showtimeRepository.save(showtime);
    }
}
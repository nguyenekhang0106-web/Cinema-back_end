package com.devteria.cinemaback_end.movie.service;

import com.devteria.cinemaback_end.cinema.entity.Hall;
import com.devteria.cinemaback_end.cinema.repository.HallRepository;
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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShowtimeService {
    private final ShowtimeRepository showtimeRepository;
    private final ShowtimeMapper showtimeMapper;
    private final MovieRepository movieRepository;
    private final HallRepository hallRepository;
    private final UserRepository userRepository;

    public ShowtimeResponse createShowtime(ShowtimeRequest request) {
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Phim"));
        Hall hall = hallRepository.findById(request.getHallId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Phòng chiếu"));

        Showtime showtime = showtimeMapper.toShowtime(request);
        showtime.setMovie(movie);
        showtime.setHall(hall);
        showtime.setStatus(ShowtimeStatus.SCHEDULED); // Trạng thái mặc định

        if (request.getManagerId() != null) {
            User manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Quản lý"));
            showtime.setManager(manager);
        }

        return showtimeMapper.toShowtimeResponse(showtimeRepository.save(showtime));
    }

    public List<ShowtimeResponse> getShowtimesByMovie(String movieId) {
        return showtimeRepository.findByMovieId(movieId).stream()
                .map(showtimeMapper::toShowtimeResponse).toList();
    }
}

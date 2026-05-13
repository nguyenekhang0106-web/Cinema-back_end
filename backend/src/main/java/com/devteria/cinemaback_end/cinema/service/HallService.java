package com.devteria.cinemaback_end.cinema.service;

import com.devteria.cinemaback_end.cinema.dto.HallRequest;
import com.devteria.cinemaback_end.cinema.dto.HallResponse;
import com.devteria.cinemaback_end.cinema.entity.Cinema;
import com.devteria.cinemaback_end.cinema.entity.Hall;
import com.devteria.cinemaback_end.cinema.mapper.HallMapper;
import com.devteria.cinemaback_end.cinema.repository.CinemaRepository;
import com.devteria.cinemaback_end.cinema.repository.HallRepository;
import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class HallService {

    HallRepository hallRepository;
    CinemaRepository cinemaRepository;
    HallMapper hallMapper;

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public HallResponse createHall(HallRequest request) {
        Cinema cinema = cinemaRepository.findById(request.getCinemaId())
                .orElseThrow(() -> new AppException(ErrorCode.CINEMA_NOT_EXISTED));

        if (hallRepository.existsByNameAndCinema_Id(request.getName(), cinema.getId())) {
            throw new AppException(ErrorCode.HALL_ALREADY_EXISTED);
        }

        Hall hall = hallMapper.toHall(request);
        hall.setCinema(cinema);
        // 🔥 ĐẢM BẢO TỔNG SỐ GHẾ LÀ 0 KHI MỚI TẠO
        hall.setTotalSeats(0);

        return hallMapper.toHallResponse(hallRepository.save(hall));
    }

    public List<HallResponse> getAllHalls() {
        return hallRepository.findAll().stream()
                .map(hallMapper::toHallResponse)
                .toList();
    }

    public List<HallResponse> getHallsByCinema(String cinemaId) {
        return hallRepository.findByCinemaId(cinemaId).stream()
                .map(hallMapper::toHallResponse)
                .toList();
    }

    public HallResponse getHallById(String id) {
        Hall hall = hallRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.HALL_NOT_EXISTED));
        return hallMapper.toHallResponse(hall);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public HallResponse updateHall(String id, HallRequest request) {
        Hall hall = hallRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.HALL_NOT_EXISTED));

        if (hallRepository.existsByNameAndCinema_IdAndIdNot(request.getName(), request.getCinemaId(), id)) {
            throw new AppException(ErrorCode.HALL_ALREADY_EXISTED);
        }

        Cinema cinema = cinemaRepository.findById(request.getCinemaId())
                .orElseThrow(() -> new AppException(ErrorCode.CINEMA_NOT_EXISTED));

        hallMapper.updateHall(hall, request);
        hall.setCinema(cinema);
        // Lưu ý: Không update lại totalSeats ở đây, vì totalSeats do SeatService quản lý

        return hallMapper.toHallResponse(hallRepository.save(hall));
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteHall(String id) {
        if (!hallRepository.existsById(id)) {
            throw new AppException(ErrorCode.HALL_NOT_EXISTED);
        }

        try {
            hallRepository.deleteById(id);
        } catch (DataIntegrityViolationException e) {
            throw new AppException(ErrorCode.HALL_HAS_DEPENDENCIES);
        }
    }
}
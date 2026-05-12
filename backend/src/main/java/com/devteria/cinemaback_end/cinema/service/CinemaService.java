package com.devteria.cinemaback_end.cinema.service;

import com.devteria.cinemaback_end.cinema.dto.CinemaRequest;
import com.devteria.cinemaback_end.cinema.dto.CinemaResponse;
import com.devteria.cinemaback_end.cinema.entity.Cinema;
import com.devteria.cinemaback_end.cinema.mapper.CinemaMapper;
import com.devteria.cinemaback_end.cinema.repository.CinemaRepository;
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
public class CinemaService {

    CinemaRepository cinemaRepository;
    CinemaMapper cinemaMapper;

    // --- 1. CREATE ---
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public CinemaResponse createCinema(CinemaRequest request) {
        if (cinemaRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.CINEMA_ALREADY_EXISTED);
        }

        Cinema cinema = cinemaMapper.toCinema(request);
        return cinemaMapper.toCinemaResponse(cinemaRepository.save(cinema));
    }

    // --- 2. READ (Get All - Public) ---
    public List<CinemaResponse> getAllCinemas() {
        return cinemaRepository.findAll().stream()
                .map(cinemaMapper::toCinemaResponse)
                .toList();
    }

    // --- 3. READ (Get By ID - Public) ---
    public CinemaResponse getCinemaById(String id) {
        Cinema cinema = cinemaRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CINEMA_NOT_EXISTED));
        return cinemaMapper.toCinemaResponse(cinema);
    }

    // --- 4. UPDATE ---
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public CinemaResponse updateCinema(String id, CinemaRequest request) {
        Cinema cinema = cinemaRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CINEMA_NOT_EXISTED));

        // Kiểm tra trùng tên nhưng loại trừ chính rạp đang sửa
        if (cinemaRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new AppException(ErrorCode.CINEMA_ALREADY_EXISTED);
        }

        cinemaMapper.updateCinema(cinema, request);
        return cinemaMapper.toCinemaResponse(cinemaRepository.save(cinema));
    }

    // --- 5. DELETE ---
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteCinema(String id) {
        if (!cinemaRepository.existsById(id)) {
            throw new AppException(ErrorCode.CINEMA_NOT_EXISTED);
        }

        try {
            cinemaRepository.deleteById(id);
        } catch (DataIntegrityViolationException e) {
            // 🔥 BẮT LỖI KHÓA NGOẠI KHI RẠP ĐÃ CÓ PHÒNG CHIẾU/LỊCH CHIẾU
            throw new AppException(ErrorCode.CINEMA_HAS_DEPENDENCIES);
        }
    }
}
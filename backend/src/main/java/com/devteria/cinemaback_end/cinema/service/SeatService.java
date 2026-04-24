package com.devteria.cinemaback_end.cinema.service;

import com.devteria.cinemaback_end.cinema.dto.SeatBatchRequest;
import com.devteria.cinemaback_end.cinema.dto.SeatRequest;
import com.devteria.cinemaback_end.cinema.dto.SeatResponse;
import com.devteria.cinemaback_end.cinema.entity.Hall;
import com.devteria.cinemaback_end.cinema.entity.Seat;
import com.devteria.cinemaback_end.cinema.mapper.SeatMapper;
import com.devteria.cinemaback_end.cinema.repository.HallRepository;
import com.devteria.cinemaback_end.cinema.repository.SeatRepository;
import com.devteria.cinemaback_end.exception.AppException;
import com.devteria.cinemaback_end.exception.ErrorCode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SeatService {

    SeatRepository seatRepository;
    HallRepository hallRepository;
    SeatMapper seatMapper;

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public SeatResponse createSeat(SeatRequest request) {
        Hall hall = hallRepository.findById(request.getHallId())
                .orElseThrow(() -> new AppException(ErrorCode.HALL_NOT_EXISTED));

        if (seatRepository.existsByRowNameAndNumberAndHall_Id(
                request.getRowName(), request.getNumber(), hall.getId())) {
            throw new AppException(ErrorCode.SEAT_ALREADY_EXISTED);
        }

        Seat seat = seatMapper.toSeat(request);
        seat.setHall(hall);

        // Nếu request có status thì dùng, không thì mặc định AVAILABLE
        if (request.getStatus() != null) seat.setStatus(request.getStatus());

        return seatMapper.toSeatResponse(seatRepository.save(seat));
    }

    // Lấy sơ đồ ghế của một phòng chiếu (Public)
    public List<SeatResponse> getSeatsByHall(String hallId) {
        if (!hallRepository.existsById(hallId)) {
            throw new AppException(ErrorCode.HALL_NOT_EXISTED);
        }
        return seatRepository.findAllByHallIdOrderByRowNameAscNumberAsc(hallId).stream()
                .map(seatMapper::toSeatResponse)
                .toList();
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public SeatResponse updateSeat(String id, SeatRequest request) {
        Seat seat = seatRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SEAT_NOT_EXISTED));

        if (seatRepository.existsByRowNameAndNumberAndHall_IdAndIdNot(
                request.getRowName(), request.getNumber(), request.getHallId(), id)) {
            throw new AppException(ErrorCode.SEAT_ALREADY_EXISTED);
        }

        Hall hall = hallRepository.findById(request.getHallId())
                .orElseThrow(() -> new AppException(ErrorCode.HALL_NOT_EXISTED));

        seatMapper.updateSeat(seat, request);
        seat.setHall(hall);
        if (request.getStatus() != null) seat.setStatus(request.getStatus());

        return seatMapper.toSeatResponse(seatRepository.save(seat));
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteSeat(String id) {
        if (!seatRepository.existsById(id)) {
            throw new AppException(ErrorCode.SEAT_NOT_EXISTED);
        }
        seatRepository.deleteById(id);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public List<SeatResponse> createSeatsInBatch(SeatBatchRequest request) {
        Hall hall = hallRepository.findById(request.getHallId())
                .orElseThrow(() -> new AppException(ErrorCode.HALL_NOT_EXISTED));

        List<Seat> seatsToSave = new ArrayList<>();

        // Lặp qua từng tên hàng (A, B, C...)
        for (String row : request.getRowNames()) {
            // Lặp từ ghế số 1 đến số ghế tối đa trong hàng
            for (int i = 1; i <= request.getSeatsPerRow(); i++) {

                // Chỉ tạo nếu ghế đó chưa tồn tại để tránh lỗi Unique Constraint
                if (!seatRepository.existsByRowNameAndNumberAndHall_Id(row, i, hall.getId())) {
                    Seat seat = Seat.builder()
                            .rowName(row)
                            .number(i)
                            .type(request.getType())
                            .status(com.devteria.cinemaback_end.cinema.entity.enums.SeatStatus.AVAILABLE)
                            .hall(hall)
                            .build();
                    seatsToSave.add(seat);
                }
            }
        }

        // Lưu toàn bộ danh sách ghế vào DB cùng 1 lúc
        List<Seat> savedSeats = seatRepository.saveAll(seatsToSave);

        // Map sang Response và trả về
        return savedSeats.stream()
                .map(seatMapper::toSeatResponse)
                .toList();
    }
}
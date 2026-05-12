package com.devteria.cinemaback_end.cinema.service;

import com.devteria.cinemaback_end.cinema.dto.SeatBatchRequest;
import com.devteria.cinemaback_end.cinema.dto.SeatRequest;
import com.devteria.cinemaback_end.cinema.dto.SeatResponse;
import com.devteria.cinemaback_end.cinema.entity.Hall;
import com.devteria.cinemaback_end.cinema.entity.Seat;
import com.devteria.cinemaback_end.cinema.entity.enums.SeatType;
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

    // 🔥 HÀM HỖ TRỢ ĐỘC QUYỀN: Tự động đếm và cộng dồn sức chứa chuẩn xác 100%
    private void updateTotalSeats(Hall hall) {
        List<Seat> seats = seatRepository.findAllByHallIdOrderByRowNameAscNumberAsc(hall.getId());
        int totalCapacity = 0;

        for (Seat seat : seats) {
            if (seat.getType() == SeatType.SWEETBOX) {
                totalCapacity += 2; // Ghế Couple tính là 2 chỗ
            } else {
                totalCapacity += 1; // Ghế Thường / VIP tính là 1 chỗ
            }
        }

        // Cập nhật lại tổng sức chứa vào DB của Phòng chiếu
        hall.setTotalSeats(totalCapacity);
        hallRepository.save(hall);
    }

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

        if (request.getStatus() != null) seat.setStatus(request.getStatus());

        Seat savedSeat = seatRepository.save(seat);
        seatRepository.flush(); // Ép lưu xuống DB ngay lập tức
        updateTotalSeats(hall); // Tính lại tổng số chỗ

        return seatMapper.toSeatResponse(savedSeat);
    }

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

        Seat savedSeat = seatRepository.save(seat);
        seatRepository.flush();

        // 🔥 Nếu Admin vừa edit đổi 1 ghế Thường thành ghế Couple -> Tổng sức chứa tự động +1
        updateTotalSeats(hall);

        return seatMapper.toSeatResponse(savedSeat);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteSeat(String id) {
        Seat seat = seatRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SEAT_NOT_EXISTED));
        Hall hall = seat.getHall();

        seatRepository.deleteById(id);
        seatRepository.flush(); // Ép xóa ngay khỏi phiên (Session)

        // 🔥 Nếu Admin vừa xóa 1 ghế khỏi sơ đồ -> Tổng sức chứa tự động giảm đi
        updateTotalSeats(hall);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteAllSeatsByHall(String hallId) {
        Hall hall = hallRepository.findById(hallId)
                .orElseThrow(() -> new AppException(ErrorCode.HALL_NOT_EXISTED));

        List<Seat> seatsToDelete = seatRepository.findAllByHallIdOrderByRowNameAscNumberAsc(hallId);

        if (!seatsToDelete.isEmpty()) {
            seatRepository.deleteAll(seatsToDelete);

            // Đã xóa sạch thì sức chứa trả về 0
            hall.setTotalSeats(0);
            hallRepository.save(hall);
        }
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public List<SeatResponse> createSeatsInBatch(SeatBatchRequest request) {
        Hall hall = hallRepository.findById(request.getHallId())
                .orElseThrow(() -> new AppException(ErrorCode.HALL_NOT_EXISTED));

        List<Seat> seatsToSave = new ArrayList<>();

        int standardAndVipRows = request.getRowCount();
        int seatsPerRow = request.getSeatsPerRow();
        int coupleCount = request.getCoupleSeatCount();

        // 1. TẠO LÔ GHẾ STANDARD VÀ VIP
        for (int r = 0; r < standardAndVipRows; r++) {
            String rowName = String.valueOf((char) ('A' + r));
            SeatType type = (r < 4) ? SeatType.STANDARD : SeatType.VIP;

            for (int c = 1; c <= seatsPerRow; c++) {
                if (!seatRepository.existsByRowNameAndNumberAndHall_Id(rowName, c, hall.getId())) {
                    Seat seat = Seat.builder()
                            .rowName(rowName)
                            .number(c)
                            .type(type)
                            .status(com.devteria.cinemaback_end.cinema.entity.enums.SeatStatus.AVAILABLE)
                            .hall(hall)
                            .build();
                    seatsToSave.add(seat);
                }
            }
        }

        // 2. TẠO LÔ GHẾ COUPLE
        int maxCouplePerRow = Math.max(1, seatsPerRow / 2);

        for (int i = 0; i < coupleCount; i++) {
            int coupleRowOffset = i / maxCouplePerRow;
            int seatNumber = (i % maxCouplePerRow) + 1;

            String rowName = String.valueOf((char) ('A' + standardAndVipRows + coupleRowOffset));

            if (!seatRepository.existsByRowNameAndNumberAndHall_Id(rowName, seatNumber, hall.getId())) {
                Seat seat = Seat.builder()
                        .rowName(rowName)
                        .number(seatNumber)
                        .type(SeatType.SWEETBOX)
                        .status(com.devteria.cinemaback_end.cinema.entity.enums.SeatStatus.AVAILABLE)
                        .hall(hall)
                        .build();
                seatsToSave.add(seat);
            }
        }

        List<Seat> savedSeats = seatRepository.saveAll(seatsToSave);
        seatRepository.flush(); // Đẩy toàn bộ ghế mới tạo xuống CSDL

        // 3. Gọi hàm tự động quét DB để tính lại tổng sức chứa chuẩn xác nhất
        updateTotalSeats(hall);

        return savedSeats.stream().map(seatMapper::toSeatResponse).toList();
    }
}
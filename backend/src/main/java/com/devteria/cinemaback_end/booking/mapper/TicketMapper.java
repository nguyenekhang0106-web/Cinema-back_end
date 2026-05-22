package com.devteria.cinemaback_end.booking.mapper;

import com.devteria.cinemaback_end.booking.dto.TicketResponse;
import com.devteria.cinemaback_end.booking.entity.Ticket;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TicketMapper {

    // Lấy thông tin từ object Seat lồng bên trong để in lên vé
    @Mapping(target = "seatId", source = "seat.id")
    @Mapping(target = "seatRowName", source = "seat.rowName")
    @Mapping(target = "seatNumber", source = "seat.number")
    @Mapping(target = "seatType", source = "seat.type")

    // 🔥 BỔ SUNG: Lấy thông tin Phim, Rạp và Giờ chiếu từ object Showtime lồng bên trong
    @Mapping(target = "movieTitle", source = "showtime.movie.title")
    @Mapping(target = "cinemaName", source = "showtime.hall.cinema.name")
    @Mapping(target = "showtimeTime", source = "showtime.startTime")
    TicketResponse toTicketResponse(Ticket ticket);
}
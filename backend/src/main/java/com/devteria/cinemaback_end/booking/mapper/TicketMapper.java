package com.devteria.cinemaback_end.booking.mapper;

import com.devteria.cinemaback_end.booking.dto.TicketResponse;
import com.devteria.cinemaback_end.booking.entity.Ticket;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TicketMapper {

    // Lấy thông tin từ object Seat lồng bên trong để in lên vé
    @Mapping(source = "seat.id", target = "seatId")
    @Mapping(source = "seat.rowName", target = "seatRowName")
    @Mapping(source = "seat.number", target = "seatNumber")
    @Mapping(source = "seat.type", target = "seatType")
    TicketResponse toTicketResponse(Ticket ticket);
}
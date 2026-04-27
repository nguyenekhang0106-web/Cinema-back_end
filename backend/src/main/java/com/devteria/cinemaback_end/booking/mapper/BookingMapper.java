package com.devteria.cinemaback_end.booking.mapper;

import com.devteria.cinemaback_end.booking.dto.BookingResponse;
import com.devteria.cinemaback_end.booking.entity.Booking;
import com.devteria.cinemaback_end.booking.entity.Ticket;
import com.devteria.cinemaback_end.concession.entity.BookingConcession;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = "spring")
public interface BookingMapper {

    @Mapping(source = "customer.fullName", target = "customerName")
    @Mapping(source = "tickets", target = "movieTitle", qualifiedByName = "getMovieTitle")
    @Mapping(source = "tickets", target = "cinemaName", qualifiedByName = "getCinemaName")
    @Mapping(source = "tickets", target = "hallName", qualifiedByName = "getHallName")
    @Mapping(source = "tickets", target = "showTimeStart", qualifiedByName = "getShowTimeStart")
    @Mapping(source = "tickets", target = "seatNames", qualifiedByName = "mapSeatNames")
    @Mapping(source = "concessions", target = "concessionDetails", qualifiedByName = "mapConcessionDetails")
    BookingResponse toBookingResponse(Booking booking);

    @Named("mapSeatNames")
    default List<String> mapSeatNames(List<Ticket> tickets) {
        return tickets.stream()
                .map(t -> t.getSeat().getRowName() + t.getSeat().getNumber())
                .toList();
    }

    @Named("mapConcessionDetails")
    default List<String> mapConcessionDetails(List<BookingConcession> concessions) {
        return concessions.stream()
                .map(c -> c.getQuantity() + "x " + c.getItem().getName())
                .toList();
    }

    @Named("getMovieTitle")
    default String getMovieTitle(List<Ticket> tickets) {
        return tickets.isEmpty() ? "" : tickets.get(0).getShowtime().getMovie().getTitle();
    }

    @Named("getCinemaName")
    default String getCinemaName(List<Ticket> tickets) {
        return tickets.isEmpty() ? "" : tickets.get(0).getShowtime().getHall().getCinema().getName();
    }

    @Named("getHallName")
    default String getHallName(List<Ticket> tickets) {
        return tickets.isEmpty() ? "" : tickets.get(0).getShowtime().getHall().getName();
    }

    @Named("getShowTimeStart")
    default java.time.LocalDateTime getShowTimeStart(List<Ticket> tickets) {
        return tickets.isEmpty() ? null : tickets.get(0).getShowtime().getStartTime();
    }
}
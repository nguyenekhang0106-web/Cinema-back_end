package com.devteria.cinemaback_end.concession.repository;

import com.devteria.cinemaback_end.concession.entity.BookingConcession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingConcessionRepository extends JpaRepository<BookingConcession, String> {

    @Query("""
        select
            i.id,
            i.name,
            i.category,
            bc.price,
            sum(bc.quantity),
            sum(bc.quantity * bc.price)
        from BookingConcession bc
        join bc.item i
        join bc.booking b
        where (b.bookingDate >= :startDate)
          and (b.bookingDate < :endDate)
          and (:cinemaId = '' or exists (
              select 1 from Ticket t
              join t.showtime s
              join s.hall h
              join h.cinema c
              where t.booking = b and c.id = :cinemaId
          ))
        group by i.id, i.name, i.category, bc.price
        order by sum(bc.quantity * bc.price) desc
    """)
    List<Object[]> getConcessionSalesRaw(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("cinemaId") String cinemaId
    );

    @Query("""
        select
            i.category,
            sum(bc.quantity * bc.price)
        from BookingConcession bc
        join bc.item i
        join bc.booking b
        where (b.bookingDate >= :startDate)
          and (b.bookingDate < :endDate)
          and (:cinemaId = '' or exists (
              select 1 from Ticket t
              join t.showtime s
              join s.hall h
              join h.cinema c
              where t.booking = b and c.id = :cinemaId
          ))
        group by i.category
    """)
    List<Object[]> getCategoryRevenueRaw(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("cinemaId") String cinemaId
    );
}
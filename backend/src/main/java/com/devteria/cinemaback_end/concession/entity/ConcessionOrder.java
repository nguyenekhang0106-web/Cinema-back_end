package com.devteria.cinemaback_end.concession.entity;

import com.devteria.cinemaback_end.booking.entity.Booking;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@IdClass(ConcessionOrderId.class)
public class ConcessionOrder {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    ConcessionItem item;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    Booking booking;

    Integer quantity;
    Double subTotal;
}

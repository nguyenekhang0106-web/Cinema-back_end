package com.devteria.cinemaback_end.concession.entity;

import lombok.*;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ConcessionOrderId implements Serializable {
    private String item;
    private String booking;
}
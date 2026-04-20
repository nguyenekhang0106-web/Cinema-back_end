package com.devteria.cinemaback_end.concession.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConcessionItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id; // itemId

    String name;
    String description;
    Double price;
}

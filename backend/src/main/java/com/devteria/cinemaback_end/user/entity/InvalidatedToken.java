package com.devteria.cinemaback_end.user.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Date;

@Getter
@Setter
@NoArgsConstructor // Bắt buộc phải có để Spring đọc được JSON
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE) // Bỏ makeFinal = true
@Entity
public class InvalidatedToken {
    @Id
    String id;
    Date expiryTime;
}

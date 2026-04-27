package com.devteria.cinemaback_end.concession.entity;

import com.devteria.cinemaback_end.concession.entity.enums.ConcessionCategory;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Getter // Tuyệt đối dùng @Getter/@Setter thay cho @Data ở Entity
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConcessionItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false, unique = true)
    String name;

    String description;

    @Column(nullable = false)
    Double price;

    String imageUrl; // Link ảnh hiển thị lên UI

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    ConcessionCategory category;

    @Builder.Default
    boolean active = true; // Bỏ chữ "is"
}
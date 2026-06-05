package com.devteria.cinemaback_end.chat.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false)
    String roomId; // Dùng userId của khách hàng làm roomId

    @Column(nullable = false)
    String senderId; // ID của người gửi (Khách hàng hoặc Admin)

    @Column(nullable = false)
    String senderName; // Tên hiển thị (ví dụ: "Khách", "Admin")

    @Column(columnDefinition = "TEXT", nullable = false)
    String content; // Nội dung tin nhắn

    @Builder.Default
    LocalDateTime timestamp = LocalDateTime.now();
}
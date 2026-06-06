package com.devteria.cinemaback_end.chat.entity;

import com.devteria.cinemaback_end.chat.entity.enums.MessageType;
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
    String roomId;

    @Column(nullable = false)
    String senderId;

    @Column(nullable = false)
    String senderName;

    @Column(columnDefinition = "TEXT", nullable = false)
    String content;

    @Builder.Default
    LocalDateTime timestamp = LocalDateTime.now();

    @Column(nullable = false)
    String senderRole; // USER / ADMIN

    String avatarUrl;
    String imageUrl;

    @Enumerated(EnumType.STRING)
    private MessageType messageType;

    @Builder.Default
    boolean adminRead = false;
}

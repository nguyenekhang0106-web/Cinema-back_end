package com.devteria.cinemaback_end.chat.dto;

import com.devteria.cinemaback_end.chat.entity.enums.MessageType;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessageRequest {
    String roomId;
    String senderId;
    String senderName;
    String content;
    String senderRole;
    String avatarUrl;
    MessageType messageType;
    String imageUrl;
}
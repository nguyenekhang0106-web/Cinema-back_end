package com.devteria.cinemaback_end.chat.dto;

import com.devteria.cinemaback_end.chat.entity.enums.MessageType;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessageResponse {
    String id;
    String roomId;
    String senderId;
    String senderName;
    String content;
    LocalDateTime timestamp;
    Boolean adminRead;
    Long unreadCount;
    String senderRole;
    String avatarUrl;
    MessageType messageType;
    String imageUrl;
}

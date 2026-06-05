package com.devteria.cinemaback_end.chat.dto;

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
}
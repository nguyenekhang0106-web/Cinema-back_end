package com.devteria.cinemaback_end.user.dto;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EmailNotificationMessage {
    String messageId;
    EmailNotificationType type;
    String toEmail;
    String fullName;
    String verificationCode;
    String resetLink;
    LocalDateTime createdAt;
}

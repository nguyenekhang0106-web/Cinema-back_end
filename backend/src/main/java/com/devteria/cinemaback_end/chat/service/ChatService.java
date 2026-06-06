package com.devteria.cinemaback_end.chat.service;

import com.devteria.cinemaback_end.chat.dto.ChatMessageRequest;
import com.devteria.cinemaback_end.chat.dto.ChatMessageResponse;
import com.devteria.cinemaback_end.chat.entity.ChatMessage;
import com.devteria.cinemaback_end.chat.repository.ChatMessageRepository;
import com.devteria.cinemaback_end.user.entity.User;
import com.devteria.cinemaback_end.user.repository.UserRepository;
import com.devteria.cinemaback_end.util.S3Service;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.devteria.cinemaback_end.chat.entity.enums.MessageType;
import java.time.Duration;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatService {

    private static final String DEFAULT_AVATAR_KEY = "avatar/DefaultAvatar.png";
    private static final String CHAT_IMAGE_FOLDER = "chat";

    ChatMessageRepository chatMessageRepository;
    UserRepository userRepository;
    S3Service s3Service;

    // 1. TÌM VÀ SỬA LẠI HÀM NÀY
    private String buildChatImageUrl(String keyOrUrl) {
        if (keyOrUrl == null || keyOrUrl.isBlank()) {
            return null;
        }
        String key = s3Service.normalizeKey(keyOrUrl);
        // 🔥 Trả lại link bảo mật Presigned URL vì Bucket S3 là Private
        return s3Service.generatePresignedUrl(key, Duration.ofDays(7));
    }

    @Transactional
    public ChatMessageResponse saveMessage(ChatMessageRequest request) {
        String role = request.getSenderRole() != null && !request.getSenderRole().isBlank()
                ? request.getSenderRole()
                : "USER";

        String avatarUrl = request.getAvatarUrl();
        String senderName = request.getSenderName();

        User user = null;
        if ("USER".equalsIgnoreCase(role) && request.getSenderId() != null && !request.getSenderId().isBlank()) {
            user = userRepository.findById(request.getSenderId()).orElse(null);
        }

        if (user != null) {
            if (senderName == null || senderName.isBlank()) {
                senderName = user.getFullName() != null ? user.getFullName() : user.getEmail();
            }
            avatarUrl = buildAvatarUrl(user.getAvatarUrl());
        }

        String content = request.getContent() == null ? "" : request.getContent();

        String imageKey = null;
        if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) {
            imageKey = s3Service.normalizeKey(request.getImageUrl());
        }

        boolean hasContent = content != null && !content.isBlank();
        boolean hasImage = imageKey != null && !imageKey.isBlank();

        MessageType messageType;

        if (hasContent && hasImage) {
            messageType = MessageType.MIXED;
        } else if (hasImage) {
            messageType = MessageType.IMAGE;
        } else {
            messageType = MessageType.TEXT;
        }

        ChatMessage message = ChatMessage.builder()
                .roomId(request.getRoomId())
                .senderId(request.getSenderId())
                .senderName(senderName)
                .senderRole(role)
                .avatarUrl(avatarUrl)
                .content(content)
                .adminRead("ADMIN".equalsIgnoreCase(role))
                .imageUrl(imageKey)
                .messageType(messageType)
                .build();

        message = chatMessageRepository.save(message);
        return mapToResponse(message);
    }

    // 2. TÌM VÀ SỬA LẠI HÀM NÀY
    public String uploadChatImage(MultipartFile file) {
        String key = s3Service.uploadFile(file, "chat");
        return s3Service.generatePresignedUrl(key, Duration.ofDays(7));
    }

    public List<ChatMessageResponse> getChatHistory(String roomId) {
        return chatMessageRepository.findByRoomIdOrderByTimestampAsc(roomId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<ChatMessageResponse> getActiveRooms() {
        return chatMessageRepository.findActiveCustomerRoomIds()
                .stream()
                .map(roomId -> {
                    ChatMessage latest = chatMessageRepository
                            .findFirstByRoomIdOrderByTimestampDesc(roomId)
                            .orElseThrow();

                    ChatMessage customer = chatMessageRepository
                            .findFirstByRoomIdAndSenderRoleOrderByTimestampAsc(roomId, "USER")
                            .orElse(latest);

                    long unread = chatMessageRepository
                            .countByRoomIdAndSenderRoleAndAdminReadFalse(roomId, "USER");

                    String customerName = customer.getSenderName();
                    String customerAvatar = customer.getAvatarUrl();

                    User user = userRepository.findById(roomId).orElse(null);
                    if (user != null) {
                        customerName = user.getFullName() != null ? user.getFullName() : user.getEmail();
                        customerAvatar = buildAvatarUrl(user.getAvatarUrl());
                    }

                    return ChatMessageResponse.builder()
                            .id(latest.getId())
                            .roomId(roomId)
                            .senderId(customer.getSenderId())
                            .senderName(customerName)
                            .senderRole(latest.getSenderRole())
                            .content(latest.getContent())
                            .imageUrl(latest.getImageUrl())
                            .messageType(latest.getMessageType())
                            .avatarUrl(customerAvatar)
                            .timestamp(latest.getTimestamp())
                            .adminRead(unread == 0)
                            .unreadCount(unread)
                            .build();
                })
                .toList();
    }

    @Transactional
    public void markRoomAsReadByAdmin(String roomId) {
        chatMessageRepository.markRoomAsReadByAdmin(roomId);
    }

    private ChatMessageResponse mapToResponse(ChatMessage msg) {
        return ChatMessageResponse.builder()
                .id(msg.getId())
                .roomId(msg.getRoomId())
                .senderId(msg.getSenderId())
                .senderName(msg.getSenderName())
                .senderRole(msg.getSenderRole())
                .content(msg.getContent())
                .imageUrl(buildChatImageUrl(msg.getImageUrl()))
                .messageType(msg.getMessageType())
                .avatarUrl(msg.getAvatarUrl())
                .timestamp(msg.getTimestamp())
                .adminRead(msg.isAdminRead())
                .unreadCount(0L)
                .build();
    }



    private String buildAvatarUrl(String key) {
        String avatarKey = (key != null && !key.isBlank()) ? key : DEFAULT_AVATAR_KEY;
        if (avatarKey.startsWith("http://") || avatarKey.startsWith("https://")) {
            return avatarKey;
        }
        return s3Service.buildS3Url(avatarKey);
    }
}

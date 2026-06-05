package com.devteria.cinemaback_end.chat.service;

import com.devteria.cinemaback_end.chat.dto.ChatMessageRequest;
import com.devteria.cinemaback_end.chat.dto.ChatMessageResponse;
import com.devteria.cinemaback_end.chat.entity.ChatMessage;
import com.devteria.cinemaback_end.chat.repository.ChatMessageRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatService {

    ChatMessageRepository chatMessageRepository;

    public ChatMessageResponse saveMessage(ChatMessageRequest request) {
        ChatMessage message = ChatMessage.builder()
                .roomId(request.getRoomId())
                .senderId(request.getSenderId())
                .senderName(request.getSenderName())
                .content(request.getContent())
                .build();

        message = chatMessageRepository.save(message);

        return ChatMessageResponse.builder()
                .id(message.getId())
                .roomId(message.getRoomId())
                .senderId(message.getSenderId())
                .senderName(message.getSenderName())
                .content(message.getContent())
                .timestamp(message.getTimestamp())
                .build();
    }

    public List<ChatMessageResponse> getChatHistory(String roomId) {
        return chatMessageRepository.findByRoomIdOrderByTimestampAsc(roomId).stream()
                .map(msg -> ChatMessageResponse.builder()
                        .id(msg.getId())
                        .roomId(msg.getRoomId())
                        .senderId(msg.getSenderId())
                        .senderName(msg.getSenderName())
                        .content(msg.getContent())
                        .timestamp(msg.getTimestamp())
                        .build())
                .toList();
    }
}
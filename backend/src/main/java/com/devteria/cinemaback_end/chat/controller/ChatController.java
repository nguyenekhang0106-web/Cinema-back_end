package com.devteria.cinemaback_end.chat.controller;

import com.devteria.cinemaback_end.chat.dto.ChatMessageRequest;
import com.devteria.cinemaback_end.chat.dto.ChatMessageResponse;
import com.devteria.cinemaback_end.chat.service.ChatService;
import com.devteria.cinemaback_end.common.ApiResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatController {

    SimpMessagingTemplate messagingTemplate;
    ChatService chatService;

    // ==========================================
    // 1. WEBSOCKET ENDPOINT (Real-time Chat)
    // Frontend gửi tin nhắn qua kênh: /app/chat.sendMessage
    // ==========================================
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessageRequest chatMessageRequest) {
        // 1. Lưu tin nhắn vào Database
        ChatMessageResponse savedMsg = chatService.saveMessage(chatMessageRequest);

        // 2. Bắn tin nhắn này đến kênh dành riêng cho roomId đó
        // Ví dụ: Khách A có roomId là "USR-123", kênh sẽ là "/topic/chat/USR-123"
        // Cả Khách A và Admin đều đang "lắng nghe" kênh này trên Frontend.
        messagingTemplate.convertAndSend("/topic/chat/" + chatMessageRequest.getRoomId(), savedMsg);

        // 3. (Tùy chọn) Bắn thêm 1 thông báo cho Admin biết có tin nhắn mới (kênh tổng của Admin)
        messagingTemplate.convertAndSend("/topic/admin/chat", savedMsg);
    }

    // ==========================================
    // 2. REST API ENDPOINT (Lấy Lịch Sử Chat)
    // URL: GET /api/chat/{roomId}
    // ==========================================
    @GetMapping("/api/chat/{roomId}")
    public ApiResponse<List<ChatMessageResponse>> getChatHistory(@PathVariable String roomId) {
        return ApiResponse.<List<ChatMessageResponse>>builder()
                .code(1000)
                .result(chatService.getChatHistory(roomId))
                .build();
    }
}
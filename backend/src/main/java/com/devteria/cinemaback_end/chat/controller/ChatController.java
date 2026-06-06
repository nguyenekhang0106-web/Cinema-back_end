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
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatController {

    SimpMessagingTemplate messagingTemplate;
    ChatService chatService;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessageRequest chatMessageRequest) {
        ChatMessageResponse savedMsg = chatService.saveMessage(chatMessageRequest);

        messagingTemplate.convertAndSend("/topic/chat/" + chatMessageRequest.getRoomId(), savedMsg);
        messagingTemplate.convertAndSend("/topic/admin/chat", savedMsg);
    }

    // Lấy lịch sử 1 phòng chat sau khi refresh
    @GetMapping("/api/chat/{roomId}")
    public ApiResponse<List<ChatMessageResponse>> getChatHistory(@PathVariable String roomId) {
        return ApiResponse.<List<ChatMessageResponse>>builder()
                .code(1000)
                .result(chatService.getChatHistory(roomId))
                .build();
    }

    // Lấy danh sách khách đã từng nhắn cho admin
    @GetMapping("/api/chat/admin/rooms")
    public ApiResponse<List<ChatMessageResponse>> getActiveRooms() {
        return ApiResponse.<List<ChatMessageResponse>>builder()
                .code(1000)
                .result(chatService.getActiveRooms())
                .build();
    }

    // Khi admin click vào 1 phòng thì đánh dấu đã đọc
    @PutMapping("/api/chat/admin/rooms/{roomId}/read")
    public ApiResponse<Void> markRoomAsRead(@PathVariable String roomId) {
        chatService.markRoomAsReadByAdmin(roomId);
        return ApiResponse.<Void>builder()
                .code(1000)
                .message("Đã đánh dấu đã đọc")
                .build();
    }

    // Upload ảnh chat, FE gọi API này trước rồi gửi message kèm imageUrl qua WebSocket
    @PostMapping("/api/chat/upload-image")
    public ApiResponse<String> uploadChatImage(@RequestParam("file") MultipartFile file) {
        return ApiResponse.<String>builder()
                .code(1000)
                .message("Upload ảnh chat thành công")
                .result(chatService.uploadChatImage(file))
                .build();
    }
}

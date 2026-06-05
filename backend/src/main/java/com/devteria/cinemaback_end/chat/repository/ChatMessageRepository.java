package com.devteria.cinemaback_end.chat.repository;

import com.devteria.cinemaback_end.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {
    // Lấy toàn bộ tin nhắn của 1 phòng chat, sắp xếp theo thời gian cũ -> mới
    List<ChatMessage> findByRoomIdOrderByTimestampAsc(String roomId);
}
package com.devteria.cinemaback_end.chat.repository;

import com.devteria.cinemaback_end.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {

    // Tin nhắn trong 1 phòng: cũ ở trên, mới ở dưới
    List<ChatMessage> findByRoomIdOrderByTimestampAsc(String roomId);

    @Query("""
    select c.roomId
    from ChatMessage c
    where c.senderRole = 'USER'
    group by c.roomId
    order by max(c.timestamp) desc
""")
    List<String> findActiveCustomerRoomIds();

    Optional<ChatMessage> findFirstByRoomIdOrderByTimestampDesc(String roomId);

    Optional<ChatMessage> findFirstByRoomIdAndSenderRoleOrderByTimestampAsc(
            String roomId,
            String senderRole
    );

    long countByRoomIdAndSenderRoleAndAdminReadFalse(
            String roomId,
            String senderRole
    );

    // Đếm tin khách gửi mà admin chưa đọc. Tin admin có senderId = 'ADMIN' thì không tính.
    long countByRoomIdAndAdminReadFalseAndSenderIdNot(String roomId, String senderId);

    @Modifying
    @Query("""
        update ChatMessage c
        set c.adminRead = true
        where c.roomId = :roomId
          and c.senderId <> 'ADMIN'
    """)
    void markRoomAsReadByAdmin(@Param("roomId") String roomId);
}

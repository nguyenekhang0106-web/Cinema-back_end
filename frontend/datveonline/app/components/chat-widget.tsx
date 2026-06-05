"use client";

import { useEffect, useState, useRef } from "react";
import {
  MessageOutlined,
  CloseOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { Button, Input, Card, Avatar } from "antd";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuthSession } from "./auth-session-provider";

export function ChatWidget() {
  const { user } = useAuthSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tạo Room ID dựa trên ID người dùng (Nếu chưa đăng nhập thì dùng ID khách vãng lai)
  const roomId = user?.id || "GUEST-ROOM";
  const senderName = user?.email ? user.email.split("@")[0] : "Khách hàng";

  useEffect(() => {
    if (!isOpen) return; // Chỉ kết nối khi khách mở hộp chat

    // 1. Khởi tạo kết nối STOMP qua SockJS
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:9090/cinema/ws"),
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("Đã kết nối Chat Server!");

        // 2. Lấy lịch sử chat cũ từ REST API
        fetch(`http://localhost:9090/cinema/api/chat/${roomId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.result) setMessages(data.result);
          });

        // 3. Đăng ký (Subscribe) lắng nghe tin nhắn mới trả về phòng này
        client.subscribe(`/topic/chat/${roomId}`, (message) => {
          const newMsg = JSON.parse(message.body);
          setMessages((prev) => [...prev, newMsg]);
        });
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [isOpen, roomId]);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!inputValue.trim() || !stompClient?.connected) return;

    const chatMessage = {
      roomId: roomId,
      senderId: user?.id || "GUEST",
      senderName: senderName,
      content: inputValue,
    };

    // Bắn tin nhắn lên Backend
    stompClient.publish({
      destination: "/app/chat.sendMessage",
      body: JSON.stringify(chatMessage),
    });

    setInputValue("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Hộp thoại Chat */}
      {isOpen && (
        <Card
          className="w-[350px] shadow-2xl mb-4 border-0 overflow-hidden flex flex-col"
          bodyStyle={{
            padding: 0,
            display: "flex",
            flexDirection: "column",
            height: "450px",
          }}
        >
          {/* Header */}
          <div className="bg-[#a61d24] text-white p-4 flex justify-between items-center">
            <span className="font-bold text-lg">Hỗ trợ trực tuyến</span>
            <CloseOutlined
              className="cursor-pointer"
              onClick={() => setIsOpen(false)}
            />
          </div>

          {/* Nội dung tin nhắn */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
            {messages.map((msg, idx) => {
              const isMe = msg.senderId === (user?.id || "GUEST");
              return (
                <div
                  key={idx}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${isMe ? "bg-[#a61d24] text-white rounded-br-none" : "bg-white text-gray-800 border rounded-bl-none"}`}
                  >
                    <div className="text-[10px] opacity-70 mb-1">
                      {msg.senderName}
                    </div>
                    <div className="text-sm">{msg.content}</div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Ô nhập liệu */}
          <div className="p-3 bg-white border-t flex gap-2">
            <Input
              placeholder="Nhập tin nhắn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={sendMessage}
              className="rounded-full"
            />
            <Button
              type="primary"
              shape="circle"
              icon={<SendOutlined />}
              onClick={sendMessage}
              className="bg-[#a61d24]"
            />
          </div>
        </Card>
      )}

      {/* Nút bấm nổi (FAB) */}
      {!isOpen && (
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<MessageOutlined style={{ fontSize: 24 }} />}
          className="bg-[#a61d24] w-14 h-14 shadow-lg hover:scale-110 transition-transform"
          onClick={() => setIsOpen(true)}
        />
      )}
    </div>
  );
}

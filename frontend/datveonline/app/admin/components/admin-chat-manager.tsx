"use client";

import { useEffect, useState, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  List,
  Avatar,
  Typography,
  Badge,
} from "antd";
import { SendOutlined, UserOutlined, MessageOutlined } from "@ant-design/icons";
import { useAuthSession } from "../../components/auth-session-provider";

export default function AdminChatManager() {
  const { user } = useAuthSession();
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [activeRooms, setActiveRooms] = useState<string[]>([]); // Danh sách Room ID
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:9090/cinema/ws"),
      onConnect: () => {
        // Lắng nghe Kênh Tổng để nhận thông báo khi có AI ĐÓ nhắn tin
        client.subscribe("/topic/admin/chat", (message) => {
          const newMsg = JSON.parse(message.body);

          // Thêm room vào danh sách bên trái nếu chưa có
          setActiveRooms((prev) => {
            if (!prev.includes(newMsg.roomId)) return [...prev, newMsg.roomId];
            return prev;
          });

          // Lưu tin nhắn vào state tổng
          setMessages((prev) => ({
            ...prev,
            [newMsg.roomId]: [...(prev[newMsg.roomId] || []), newMsg],
          }));
        });
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, []);

  // Khi Admin bấm chọn 1 phòng bên trái -> Load lịch sử phòng đó
  const handleSelectRoom = (roomId: string) => {
    setCurrentRoom(roomId);
    if (!messages[roomId]) {
      fetch(`http://localhost:9090/cinema/api/chat/${roomId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.result) {
            setMessages((prev) => ({ ...prev, [roomId]: data.result }));
          }
        });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentRoom]);

  const sendMessage = () => {
    if (!inputValue.trim() || !stompClient?.connected || !currentRoom) return;

    const chatMessage = {
      roomId: currentRoom,
      senderId: user?.id || "ADMIN",
      senderName: "CSKH Rạp Phim",
      content: inputValue,
    };

    stompClient.publish({
      destination: "/app/chat.sendMessage",
      body: JSON.stringify(chatMessage),
    });

    setInputValue("");
  };

  return (
    <Card
      className="rounded-2xl shadow-sm h-[700px] overflow-hidden"
      bodyStyle={{ padding: 0, height: "100%" }}
    >
      <Row className="h-full">
        {/* Cột trái: Danh sách Khách hàng */}
        <Col span={8} className="border-r bg-gray-50 flex flex-col h-full">
          <div className="p-4 bg-white border-b">
            <Typography.Title level={5} style={{ margin: 0 }}>
              Hộp thư đến
            </Typography.Title>
          </div>
          <div className="flex-1 overflow-y-auto">
            <List
              dataSource={activeRooms}
              renderItem={(roomId) => (
                <div
                  className={`p-4 border-b cursor-pointer transition-colors ${currentRoom === roomId ? "bg-blue-50 border-r-4 border-r-[#a61d24]" : "hover:bg-gray-100"}`}
                  onClick={() => handleSelectRoom(roomId)}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={<UserOutlined />}
                        className="bg-[#a61d24]"
                      />
                    }
                    title={
                      <span className="font-semibold text-gray-800">
                        Khách ID: {roomId.substring(0, 8)}...
                      </span>
                    }
                    description={
                      <span className="text-gray-500 text-xs">
                        Bấm để xem tin nhắn
                      </span>
                    }
                  />
                </div>
              )}
            />
            {activeRooms.length === 0 && (
              <div className="text-center text-gray-400 mt-10">
                Chưa có đoạn chat nào
              </div>
            )}
          </div>
        </Col>

        {/* Cột phải: Nội dung chat */}
        <Col span={16} className="flex flex-col h-full bg-white">
          {currentRoom ? (
            <>
              {/* Header đoạn chat */}
              <div className="p-4 border-b shadow-sm flex items-center gap-3">
                <Avatar icon={<UserOutlined />} />
                <span className="font-bold">
                  Đang hỗ trợ: {currentRoom.substring(0, 8)}...
                </span>
              </div>

              {/* Nơi hiển thị tin nhắn */}
              <div className="flex-1 p-6 overflow-y-auto bg-gray-50 flex flex-col gap-4">
                {(messages[currentRoom] || []).map((msg, idx) => {
                  const isAdmin = msg.senderId === (user?.id || "ADMIN");
                  return (
                    <div
                      key={idx}
                      className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-2xl ${isAdmin ? "bg-[#a61d24] text-white rounded-br-none" : "bg-white text-gray-800 border shadow-sm rounded-bl-none"}`}
                      >
                        <div className="text-xs opacity-70 mb-1">
                          {msg.senderName}
                        </div>
                        <div className="text-sm">{msg.content}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Ô nhập tin nhắn */}
              <div className="p-4 bg-white border-t flex gap-3 items-center">
                <Input
                  size="large"
                  placeholder="Nhập tin nhắn hỗ trợ..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onPressEnter={sendMessage}
                  className="rounded-full bg-gray-100 border-none px-6"
                />
                <Button
                  type="primary"
                  shape="circle"
                  size="large"
                  icon={<SendOutlined />}
                  onClick={sendMessage}
                  className="bg-[#a61d24]"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4">
              <MessageOutlined style={{ fontSize: 60, opacity: 0.2 }} />
              <span>Hãy chọn một khách hàng bên trái để bắt đầu hỗ trợ</span>
            </div>
          )}
        </Col>
      </Row>
    </Card>
  );
}

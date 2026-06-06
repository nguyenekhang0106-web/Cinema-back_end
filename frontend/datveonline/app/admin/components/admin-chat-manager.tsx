"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Button,
  Empty,
  Input,
  List,
  Space,
  Spin,
  Typography,
  message,
} from "antd";
import {
  PictureOutlined,
  MessageOutlined,
  SearchOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_CINEMA_API_URL ?? "http://localhost:9090/cinema";
const WS_URL = `${API_BASE_URL}/ws`;

function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const maxWidth = 600;
      const scale = Math.min(1, maxWidth / image.width);
      const canvas = document.createElement("canvas");

      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);

      const context = canvas.getContext("2d");
      context?.drawImage(image, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            resolve(file);
            return;
          }
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, ".jpg"),
            { type: "image/jpeg" },
          );
          resolve(compressedFile);
        },
        "image/jpeg",
        0.6,
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    image.src = objectUrl;
  });
}

type ChatMessage = {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  adminRead?: boolean;
  unreadCount?: number;
  senderRole?: "USER" | "ADMIN" | string;
  avatarUrl?: string;
  imageUrl?: string;
  messageType?: "TEXT" | "IMAGE" | "MIXED" | string;
  email?: string;
  hasChat?: boolean;
};

type UserItem = {
  id: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
};

function formatTime(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function getToken() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("kct-auth-session");
  if (!raw) return null;
  try {
    return JSON.parse(raw)?.token || null;
  } catch {
    return null;
  }
}

function authHeaders(): HeadersInit {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function getDisplayName(user: UserItem) {
  return (
    user.fullName || user.email?.split("@")[0] || `Khách ${user.id.slice(0, 6)}`
  );
}

function toUserRoom(user: UserItem): ChatMessage {
  return {
    id: `user-${user.id}`,
    roomId: user.id,
    senderId: user.id,
    senderName: getDisplayName(user),
    email: user.email,
    avatarUrl: user.avatarUrl,
    content: "Chưa có tin nhắn",
    timestamp: "",
    unreadCount: 0,
    senderRole: "USER",
    hasChat: false,
  };
}

export default function AdminChatManager() {
  const [rooms, setRooms] = useState<ChatMessage[]>([]);
  const [allUsers, setAllUsers] = useState<ChatMessage[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // 🔥 STATE MỚI: QUẢN LÝ NHIỀU ẢNH
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedImagePreviews, setSelectedImagePreviews] = useState<string[]>(
    [],
  );

  const stompRef = useRef<Client | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const selectedRoomIdRef = useRef<string | null>(null);
  const allUsersRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  useEffect(() => {
    allUsersRef.current = allUsers;
  }, [allUsers]);

  const enrichedRooms = useMemo(() => {
    return rooms.map((room) => {
      const userInfo = allUsers.find((u) => u.roomId === room.roomId);
      return {
        ...room,
        senderName: userInfo?.senderName || room.senderName,
        email: userInfo?.email || room.email,
        avatarUrl: userInfo?.avatarUrl || room.avatarUrl,
        hasChat: true,
      };
    });
  }, [rooms, allUsers]);

  const selectedRoom = useMemo(() => {
    return (
      enrichedRooms.find((room) => room.roomId === selectedRoomId) ||
      allUsers.find((user) => user.roomId === selectedRoomId) ||
      null
    );
  }, [allUsers, enrichedRooms, selectedRoomId]);

  const filteredRooms = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return enrichedRooms;

    const roomMap = new Map(enrichedRooms.map((room) => [room.roomId, room]));
    const result: ChatMessage[] = [];
    const pushed = new Set<string>();

    allUsers.forEach((user) => {
      const matched =
        user.senderName?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.roomId?.toLowerCase().includes(keyword);

      if (matched) {
        const room = roomMap.get(user.roomId);
        result.push(
          room
            ? {
                ...room,
                senderName: user.senderName,
                email: user.email,
                avatarUrl: user.avatarUrl,
              }
            : user,
        );
        pushed.add(user.roomId);
      }
    });

    enrichedRooms.forEach((room) => {
      const matched =
        room.senderName?.toLowerCase().includes(keyword) ||
        room.email?.toLowerCase().includes(keyword) ||
        room.roomId?.toLowerCase().includes(keyword) ||
        room.content?.toLowerCase().includes(keyword);

      if (matched && !pushed.has(room.roomId)) {
        result.push(room);
        pushed.add(room.roomId);
      }
    });

    return result;
  }, [allUsers, enrichedRooms, search]);

  const loadUsers = async () => {
    const res = await fetch(`${API_BASE_URL}/users`, {
      headers: authHeaders(),
      cache: "no-store",
    });
    const data = await res.json();
    const users = (data.result || []).map((user: UserItem) => toUserRoom(user));
    setAllUsers(users);
  };

  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      const [roomsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/chat/admin/rooms`, { cache: "no-store" }),
        loadUsers(),
      ]);
      const roomsData = await roomsRes.json();
      setRooms(
        roomsData.result?.map((r: any) => ({ ...r, hasChat: true })) || [],
      );
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    setLoadingMessages(true);
    try {
      const token = getToken();
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      await fetch(`${API_BASE_URL}/api/chat/admin/rooms/${roomId}/read`, {
        method: "PUT",
        headers,
      }).catch(() => undefined);

      const res = await fetch(`${API_BASE_URL}/api/chat/${roomId}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setMessages(data.result || []);

      setRooms((prev) =>
        prev.map((room) =>
          room.roomId === roomId
            ? { ...room, unreadCount: 0, adminRead: true }
            : room,
        ),
      );
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 3000,
      onConnect: () => {
        client.subscribe("/topic/admin/chat", (frame) => {
          const msg: ChatMessage = JSON.parse(frame.body);
          const selected = selectedRoomIdRef.current;
          const isAdmin =
            msg.senderRole === "ADMIN" || msg.senderId === "ADMIN";
          const userInfo = allUsersRef.current.find(
            (u) => u.roomId === msg.roomId,
          );

          setRooms((prev) => {
            const existed = prev.find((room) => room.roomId === msg.roomId);
            const updatedRoom: ChatMessage = {
              ...(existed || msg),
              ...msg,
              senderName:
                userInfo?.senderName || existed?.senderName || msg.senderName,
              email: userInfo?.email || existed?.email,
              avatarUrl:
                userInfo?.avatarUrl || existed?.avatarUrl || msg.avatarUrl,
              hasChat: true,
              unreadCount:
                msg.roomId === selected || isAdmin
                  ? 0
                  : (existed?.unreadCount || 0) + 1,
            };

            return [
              updatedRoom,
              ...prev.filter((room) => room.roomId !== msg.roomId),
            ];
          });

          if (msg.roomId === selected) {
            setMessages((prev) => [...prev, msg]);
            fetch(`${API_BASE_URL}/api/chat/admin/rooms/${msg.roomId}/read`, {
              method: "PUT",
              headers: authHeaders(),
            }).catch(() => undefined);
          }
        });
      },
    });

    client.activate();
    stompRef.current = client;
    return () => {
      client.deactivate();
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      selectedImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedImagePreviews]);

  const chooseRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    loadMessages(roomId);
  };

  // 🔥 XỬ LÝ CHỌN NHIỀU ẢNH
  const handleSelectImages = (files: FileList) => {
    const newFiles = Array.from(files);
    if (selectedImages.length + newFiles.length > 5) {
      message.warning("Bạn chỉ có thể gửi tối đa 5 ảnh mỗi lần.");
    }
    const allowedFiles = newFiles.slice(0, 5 - selectedImages.length);
    const newPreviews = allowedFiles.map((file) => URL.createObjectURL(file));

    setSelectedImages((prev) => [...prev, ...allowedFiles]);
    setSelectedImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeSelectedImage = (index: number) => {
    URL.revokeObjectURL(selectedImagePreviews[index]);
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setSelectedImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    selectedImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setSelectedImagePreviews([]);
  };

  const uploadChatImage = async (file: File) => {
    const formData = new FormData();
    const compressedFile = await compressImage(file);
    formData.append("file", compressedFile);

    const res = await fetch(`${API_BASE_URL}/api/chat/upload-image`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || (data.code && data.code !== 1000)) {
      throw new Error(data.message || "Không thể tải ảnh lên");
    }
    return data.result as string;
  };

  const sendMessage = async () => {
    const content = text.trim();
    if (
      (!content && selectedImages.length === 0) ||
      !selectedRoomId ||
      !stompRef.current?.connected
    )
      return;

    const customer = selectedRoom;
    setUploadingImage(true);

    try {
      const uploadPromises = selectedImages.map((file) =>
        uploadChatImage(file),
      );
      const imageUrls = await Promise.all(uploadPromises);

      if (imageUrls.length === 1) {
        stompRef.current.publish({
          destination: "/app/chat.sendMessage",
          body: JSON.stringify({
            roomId: selectedRoomId,
            senderId: "ADMIN",
            senderName: "Admin KCT",
            senderRole: "ADMIN",
            avatarUrl: "",
            content,
            imageUrl: imageUrls[0],
            messageType: content ? "MIXED" : "IMAGE",
          }),
        });
      } else {
        if (content) {
          stompRef.current.publish({
            destination: "/app/chat.sendMessage",
            body: JSON.stringify({
              roomId: selectedRoomId,
              senderId: "ADMIN",
              senderName: "Admin KCT",
              senderRole: "ADMIN",
              avatarUrl: "",
              content,
              imageUrl: "",
              messageType: "TEXT",
            }),
          });
        }
        for (const url of imageUrls) {
          stompRef.current.publish({
            destination: "/app/chat.sendMessage",
            body: JSON.stringify({
              roomId: selectedRoomId,
              senderId: "ADMIN",
              senderName: "Admin KCT",
              senderRole: "ADMIN",
              avatarUrl: "",
              content: "",
              imageUrl: url,
              messageType: "IMAGE",
            }),
          });
        }
      }

      if (customer && !customer.hasChat) {
        setRooms((prev) => [
          {
            ...customer,
            content: content || `Đã gửi ${imageUrls.length} ảnh`,
            imageUrl: imageUrls[0] || "",
            messageType:
              content && imageUrls.length
                ? "MIXED"
                : imageUrls.length
                  ? "IMAGE"
                  : "TEXT",
            timestamp: new Date().toISOString(),
            hasChat: true,
          },
          ...prev,
        ]);
      }

      setText("");
      clearAllImages();
    } catch (error) {
      console.error("Send admin chat message failed:", error);
      message.error("Gửi tin nhắn thất bại!");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="grid h-[620px] grid-cols-[370px_1fr] overflow-hidden bg-white">
      <div className="flex min-h-0 flex-col border-r border-[#ead8bf]">
        <div className="border-b border-[#ead8bf] px-6 py-5">
          <Typography.Title level={4} style={{ margin: 0 }}>
            Đoạn chat
          </Typography.Title>
          <Input
            className="mt-4"
            size="large"
            placeholder="Tìm kiếm theo tên user/email..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Spin
          spinning={loadingRooms}
          wrapperClassName="min-h-0 flex-1 overflow-y-auto"
        >
          <List
            dataSource={filteredRooms}
            locale={{
              emptyText: <Empty description="Không tìm thấy người dùng" />,
            }}
            renderItem={(room) => {
              const unread = Number(room.unreadCount || 0) > 0;
              return (
                <List.Item
                  onClick={() => chooseRoom(room.roomId)}
                  style={{ padding: "16px 22px" }}
                  className={`cursor-pointer hover:bg-[#fff7ed] ${selectedRoomId === room.roomId ? "bg-[#fff2e8]" : ""}`}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        size={46}
                        src={room.avatarUrl || undefined}
                        icon={<UserOutlined />}
                      />
                    }
                    title={
                      <div className="flex items-center justify-between gap-3 pr-1">
                        <span className="truncate font-semibold text-[#2f241d]">
                          {room.senderName ||
                            `Khách ${room.roomId.slice(0, 6)}`}
                        </span>
                        {unread && (
                          <span className="h-3 w-3 shrink-0 rounded-full bg-green-500" />
                        )}
                      </div>
                    }
                    description={
                      <div className="pr-1">
                        <div className="truncate text-gray-500">
                          {room.content ||
                            (room.imageUrl ? "Đã gửi ảnh" : "Chưa có tin nhắn")}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          {formatTime(room.timestamp)}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </Spin>
      </div>

      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        {!selectedRoomId ? (
          <div className="flex flex-1 flex-col items-center justify-center text-gray-400">
            <MessageOutlined style={{ fontSize: 54 }} />
            <p className="mt-3 text-base">
              Chọn một người dùng để xem hoặc bắt đầu hỗ trợ
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 border-b border-[#ead8bf] px-6 py-5">
              <Avatar
                size={54}
                src={selectedRoom?.avatarUrl || undefined}
                icon={<UserOutlined />}
              />
              <div className="min-w-0">
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {selectedRoom?.senderName || "Khách hàng"}
                </Typography.Title>
                <Typography.Text type="secondary" className="block truncate">
                  {selectedRoom?.email ? `${selectedRoom.email} · ` : ""}Room:{" "}
                  {selectedRoomId}
                </Typography.Text>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[#fafafa] px-7 py-6">
              <Spin spinning={loadingMessages}>
                {messages.length === 0 ? (
                  <div className="flex min-h-[300px] items-center justify-center text-gray-400">
                    Chưa có tin nhắn với người dùng này
                  </div>
                ) : (
                  <div className="space-y-5">
                    {messages.map((msg) => {
                      const isAdmin =
                        msg.senderRole === "ADMIN" || msg.senderId === "ADMIN";
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[68%] rounded-2xl px-5 py-3 shadow-sm ${isAdmin ? "bg-[#a61d24] text-white rounded-br-md" : "bg-white text-gray-800 rounded-bl-md"}`}
                          >
                            {msg.content && (
                              <div
                                className={
                                  isAdmin
                                    ? "admin-message-scroll max-h-[120px] overflow-y-auto whitespace-pre-wrap break-words leading-relaxed pr-2"
                                    : "whitespace-pre-wrap break-words leading-relaxed"
                                }
                              >
                                {msg.content}
                              </div>
                            )}

                            {msg.imageUrl && (
                              <a
                                href={msg.imageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={msg.content ? "mt-3 block" : "block"}
                              >
                                <img
                                  src={msg.imageUrl}
                                  alt="Ảnh chat"
                                  loading="lazy"
                                  decoding="async"
                                  className="max-h-[240px] max-w-full rounded-xl object-cover border border-white/20"
                                />
                              </a>
                            )}
                            <div
                              className={`mt-2 text-xs ${isAdmin ? "text-white/70" : "text-gray-400"}`}
                            >
                              {formatTime(msg.timestamp)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </Spin>
            </div>

            <div className="border-t border-[#ead8bf] px-6 py-4">
              {/* 🔥 KHU VỰC PREVIEW NHIỀU ẢNH */}
              {selectedImagePreviews.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-3 rounded-2xl bg-gray-100 p-3">
                  {selectedImagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt="Ảnh xem trước"
                        className="h-16 w-16 rounded-xl object-cover shadow-sm border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeSelectedImage(index)}
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-700 text-xs font-bold text-white shadow hover:bg-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(event) => {
                  if (event.target.files)
                    handleSelectImages(event.target.files);
                  event.target.value = "";
                }}
              />

              <Space.Compact className="w-full">
                <Button
                  size="large"
                  icon={<PictureOutlined />}
                  disabled={uploadingImage}
                  onClick={() => imageInputRef.current?.click()}
                />
                <Input
                  size="large"
                  placeholder="Nhập tin nhắn trả lời khách..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onPressEnter={sendMessage}
                />
                <Button
                  size="large"
                  type="primary"
                  icon={<SendOutlined />}
                  loading={uploadingImage}
                  onClick={sendMessage}
                >
                  Gửi
                </Button>
              </Space.Compact>
            </div>
          </>
        )}
      </div>
      <style jsx global>{`
        .admin-message-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .admin-message-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.45);
          border-radius: 999px;
        }
        .admin-message-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.12);
          border-radius: 999px;
        }
      `}</style>
    </div>
  );
}

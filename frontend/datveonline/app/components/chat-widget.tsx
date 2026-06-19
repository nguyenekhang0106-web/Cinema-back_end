"use client";

import { useEffect, useRef, useState } from "react";
import {
  MessageOutlined,
  CloseOutlined,
  SendOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { Button, Input, Card, message } from "antd";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuthSession } from "./auth-session-provider";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_CINEMA_API_URL ?? "http://localhost:9090/cinema"
).replace(/\/$/, "");

function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_CINEMA_API_URL ??
        "http://localhost:9090/cinema";
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

export function ChatWidget() {
  const { user } = useAuthSession();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [hasUnreadAdminReply, setHasUnreadAdminReply] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // 🔥 STATE MỚI: QUẢN LÝ MẢNG NHIỀU ẢNH
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedImagePreviews, setSelectedImagePreviews] = useState<string[]>(
    [],
  );

  const stompClientRef = useRef<Client | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(false);

  const roomId = user?.id || "GUEST-ROOM";
  const senderName = user?.email ? user.email.split("@")[0] : "Khách hàng";

  const getToken = () => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("kct-auth-session");
    if (!raw) return null;
    try {
      return JSON.parse(raw)?.token || null;
    } catch {
      return null;
    }
  };

  const welcomeMessages = [
    {
      id: "welcome-1",
      senderId: "ADMIN",
      senderName: "KCT Cinema",
      senderRole: "ADMIN",
      content: "Xin chào, chào mừng bạn đến với KCT Cinema!",
    },
    {
      id: "welcome-2",
      senderId: "ADMIN",
      senderName: "KCT Cinema",
      senderRole: "ADMIN",
      content: "Tôi có thể giúp gì cho bạn hôm nay?",
    },
  ];

  useEffect(() => {
    isOpenRef.current = isOpen;

    if (!isOpen) return;

    setHasUnreadAdminReply(false);

    fetch(`${API_BASE_URL}/api/chat/${roomId}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        const history = data.result || [];
        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages(welcomeMessages);
        }
      })
      .catch(() => undefined);
  }, [isOpen, roomId]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/chat/${roomId}`, (messageEvent) => {
          const newMsg = JSON.parse(messageEvent.body);

          setMessages((prev) => {
            const existed = prev.some(
              (item) => item.id && item.id === newMsg.id,
            );
            return existed ? prev : [...prev, newMsg];
          });

          const isAdminMessage =
            newMsg.senderRole === "ADMIN" || newMsg.senderId === "ADMIN";

          if (isAdminMessage && !isOpenRef.current) {
            setHasUnreadAdminReply(true);
          }
        });
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
      stompClientRef.current = null;
    };
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clean up object URLs khi component unmount
  useEffect(() => {
    return () => {
      selectedImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedImagePreviews]);

  const openChat = () => {
    setIsOpen(true);
    setHasUnreadAdminReply(false);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  // 🔥 XỬ LÝ CHỌN NHIỀU ẢNH
  const handleSelectImages = (files: FileList) => {
    const newFiles = Array.from(files);

    if (selectedImages.length + newFiles.length > 5) {
      message.warning("Bạn chỉ có thể gửi tối đa 5 ảnh mỗi lần.");
    }

    // Cắt lấy tối đa 5 ảnh
    const allowedFiles = newFiles.slice(0, 5 - selectedImages.length);
    const newPreviews = allowedFiles.map((file) => URL.createObjectURL(file));

    setSelectedImages((prev) => [...prev, ...allowedFiles]);
    setSelectedImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  // 🔥 XÓA TỪNG ẢNH
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

    const token = getToken();
    const headers: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const res = await fetch(`${API_BASE_URL}/api/chat/upload-image`, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || (data.code && data.code !== 1000)) {
      throw new Error(data.message || "Không thể tải ảnh lên");
    }
    return data.result as string;
  };

  // 🔥 LOGIC GỬI TIN NHẮN THÔNG MINH
  const sendMessage = async () => {
    const content = inputValue.trim();
    const client = stompClientRef.current;

    if ((!content && selectedImages.length === 0) || !client?.connected) return;

    setUploadingImage(true);

    try {
      // 1. Upload toàn bộ ảnh lấy danh sách URL
      const uploadPromises = selectedImages.map((file) =>
        uploadChatImage(file),
      );
      const imageUrls = await Promise.all(uploadPromises);

      // 2. Logic chia nhỏ tin nhắn
      if (imageUrls.length === 1) {
        // Gửi 1 ảnh kèm chữ (MIXED)
        client.publish({
          destination: "/app/chat.sendMessage",
          body: JSON.stringify({
            roomId,
            senderId: user?.id || "GUEST",
            senderName,
            senderRole: "USER",
            content,
            imageUrl: imageUrls[0],
            messageType: content ? "MIXED" : "IMAGE",
          }),
        });
      } else {
        // Khai báo rõ ràng senderId
        const currentSenderId = user?.id || "GUEST";

        // Gửi nhiều ảnh (Chữ riêng, các ảnh bay lên riêng)
        if (content) {
          client.publish({
            destination: "/app/chat.sendMessage",
            body: JSON.stringify({
              roomId,
              senderId: currentSenderId,
              senderName,
              senderRole: "USER",
              content,
              imageUrl: "",
              messageType: "TEXT",
            }),
          });
        }
        for (const url of imageUrls) {
          client.publish({
            destination: "/app/chat.sendMessage",
            body: JSON.stringify({
              roomId,
              senderId: currentSenderId,
              senderName,
              senderRole: "USER",
              content: "",
              imageUrl: url,
              messageType: "IMAGE",
            }),
          });
        }
      }

      setInputValue("");
      clearAllImages();
    } catch (error) {
      console.error("Send chat message failed:", error);
      message.error("Gửi tin nhắn thất bại!");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {isOpen && (
        <Card
          className="mb-4 flex w-[380px] flex-col overflow-hidden border-0 shadow-2xl"
          bodyStyle={{
            padding: 0,
            display: "flex",
            flexDirection: "column",
            height: "500px",
          }}
        >
          <div className="flex items-center justify-between bg-[#a61d24] p-4 text-white">
            <span className="text-lg font-bold">Hỗ trợ trực tuyến</span>
            <CloseOutlined className="cursor-pointer" onClick={closeChat} />
          </div>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-gray-50 p-4">
            {messages.map((msg, idx) => {
              const isMe = msg.senderId === (user?.id || "GUEST");

              return (
                <div
                  key={msg.id || idx}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl p-3 shadow-sm ${isMe ? "rounded-br-md bg-[#a61d24] text-white" : "rounded-bl-md border bg-white text-gray-800"}`}
                  >
                    <div className="mb-1 text-[10px] opacity-70">
                      {msg.senderName}
                    </div>

                    {msg.content && (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {msg.content}
                      </div>
                    )}

                    {msg.imageUrl && (
                      <a
                        href={msg.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block"
                      >
                        <img
                          src={msg.imageUrl}
                          alt="Ảnh chat"
                          loading="lazy"
                          decoding="async"
                          className="max-h-[220px] max-w-full rounded-xl object-cover border border-white/20"
                        />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t bg-white p-3">
            {/* 🔥 KHU VỰC PREVIEW NHIỀU ẢNH (GIAO DIỆN MESSENGER) */}
            {selectedImagePreviews.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-3 rounded-2xl bg-gray-100 p-3">
                {selectedImagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt="Ảnh xem trước"
                      className="h-14 w-14 rounded-xl object-cover shadow-sm border border-gray-300"
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

            <div className="flex gap-2">
              {/* Thêm multiple vào input file */}
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

              <Button
                shape="circle"
                icon={<PictureOutlined />}
                disabled={uploadingImage}
                onClick={() => imageInputRef.current?.click()}
              />

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
                loading={uploadingImage}
                onClick={sendMessage}
                className="bg-[#a61d24]"
              />
            </div>
          </div>
        </Card>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={openChat}
          className="relative flex !h-16 !w-16 items-center justify-center rounded-full bg-[#a61d24] text-white shadow-xl transition-transform hover:scale-110"
        >
          {hasUnreadAdminReply && (
            <span className="absolute -right-1 -top-1 z-[80] flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white shadow-md ring-2 ring-white">
              ✓
            </span>
          )}
          <MessageOutlined style={{ fontSize: 30 }} />
        </button>
      )}
    </div>
  );
}

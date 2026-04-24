"use client";

import {
  CloseOutlined,
  CustomerServiceOutlined,
  MessageOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { Button, Input } from "antd";
import { useState } from "react";
import { useLocale } from "./locale-provider";

export function ChatWidget() {
  const locale = useLocale();
  const copy = locale === "en" ? chatCopy.en : chatCopy.vi;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="chat-widget">
      {isOpen ? (
        <section className="chat-panel cinema-paper" aria-label={copy.panelLabel}>
          <header className="chat-panel-header">
            <div className="chat-panel-brand">
              <div className="chat-panel-icon">
                <CustomerServiceOutlined />
              </div>
              <div>
                <h3>{copy.title}</h3>
                <p>{copy.status}</p>
              </div>
            </div>
            <Button
              aria-label={copy.close}
              className="chat-panel-close"
              icon={<CloseOutlined />}
              onClick={() => setIsOpen(false)}
              type="text"
            />
          </header>

          <div className="chat-panel-body">
            <div className="chat-message chat-message--agent">
              <span>{copy.greeting}</span>
            </div>
            <div className="chat-message chat-message--agent">
              <span>{copy.hint}</span>
            </div>
            <div className="chat-message chat-message--user">
              <span>{copy.sampleQuestion}</span>
            </div>
            <div className="chat-message chat-message--agent">
              <span>{copy.sampleAnswer}</span>
            </div>
          </div>

          <footer className="chat-panel-footer">
            <Input
              size="large"
              placeholder={copy.placeholder}
              suffix={<SendOutlined style={{ color: "#a61d24" }} />}
            />
            <div className="chat-panel-actions">
              <span>{copy.note}</span>
              <Button type="primary" icon={<SendOutlined />}>
                {copy.send}
              </Button>
            </div>
          </footer>
        </section>
      ) : null}

      <button
        type="button"
        className="chat-bubble"
        aria-label={copy.open}
        onClick={() => setIsOpen((value) => !value)}
      >
        <span className="chat-bubble-ping" />
        <MessageOutlined />
      </button>
    </div>
  );
}

const chatCopy = {
  vi: {
    panelLabel: "Hộp chat hỗ trợ",
    title: "KCT Cinema Support",
    status: "Đang trực tuyến",
    close: "Đóng chat",
    open: "Mở chat hỗ trợ",
    greeting: "Xin chào, bạn cần hỗ trợ đặt vé, lịch chiếu hay tài khoản?",
    hint: "Đây là giao diện mẫu. Bạn có thể nối API chatbot hoặc live chat thật sau.",
    sampleQuestion: "Mình muốn xem suất chiếu tối nay.",
    sampleAnswer: "Bạn có thể chọn phim hoặc rạp, sau đó hệ thống sẽ gợi ý suất chiếu phù hợp.",
    placeholder: "Nhập tin nhắn của bạn...",
    note: "UI demo, chưa gửi dữ liệu",
    send: "Gửi",
  },
  en: {
    panelLabel: "Support chat panel",
    title: "KCT Cinema Support",
    status: "Online now",
    close: "Close chat",
    open: "Open support chat",
    greeting: "Hello, do you need help with tickets, showtimes, or your account?",
    hint: "This is a UI mockup. You can connect a real chatbot or live chat API later.",
    sampleQuestion: "I want to check tonight's showtimes.",
    sampleAnswer: "You can choose a movie or cinema first, then the system can suggest matching sessions.",
    placeholder: "Type your message...",
    note: "UI only, not connected yet",
    send: "Send",
  },
} as const;

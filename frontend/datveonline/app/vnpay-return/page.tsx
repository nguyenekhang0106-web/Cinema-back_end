"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spin, Typography } from "antd";

export default function VnPayReturnPage() {
  const router = useRouter();

  useEffect(() => {
    const processVnPayReturn = async () => {
      if (typeof window === "undefined") return;
      const queryString = window.location.search.substring(1);
      if (!queryString) return;

      try {
        // 🔥 Lấy Token bao quát mọi trường hợp (đề phòng lưu tên khác nhau)
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("accessToken") ||
          sessionStorage.getItem("token");

        const searchParams = new URLSearchParams(queryString);
        const vnpResponseCode = searchParams.get("vnp_ResponseCode");

        const savedStateStr = sessionStorage.getItem("kct_booking_state");
        const returnUrl = savedStateStr
          ? JSON.parse(savedStateStr).returnUrl
          : "/";

        // Chuẩn bị Header (Có token thì gửi, không có thì thôi vì Backend đã Public API này)
        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // 1. GỌI API BACKEND ĐỂ CHỐT ĐƠN (Đồng bộ)
        const res = await fetch(
          `http://localhost:9090/cinema/payments/vnpay/return?${queryString}`,
          {
            headers: headers,
          },
        );
        const data = await res.json();

        // 2. CHỐT CHẶN: NẾU BACKEND TỪ CHỐI GIAO DỊCH
        if (!res.ok || data.code !== 1000) {
          console.error("Backend từ chối giao dịch:", data.message);
          alert(
            "Giao dịch gặp sự cố: " + (data.message || "Lỗi không xác định"),
          );
          router.replace(`${returnUrl}?payment=failed`);
          return;
        }

        // 3. MỌI THỨ HOÀN HẢO -> ĐIỀU HƯỚNG
        if (vnpResponseCode === "00") {
          router.replace(`${returnUrl}?payment=success`);
        } else {
          router.replace(`${returnUrl}?payment=failed`);
        }
      } catch (error) {
        console.error("Lỗi đồng bộ VNPay:", error);
        const savedStateStr = sessionStorage.getItem("kct_booking_state");
        const returnUrl = savedStateStr
          ? JSON.parse(savedStateStr).returnUrl
          : "/";
        router.replace(`${returnUrl}?payment=error`);
      }
    };

    processVnPayReturn();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fffaf4]">
      <Spin size="large" />
      <Typography.Title level={4} className="mt-4 text-[#4a3426]">
        Đang đồng bộ kết quả giao dịch...
      </Typography.Title>
      <Typography.Text type="secondary">
        Vui lòng không đóng trình duyệt lúc này để hệ thống xuất vé.
      </Typography.Text>
    </div>
  );
}

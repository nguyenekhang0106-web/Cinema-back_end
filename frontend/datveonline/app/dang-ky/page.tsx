import { Suspense } from "react";
import { AuthPage } from "../components/auth-page";

// Có thể import thêm Spin từ antd nếu muốn UI đẹp hơn: import { Spin } from "antd";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 md:px-6 md:py-14">
      <div className="w-full">
        {/* Đổi fallback={null} thành một giao diện chờ đơn giản */}
        <Suspense
          fallback={
            <div className="flex w-full items-center justify-center py-20 text-[#6d5a46]">
              Đang tải biểu mẫu đăng ký...
            </div>
          }
        >
          <AuthPage mode="register" />
        </Suspense>
      </div>
    </main>
  );
}

import { Suspense } from "react";
import { AuthPage } from "../components/auth-page";
import { SiteShell } from "../components/site-shell"; 

export default function RegisterPage() {
  return (
    <SiteShell>
      {/* Đã xóa max-w-5xl và min-h-screen để giao diện bung full màn hình */}
      <main className="w-full bg-[#fffaf4]">
        <Suspense
          fallback={
            <div className="flex w-full items-center justify-center py-20 text-[#6d5a46]">
              Đang tải biểu mẫu đăng ký...
            </div>
          }
        >
          <AuthPage mode="register" />
        </Suspense>
      </main>
    </SiteShell>
  );
}
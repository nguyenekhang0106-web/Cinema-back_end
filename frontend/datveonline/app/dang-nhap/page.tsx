import { Suspense } from "react";
import { AuthPage } from "../components/auth-page";
import { SiteShell } from "../components/site-shell"; 

export default function LoginPage() {
  return (
    <SiteShell>
      {/* Đã xóa max-w-3xl và min-h-screen để giao diện bung full màn hình */}
      <main className="w-full bg-[#fffaf4]">
        <Suspense fallback={null}>
          <AuthPage mode="login" />
        </Suspense>
      </main>
    </SiteShell>
  );
}
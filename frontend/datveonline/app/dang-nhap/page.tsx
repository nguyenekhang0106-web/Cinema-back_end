import { Suspense } from "react";
import { AuthPage } from "../components/auth-page";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-16">
      <div className="w-full">
        <Suspense fallback={null}>
          <AuthPage mode="login" />
        </Suspense>
      </div>
    </main>
  );
}

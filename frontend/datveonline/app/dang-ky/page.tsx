import { Suspense } from "react";
import { AuthPage } from "../components/auth-page";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 md:px-6 md:py-14">
      <div className="w-full">
        <Suspense fallback={null}>
          <AuthPage mode="register" />
        </Suspense>
      </div>
    </main>
  );
}

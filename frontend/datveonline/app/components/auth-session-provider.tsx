"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { type AuthRole, type AuthUser } from "../lib/cinema-api";
import { App } from "antd";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_CINEMA_API_URL ?? "http://localhost:9090/cinema"
).replace(/\/$/, "");

type AuthSession = {
  isAuthenticated: boolean;
  role: AuthRole | null;
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  signIn: (token: string, user: AuthUser) => void;
  signOut: () => void;
  logout: () => void;
};

const STORAGE_KEY = "kct-auth-session";

const AuthSessionContext = createContext<AuthSession>({
  isAuthenticated: false,
  role: null,
  token: null,
  user: null,
  loading: true,
  signIn: () => undefined,
  signOut: () => undefined,
  logout: () => undefined,
});

function getTokenRemainingTime(token: string | null): number {
  if (!token) return -1;
  try {
    const payloadBase64Url = token.split(".")[1];
    const base64 = payloadBase64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return 999999;

    return payload.exp - Math.floor(Date.now() / 1000);
  } catch (e) {
    return -1;
  }
}

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { message } = App.useApp();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = (session: any | null) => {
    setIsAuthenticated(session?.isAuthenticated ?? false);
    setRole(session?.role ?? null);
    setToken(session?.token ?? null);
    setUser(session?.user ?? null);
    setLoading(false);
  };

  const clearSession = () => {
    setIsAuthenticated(false);
    setRole(null);
    setToken(null);
    setUser(null);
    setLoading(false);
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("auth-changed"));
  };

  // GLOBAL FETCH INTERCEPTOR (Chặn API 401)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const isRefreshApi =
        typeof args[0] === "string" && args[0].includes("/auth/refresh");

      const response = await originalFetch(...args);

      if (response.status === 401 && !isRefreshApi) {
        window.dispatchEvent(new Event("force-logout"));

        // Thay vì trả về JSON, chúng ta ném lỗi để các hàm gọi fetch biết mà dừng lại
        throw new Error("UNAUTHORIZED");
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // LẮNG NGHE SỰ KIỆN ĐÁ VĂNG
  useEffect(() => {
    const handleForceLogout = () => {
      if (!sessionStorage.getItem("is_logging_out")) {
        sessionStorage.setItem("is_logging_out", "true");
        clearSession();

        message.error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn!");
        router.push("/dang-nhap");

        setTimeout(() => {
          sessionStorage.removeItem("is_logging_out");
        }, 3000);
      }
    };

    window.addEventListener("force-logout", handleForceLogout);
    return () => window.removeEventListener("force-logout", handleForceLogout);
  }, [router, message]);

  // Đồng bộ Session khi tải trang
  useEffect(() => {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (rawValue) {
      try {
        const session = JSON.parse(rawValue);
        if (session.token && getTokenRemainingTime(session.token) <= 0) {
          window.dispatchEvent(new Event("force-logout"));
          setLoading(false);
        } else {
          applySession(session);
        }
      } catch (e) {
        clearSession();
      }
    } else {
      applySession(null);
    }

    const syncSession = () => {
      const val = window.localStorage.getItem(STORAGE_KEY);
      if (val) {
        const parsed = JSON.parse(val);
        if (getTokenRemainingTime(parsed.token) > 0) {
          applySession(parsed);
        }
      } else {
        applySession(null);
      }
    };

    window.addEventListener("auth-changed", syncSession);
    window.addEventListener("storage", syncSession);

    return () => {
      window.removeEventListener("auth-changed", syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, [pathname]);

  // SILENT REFRESH TOKEN (Quét mỗi 5s)
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(async () => {
      const remainingTime = getTokenRemainingTime(token);

      if (remainingTime <= 0) {
        window.dispatchEvent(new Event("force-logout"));
        return;
      }

      if (remainingTime > 0 && remainingTime < 300) {
        const isRefreshing = sessionStorage.getItem("is_refreshing_token");

        if (!isRefreshing) {
          sessionStorage.setItem("is_refreshing_token", "true");

          try {
            const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: token }),
            });

            if (res.ok) {
              const data = await res.json();
              if (data.code === 1000 && data.result?.token) {
                const rawValue = window.localStorage.getItem(STORAGE_KEY);
                if (rawValue) {
                  const session = JSON.parse(rawValue);
                  session.token = data.result.token;
                  window.localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(session),
                  );
                  window.dispatchEvent(new Event("auth-changed"));
                }
              }
            }
          } catch (error) {
            console.error("Lỗi làm mới token:", error);
          } finally {
            sessionStorage.removeItem("is_refreshing_token");
          }
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [token]);

  const value = useMemo<AuthSession>(() => {
    const handleSignOut = () => {
      clearSession();
      router.push("/");
    };

    return {
      isAuthenticated,
      role,
      token,
      user,
      loading,

      signIn: (nextToken, nextUser) => {
        const nextSession = {
          isAuthenticated: true,
          role: nextUser.role,
          token: nextToken,
          user: nextUser,
        };

        setIsAuthenticated(true);
        setRole(nextUser.role);
        setToken(nextToken);
        setUser(nextUser);

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
        window.dispatchEvent(new Event("auth-changed"));
      },

      signOut: handleSignOut,
      logout: handleSignOut,
    };
  }, [isAuthenticated, loading, role, router, token, user]);

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  return useContext(AuthSessionContext);
}

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { type AuthRole, type AuthUser } from "../lib/cinema-api";
import { App } from "antd";

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

// 🔥 1. ĐÃ NÂNG CẤP: Tính số giây CÒN LẠI của Token
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

    // Tính số giây còn lại: Thời gian hết hạn (exp) - Thời gian hiện tại
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
    setLoading(false); // 🔥 Đã thêm: Ép buộc tắt loading ngay cả khi bị đá văng để hiện lại nút Header
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("auth-changed"));
  };

  // GLOBAL FETCH INTERCEPTOR (Chặn API 401)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      // Bỏ qua chặn 401 nếu đang cố gọi API Refresh (tránh lặp vô tận)
      const isRefreshApi =
        typeof args[0] === "string" && args[0].includes("/auth/refresh");

      const response = await originalFetch(...args);

      if (response.status === 401 && !isRefreshApi) {
        const rawValue = window.localStorage.getItem(STORAGE_KEY);
        if (rawValue && JSON.parse(rawValue).token) {
          window.dispatchEvent(new Event("force-logout"));
        }
        return new Response(
          JSON.stringify({ code: 401, message: "Unauthorized" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
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
        clearSession(); // Đã bao gồm setLoading(false)

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
          setLoading(false); // 🔥 Đã thêm: Tấm khiên bảo vệ thứ 2, đảm bảo tắt loading khi load trang với token cũ
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

  // 🔥 2. SILENT REFRESH TOKEN (Quét mỗi 5s)
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(async () => {
      const remainingTime = getTokenRemainingTime(token);

      // Nếu dưới 0 giây -> Đá văng luôn
      if (remainingTime <= 0) {
        window.dispatchEvent(new Event("force-logout"));
        return;
      }

      // 🔥 Nếu token còn DƯỚI 5 PHÚT (300 giây) -> Gọi API Refresh ngầm
      if (remainingTime > 0 && remainingTime < 300) {
        // Chống gọi API liên tục nhiều lần bằng biến cờ
        const isRefreshing = sessionStorage.getItem("is_refreshing_token");

        if (!isRefreshing) {
          sessionStorage.setItem("is_refreshing_token", "true");

          try {
            const res = await fetch(
              "http://localhost:9090/cinema/auth/refresh",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: token }), // Gửi token cũ để đổi
              },
            );

            if (res.ok) {
              const data = await res.json();

              if (data.code === 1000 && data.result?.token) {
                // Đổi token thành công -> Lưu đè token mới vào LocalStorage
                const rawValue = window.localStorage.getItem(STORAGE_KEY);
                if (rawValue) {
                  const session = JSON.parse(rawValue);
                  session.token = data.result.token; // Thay token mới
                  window.localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(session),
                  );
                  window.dispatchEvent(new Event("auth-changed")); // Kích hoạt UI cập nhật ngầm
                }
              }
            } else {
              // Nếu Refresh bị lỗi (backend từ chối), kệ nó để hết giờ sẽ tự out
              console.warn("Refresh Token failed.");
            }
          } catch (error) {
            console.error("Lỗi làm mới token:", error);
          } finally {
            // Mở khóa cờ
            sessionStorage.removeItem("is_refreshing_token");
          }
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [token]); // Chạy lại interval mỗi khi token thay đổi

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

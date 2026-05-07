"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { type AuthRole, type AuthUser } from "../lib/cinema-api";

type AuthSession = {
  isAuthenticated: boolean;
  role: AuthRole | null;
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  signIn: (token: string, user: AuthUser) => void;
  signOut: () => void;
  logout: () => void; // 🔥 Bổ sung thêm logout để khớp với code Dashboard
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
  logout: () => undefined, // 🔥 Bổ sung giá trị mặc định
});

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<AuthRole | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const rawValue = window.localStorage.getItem(STORAGE_KEY);
      if (!rawValue) {
        setLoading(false);
        return;
      }

      const parsedValue = JSON.parse(rawValue) as {
        isAuthenticated?: boolean;
        role?: AuthRole;
        token?: string;
        user?: AuthUser;
      };
      setIsAuthenticated(Boolean(parsedValue.isAuthenticated));
      setRole(parsedValue.role ?? null);
      setToken(parsedValue.token ?? null);
      setUser(parsedValue.user ?? null);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthSession>(() => {
    // Tách logic đăng xuất ra 1 hàm dùng chung
    const handleSignOut = () => {
      setIsAuthenticated(false);
      setRole(null);
      setToken(null);
      setUser(null);
      window.localStorage.removeItem(STORAGE_KEY);
    };

    return {
      isAuthenticated,
      role,
      token,
      user,
      loading,
      signIn: (nextToken, nextUser) => {
        setIsAuthenticated(true);
        setRole(nextUser.role);
        setToken(nextToken);
        setUser(nextUser);
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            isAuthenticated: true,
            role: nextUser.role,
            token: nextToken,
            user: nextUser,
          }),
        );
      },
      signOut: handleSignOut,
      logout: handleSignOut, // 🔥 Gán chung logic vào cả 2 tên gọi
    };
  }, [isAuthenticated, loading, role, token, user]);

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  return useContext(AuthSessionContext);
}

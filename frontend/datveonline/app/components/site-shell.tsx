"use client";

import Link from "next/link";
import { CgvHeader } from "./cgv-header";
import { useDictionary, useLocale } from "./locale-provider";
import { usePathname } from "next/navigation";
import { localizeHref } from "../lib/i18n";
import { ChatWidget } from "./chat-widget";
import { useAuthSession } from "./auth-session-provider"; // 🔥 BƯỚC 1: Import hook kiểm tra quyền

export function SiteShell({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const dictionary = useDictionary();
  const pathname = usePathname();
  const { role } = useAuthSession(); // 🔥 BƯỚC 2: Lấy quyền của user hiện tại

  const normalizedPathname = pathname || "";

  // 🔥 BƯỚC 3: Cập nhật logic - Ẩn nếu URL là trang Admin HOẶC tài khoản đang đăng nhập là Admin
  const isAdminPage =
    normalizedPathname === "/admin" ||
    normalizedPathname.startsWith("/admin/") ||
    normalizedPathname === "/en/admin" ||
    normalizedPathname.startsWith("/en/admin/") ||
    normalizedPathname.includes("/admin") ||
    String(role).toUpperCase().includes("ADMIN");

  return (
    <>
      <CgvHeader />

      {children}

      <footer className="cinema-footer mt-12 px-0 py-10 text-white">
        <div className="cinema-shell px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div>
              <h3 className="text-2xl font-bold">KCT Cinema</h3>
              <p className="mt-3 text-white/80">
                {dictionary.footer.description}
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-[#f9d36b]">
                {dictionary.footer.navigation}
              </h4>

              <div className="mt-3 flex flex-col gap-2">
                {dictionary.header.nav.slice(0, 3).map((item) => (
                  <Link
                    key={item.href}
                    href={localizeHref(item.href, locale)}
                    className="text-white/80 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}

                <Link
                  href={localizeHref("/dang-nhap", locale)}
                  className="text-white/80 hover:text-white"
                >
                  {dictionary.header.login}
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-[#f9d36b]">
                {dictionary.footer.availableParts}
              </h4>

              <div className="mt-3 flex flex-col gap-2 text-white/80">
                {dictionary.footer.items.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-white/20 pt-8 text-center text-sm text-white/60">
            <p>
              &copy; {new Date().getFullYear()} KCT Cinema.{" "}
              {(dictionary.footer as any).rights ||
                "Bản quyền đã được bảo lưu."}
            </p>
          </div>
        </div>
      </footer>

      {!isAdminPage ? <ChatWidget /> : null}
    </>
  );
}

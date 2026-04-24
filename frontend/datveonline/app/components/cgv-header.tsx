"use client";

import { App } from "antd";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthSession } from "./auth-session-provider";
import { useDictionary, useLocale } from "./locale-provider";
import { getLocaleSwitchHref, localizeHref } from "../lib/i18n";

export function CgvHeader() {
  const { message } = App.useApp();
  const locale = useLocale();
  const dictionary = useDictionary();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading, role, signOut } = useAuthSession();
  const topLinks = [
    {
      href: "/uu-dai-thanh-vien",
      label: locale === "vi" ? "Ưu đãi thành viên" : "Member offers",
    },
    {
      href: "/ve-cua-toi-don-hang",
      label: locale === "vi" ? "Vé của tôi / Đơn hàng" : "My tickets / Orders",
    },
  ];

  const handleProtectedNavigation = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (isAuthenticated) {
      return;
    }

    event.preventDefault();
    message.warning(
      locale === "vi"
        ? "Vui lòng đăng nhập để truy cập mục này."
        : "Please sign in to access this section.",
    );
    router.push(localizeHref(`/dang-nhap?next=${encodeURIComponent(localizeHref(href, locale))}`, locale));
  };

  const dashboardHref = role === "admin" ? "/admin" : "/user";

  const handleSignOut = () => {
    signOut();
    router.push(localizeHref("/", locale));
  };

  return (
    <header className="sticky top-0 z-40">
      <div className="cinema-top-stripe text-white">
        <div className="cinema-shell flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
            {topLinks.map((item) => (
              <Link
                key={item.href}
                href={localizeHref(item.href, locale)}
                onClick={(event) => handleProtectedNavigation(event, item.href)}
                className="rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-white !text-white shadow-sm transition hover:border-white/40 hover:bg-white/18 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <span className="rounded-full border border-white/15 bg-black/10 px-3 py-1.5 text-white">
              <Link
                href={getLocaleSwitchHref(pathname, "vi")}
                className="font-bold text-white !text-white transition hover:text-white"
              >
                VI
              </Link>
              {" "}
              <span className="px-1 text-white/60">|</span>
              {" "}
              <Link
                href={getLocaleSwitchHref(pathname, "en")}
                className="font-bold text-white !text-white transition hover:text-white"
              >
                EN
              </Link>
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm font-bold">
            {!loading && isAuthenticated ? (
              <>
                <Link
                  href={localizeHref(dashboardHref, locale)}
                  className="rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-white !text-white shadow-sm transition hover:border-white/40 hover:bg-white/18 hover:text-white"
                >
                  {role === "admin"
                    ? locale === "vi"
                      ? "Trang admin"
                      : "Admin dashboard"
                    : locale === "vi"
                      ? "Tài khoản của tôi"
                      : "My account"}
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-white shadow-sm transition hover:border-white/40 hover:bg-white/18"
                >
                  {locale === "vi" ? "Đăng xuất" : "Sign out"}
                </button>
              </>
            ) : !loading ? (
              <>
                <Link
                  href={localizeHref("/dang-nhap", locale)}
                  className="rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-white !text-white shadow-sm transition hover:border-white/40 hover:bg-white/18 hover:text-white"
                >
                  {dictionary.header.login}
                </Link>
                <Link
                  href={localizeHref("/dang-ky", locale)}
                  className="rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-white !text-white shadow-sm transition hover:border-white/40 hover:bg-white/18 hover:text-white"
                >
                  {dictionary.header.register}
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-b border-[#e4d1b4] bg-[#fffaf2]/95 backdrop-blur-md">
        <div className="cinema-shell flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link href={localizeHref("/", locale)} className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#a61d24] text-xl font-black text-white shadow-[0_12px_25px_rgba(166,29,36,0.28)]">
                KCT
              </div>
              <div>
                <p className="text-2xl font-bold text-[#4a3426]">KCT Cinema</p>
                <p className="text-sm text-[#8c6b45]">{dictionary.header.tagline}</p>
              </div>
            </Link>
            <Link
              href={localizeHref("/thanh-vien", locale)}
              className="hidden rounded-full border border-[#c89a2b] px-4 py-2 text-sm font-semibold text-[#4a3426] lg:inline-flex"
            >
              {dictionary.header.club}
            </Link>
          </div>

          <div className="flex flex-1 flex-col gap-4 lg:max-w-[700px]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                className="w-full rounded-2xl border border-[#e4d1b4] bg-white px-4 py-3 outline-none md:min-w-0 lg:max-w-[430px]"
                placeholder={dictionary.header.searchPlaceholder}
              />
              <div className="flex shrink-0 flex-wrap gap-3 md:flex-nowrap">
                <Link
                  href={localizeHref("/phim", locale)}
                  className="whitespace-nowrap rounded-2xl bg-[#a61d24] px-5 py-3 font-semibold text-white"
                >
                  {dictionary.header.quickBooking}
                </Link>
                <Link
                  href={localizeHref("/rap-gia-ve", locale)}
                  className="whitespace-nowrap rounded-2xl border border-[#c89a2b] px-5 py-3 font-semibold text-[#4a3426]"
                >
                  {dictionary.header.showtimes}
                </Link>
              </div>
            </div>
            <nav className="flex flex-wrap gap-5 text-sm font-semibold text-[#4a3426]">
              {dictionary.header.nav.map((item) => (
                <Link
                  key={item.href}
                  href={localizeHref(item.href, locale)}
                  className="hover:text-[#a61d24]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}

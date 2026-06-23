"use client";

import { App, Dropdown } from "antd"; // 🔥 Bổ sung import Dropdown
import type { MenuProps } from "antd"; // 🔥 Bổ sung type MenuProps
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthSession } from "./auth-session-provider";
import { useDictionary, useLocale } from "./locale-provider";
import { getLocaleSwitchHref, localizeHref } from "../lib/i18n";
import { UserOutlined, GiftOutlined, HomeOutlined } from "@ant-design/icons"; // 🔥 Bổ sung import icon UserOutlined

export function CgvHeader() {
  const { message } = App.useApp();
  const locale = useLocale();
  const dictionary = useDictionary();
  const pathname = usePathname();
  const router = useRouter();
  // 🔥 Lấy thêm biến 'user' để hiển thị tên
  const { isAuthenticated, loading, role, user, signOut } = useAuthSession();

  const isAdmin = String(role).toUpperCase().includes("ADMIN");

  // 🔥 Định nghĩa Menu Dropdown cho mục "Ưu đãi thành viên"
  const memberMenuItems: MenuProps["items"] = [
    {
      key: "voucher",
      label: (
        <Link
          href={localizeHref("/thanh-vien", locale)}
          className="font-semibold text-[#4a3426] hover:text-[#a61d24] py-1 block"
        >
          {locale === "vi" ? "Voucher khả dụng" : "Available Vouchers"}
        </Link>
      ),
    },
    {
      key: "tier",
      label: (
        <Link
          href={localizeHref("/thanh-vien", locale)}
          className="font-semibold text-[#4a3426] hover:text-[#a61d24] py-1 block"
        >
          {locale === "vi" ? "Ưu đãi theo hạng thành viên" : "Tier Offers"}
        </Link>
      ),
    },
    {
      key: "points",
      label: (
        <Link
          href={localizeHref("/thanh-vien", locale)}
          className="font-semibold text-[#4a3426] hover:text-[#a61d24] py-1 block"
        >
          {locale === "vi" ? "Ưu đãi theo điểm thưởng" : "Points Offers"}
        </Link>
      ),
    },
  ];

  const topLinks = [
    {
      href: "/thanh-vien", // 🔥 Đã đổi link từ /uu-dai-thanh-vien sang /thanh-vien
      label: locale === "vi" ? "Ưu đãi thành viên" : "Member offers",
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
    router.push(
      localizeHref(
        `/dang-nhap?next=${encodeURIComponent(localizeHref(href, locale))}`,
        locale,
      ),
    );
  };

  const dashboardHref = isAdmin ? "/admin" : "/user";

  const handleSignOut = () => {
    signOut();
    router.push(localizeHref("/", locale));
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "/en";
    }
    return pathname.includes(href);
  };

  return (
    <header className="sticky top-0 z-40 shadow-sm">
      <div className="cinema-top-stripe text-white">
        <div className="cinema-shell flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
            {!isAdmin &&
              topLinks.map((item) => (
                <Dropdown
                  key={item.href}
                  menu={{ items: memberMenuItems }}
                  placement="bottomLeft"
                  arrow={{ pointAtCenter: true }}
                >
                  <Link
                    href={localizeHref(item.href, locale)}
                    onClick={(event) =>
                      handleProtectedNavigation(event, item.href)
                    }
                    className="hidden md:flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-white !text-white shadow-sm transition hover:border-white/40 hover:bg-white/18 hover:text-white"
                  >
                    {/* 🔥 1. Thêm Icon Hộp quà cho Ưu đãi thành viên */}
                    <GiftOutlined className="text-base" />
                    {item.label}
                  </Link>
                </Dropdown>
              ))}
            <span className="rounded-full border border-white/15 bg-black/10 px-3 py-1.5 text-white">
              <Link
                href={getLocaleSwitchHref(pathname, "vi")}
                className="font-bold text-white !text-white transition hover:text-white"
              >
                VI
              </Link>{" "}
              <span className="px-1 text-white/60">|</span>{" "}
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
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-white !text-white shadow-sm transition hover:border-white/40 hover:bg-white/18 hover:text-white"
                >
                  {/* 🔥 Thêm Icon User */}
                  <UserOutlined className="text-base" />

                  {/* 🔥 Hiển thị Tên User in hoa, tự động cắt chữ nếu quá dài */}
                  <span className="uppercase max-w-[120px] md:max-w-[200px] truncate">
                    {isAdmin
                      ? locale === "vi"
                        ? "Trang admin"
                        : "Admin dashboard"
                      : user?.fullName ||
                        (locale === "vi" ? "Tài khoản" : "Account")}
                  </span>
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
            <Link
              href={localizeHref("/", locale)}
              className="flex items-center gap-3"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#a61d24] text-xl font-black text-white shadow-[0_12px_25px_rgba(166,29,36,0.28)]">
                KCT
              </div>
              <div>
                <p className="text-2xl font-bold text-[#4a3426]">KCT Cinema</p>
                <p className="text-sm text-[#8c6b45]">
                  {dictionary.header.tagline}
                </p>
              </div>
            </Link>
            {!isAdmin && (
              <Link
                href={localizeHref("/thanh-vien", locale)}
                className="hidden rounded-full border border-[#c89a2b] px-4 py-2 text-sm font-semibold text-[#4a3426] lg:inline-flex"
              >
                {dictionary.header.club}
              </Link>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-4 lg:max-w-[700px]">
            {/* 🔥 Đã thêm justify-end để căn phải các nút bấm sau khi xóa ô tìm kiếm */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center justify-end">
              <div className="grid grid-cols-2 gap-3 w-full md:flex md:w-auto md:flex-nowrap">
                <Link
                  href={localizeHref("/phim", locale)}
                  className="flex items-center justify-center whitespace-nowrap rounded-2xl bg-[#a61d24] px-4 py-2 md:px-5 md:py-3 text-sm md:text-base font-semibold text-white text-center"
                >
                  {dictionary.header.quickBooking}
                </Link>
                <Link
                  href={localizeHref("/rap-gia-ve", locale)}
                  className="flex items-center justify-center whitespace-nowrap rounded-2xl border border-[#c89a2b] px-4 py-2 md:px-5 md:py-3 text-sm md:text-base font-semibold text-[#4a3426] text-center"
                >
                  {dictionary.header.showtimes}
                </Link>
              </div>
            </div>
            <nav className="flex overflow-x-auto whitespace-nowrap gap-6 pb-2 text-sm md:text-base md:flex-wrap md:overflow-visible md:pb-0 font-semibold no-scrollbar">
              {dictionary.header.nav.map((item) => {
                let displayLabel = item.label;

                if (item.href === "/rap-gia-ve") {
                  if (role === "admin") {
                    displayLabel =
                      locale === "vi" ? "Rạp & Phòng chiếu" : "Cinemas & Halls";
                  } else {
                    displayLabel =
                      locale === "vi"
                        ? "Rạp & Lịch chiếu"
                        : "Cinemas & Showtimes";
                  }
                }

                if (item.href === "/thanh-vien") {
                  displayLabel =
                    locale === "vi"
                      ? "Thành viên & Ưu đãi"
                      : "Membership & Offers";
                }

                if (item.href === "/cultureplex") {
                  displayLabel =
                    locale === "vi" ? "Đánh giá & Tin tức" : "Reviews & News";
                }

                // 🔥 NẾU LÀ ADMIN: Bỏ qua không render (ẩn) 2 mục Thành viên và Tin tức
                if (
                  isAdmin &&
                  (item.href === "/thanh-vien" || item.href === "/cultureplex")
                ) {
                  return null;
                }

                // (Nếu bạn có bọc thẻ Dropdown ở bước trước, hãy đảm bảo đặt đoạn kiểm tra này nằm trước phần return đó)
                return (
                  <Link
                    key={item.href}
                    href={localizeHref(item.href, locale)}
                    // 🔥 Bổ sung thêm "flex items-center gap-1.5" để Icon và Chữ nằm ngang
                    className={`flex items-center gap-1.5 transition-all duration-300 pb-1 transform origin-bottom ${
                      isActive(item.href)
                        ? "text-[#a61d24] border-b-[3px] border-[#a61d24] scale-110"
                        : "text-[#4a3426] hover:text-[#a61d24] hover:scale-110"
                    }`}
                  >
                    {/* 🔥 4. Nếu là menu Trang chủ thì hiện Icon */}
                    {item.href === "/" && (
                      <HomeOutlined className="text-lg mb-[2px]" />
                    )}
                    {displayLabel}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}

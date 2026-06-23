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

  const footerText =
    locale === "en"
      ? {
          project: "Online movie ticket booking system",
          course: "Software Engineering Project",
          university:
            "University of Science and Technology - The University of Danang",
          members: "Team Members",
          tech: "Technologies",
          support: "Customer Support",
          hotline: "Hotline",
          email: "Support email",
          address: "Administrative Center",
          addressValue: "57 Nguyen Luong Bang, Lien Chieu, Da Nang, Vietnam",
          copyright:
            "Software Engineering Project - University of Science and Technology, The University of Danang",
          team: "Team",
        }
      : {
          project: "Hệ thống đặt vé xem phim trực tuyến",
          course: "Đồ án Công nghệ phần mềm",
          university: "Trường Đại học Bách Khoa - Đại học Đà Nẵng",
          members: "Thành viên thực hiện",
          tech: "Công nghệ sử dụng",
          support: "Chăm sóc khách hàng",
          hotline: "Hotline",
          email: "Email hỗ trợ",
          address: "Trung tâm hành chính",
          addressValue:
            "57 Nguyễn Lương Bằng - Liên Chiểu - Đà Nẵng - Việt Nam",
          copyright: "Đồ án Công nghệ phần mềm - Đại học Bách Khoa Đà Nẵng",
          team: "Nhóm thực hiện",
        };

  return (
    <>
      <CgvHeader />

      {children}

      <footer className="cinema-footer mt-12 px-0 py-10 text-white">
        <div className="cinema-shell px-4 sm:px-6">
          **Thay bằng (Thêm `text-center md:text-left`):** ```tsx
          <div className="grid gap-8 text-center md:text-left md:grid-cols-4">
            <div>
              <h3 className="text-2xl font-bold">KCT Cinema</h3>
              <div className="mt-3 flex flex-col gap-3 text-white/80">
                <span>{footerText.project}</span>
                <span>{footerText.course}</span>
                <span>{footerText.university}</span>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-[#f9d36b]">
                {footerText.members}
              </h4>
              <div className="mt-3 flex flex-col gap-2 text-white/80">
                <span>Nguyễn Mạnh Cường</span>
                <span>Vương Quốc Trung</span>
                <span>Đinh Huỳnh Nguyên Khang</span>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-[#f9d36b]">
                {footerText.support}
              </h4>
              <div className="mt-3 flex flex-col gap-2 text-white/80">
                <span>{footerText.hotline}: 0774155608</span>
                <span>{footerText.email}: kctcinemavietnam@gmail.com</span>
                <span>
                  {footerText.address}: {footerText.addressValue}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-[#f9d36b]">
                {footerText.tech}
              </h4>
              <div className="mt-3 flex flex-col gap-2 text-white/80">
                <span>Next.js</span>
                <span>Spring Boot</span>
                <span>MySQL</span>
                <span>Redis</span>
                <span>RabbitMQ</span>
                <span>AWS S3</span>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-white/20 pt-8 text-center text-sm text-white/60">
            <p>
              © {new Date().getFullYear()} KCT Cinema. {footerText.copyright}
            </p>
            <p className="mt-2">
              {footerText.team}: Nguyễn Mạnh Cường - Vương Quốc Trung - Đinh
              Huỳnh Nguyên Khang
            </p>
          </div>
        </div>
      </footer>

      {!isAdminPage ? <ChatWidget /> : null}
    </>
  );
}

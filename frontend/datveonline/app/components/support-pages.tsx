"use client";

import { Card, Col, Empty, Row, Space, Tag, Typography } from "antd";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { localizeHref } from "../lib/i18n";
import { useAuthSession } from "./auth-session-provider";
import { SiteShell } from "./site-shell";
import { useLocale } from "./locale-provider";

type Section = {
  title: string;
  desc: string;
};

function RequireSignIn({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuthSession();

  useEffect(() => {
    if (loading || isAuthenticated) {
      return;
    }

    router.replace(
      localizeHref(`/dang-nhap?next=${encodeURIComponent(pathname)}`, locale),
    );
  }, [isAuthenticated, loading, locale, pathname, router]);

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="cinema-page">
        <SiteShell>
          <main className="cinema-shell px-4 py-8 sm:px-6">
            <Card bordered={false} className="cinema-paper rounded-[28px]">
              <Typography.Title level={2} style={{ marginTop: 0, color: "#4a3426" }}>
                {locale === "vi" ? "Đang chuyển đến trang đăng nhập..." : "Redirecting to sign in..."}
              </Typography.Title>
            </Card>
          </main>
        </SiteShell>
      </div>
    );
  }

  return <>{children}</>;
}

function SupportPageLayout(props: {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  sections: Section[];
}) {
  const locale = useLocale();
  const emptyDescription =
    locale === "vi"
      ? "Chưa có dữ liệu. Nội dung sẽ hiển thị khi back-end trả về thông tin."
      : "No data yet. Content will appear after the back-end responds.";

  return (
    <div className="cinema-page">
      <SiteShell>
        <main className="cinema-shell px-4 py-8 sm:px-6">
          <Card bordered={false} className="cinema-paper overflow-hidden rounded-[28px]">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="space-y-4">
                <Tag color="red">{props.eyebrow}</Tag>
                <Typography.Title level={1} style={{ margin: 0, color: "#4a3426" }}>
                  {props.title}
                </Typography.Title>
                <Typography.Paragraph style={{ color: "#6d5a46", marginBottom: 0 }}>
                  {props.description}
                </Typography.Paragraph>
              </div>
              <div className="relative min-h-[280px] overflow-hidden rounded-[24px]">
                <Image
                  src={props.image}
                  alt={props.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>
          </Card>

          <Row gutter={[24, 24]} className="mt-8">
            {props.sections.map((section) => (
              <Col xs={24} md={8} key={section.title}>
                <Card bordered={false} className="cinema-paper h-full rounded-[24px]">
                  <Space direction="vertical" size={14} className="w-full">
                    <Typography.Title level={4} style={{ margin: 0, color: "#4a3426" }}>
                      {section.title}
                    </Typography.Title>
                    <Typography.Paragraph style={{ color: "#6d5a46", marginBottom: 0 }}>
                      {section.desc}
                    </Typography.Paragraph>
                    <div className="rounded-[20px] border border-dashed border-[#d8c4aa] bg-[#fffaf4] p-5">
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={emptyDescription}
                      />
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </main>
      </SiteShell>
    </div>
  );
}

export function MemberOffersPage() {
  const locale = useLocale();

  const content =
    locale === "vi"
      ? {
          eyebrow: "Ưu đãi thành viên",
          title: "Ưu đãi & quyền lợi thành viên",
          description:
            "Trang này dành cho voucher, khuyến mãi theo hạng thành viên, banner campaign và toàn bộ nội dung ưu đãi do back-end cung cấp.",
          image:
            "https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=1200",
          sections: [
            {
              title: "Voucher khả dụng",
              desc: "Khu vực hiển thị voucher, mã ưu đãi, thời hạn sử dụng và điều kiện áp dụng từ API.",
            },
            {
              title: "Ưu đãi theo hạng",
              desc: "Quyền lợi Silver, Gold, Platinum và các chính sách loyalty sẽ chờ dữ liệu từ back-end.",
            },
            {
              title: "Banner campaign",
              desc: "Khu vực cho banner ưu đãi, event card và khối truyền thông được quản lý từ hệ thống.",
            },
          ],
        }
      : {
          eyebrow: "Member offers",
          title: "Member offers & privileges",
          description:
            "This page is intended for vouchers, loyalty-tier benefits, campaign banners, and promotional content delivered by the back-end.",
          image:
            "https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=1200",
          sections: [
            {
              title: "Available vouchers",
              desc: "A dedicated area for vouchers, promo codes, expiration dates, and usage conditions from the API.",
            },
            {
              title: "Tier-based benefits",
              desc: "Silver, Gold, Platinum perks and loyalty policy blocks will wait for server-side data.",
            },
            {
              title: "Campaign banners",
              desc: "A section for promotional banners, event cards, and media blocks managed from the system.",
            },
          ],
        };

  return (
    <RequireSignIn>
      <SupportPageLayout {...content} />
    </RequireSignIn>
  );
}

export function OrdersPage() {
  const locale = useLocale();

  const content =
    locale === "vi"
      ? {
          eyebrow: "Vé của tôi / Đơn hàng",
          title: "Lịch sử vé và đơn hàng",
          description:
            "Trang này dành cho vé sắp tới, lịch sử đơn hàng, trạng thái thanh toán, hóa đơn và toàn bộ lịch sử giao dịch lấy từ back-end.",
          image:
            "https://images.pexels.com/photos/7235814/pexels-photo-7235814.jpeg?auto=compress&cs=tinysrgb&w=1200",
          sections: [
            {
              title: "Vé sắp tới",
              desc: "Hiển thị vé đã đặt, mã đặt chỗ, rạp, ghế và suất chiếu từ API.",
            },
            {
              title: "Đơn hàng đã thanh toán",
              desc: "Hiển thị lịch sử thanh toán, hóa đơn, trạng thái hoàn tiền và giao dịch từ database.",
            },
            {
              title: "Tra cứu & bộ lọc",
              desc: "Khu vực lọc theo thời gian, trạng thái đơn hàng, rạp hoặc phương thức thanh toán khi tích hợp API.",
            },
          ],
        }
      : {
          eyebrow: "My tickets / Orders",
          title: "Ticket history and orders",
          description:
            "This page is intended for upcoming tickets, payment status, invoices, and complete transaction history returned by the back-end.",
          image:
            "https://images.pexels.com/photos/7235814/pexels-photo-7235814.jpeg?auto=compress&cs=tinysrgb&w=1200",
          sections: [
            {
              title: "Upcoming tickets",
              desc: "Displays booked tickets, booking codes, cinemas, seats, and showtimes from the API.",
            },
            {
              title: "Paid orders",
              desc: "Displays payment history, invoices, refund state, and transaction records from the database.",
            },
            {
              title: "Search & filters",
              desc: "Reserved for filtering by period, order status, cinema, or payment method after API integration.",
            },
          ],
        };

  return (
    <RequireSignIn>
      <SupportPageLayout {...content} />
    </RequireSignIn>
  );
}

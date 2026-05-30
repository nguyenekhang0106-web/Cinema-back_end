"use client";

import { useState, useEffect } from "react";
import {
  GiftOutlined,
  ProfileOutlined,
  StarOutlined,
  TagOutlined,
  CrownOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  Card,
  Col,
  Row,
  Space,
  Tag,
  Typography,
  Tabs,
  Button,
  Table,
  Empty,
  App,
} from "antd";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { useDictionary, useLocale } from "../components/locale-provider";
import { SiteShell } from "../components/site-shell";
import { useAuthSession } from "../components/auth-session-provider";
import {
  getMyProfile,
  getMyTicketsApi,
  getMyVouchersApi,
  collectVoucherApi,
} from "../lib/cinema-api";

export default function MemberPage() {
  const { message } = App.useApp();
  const dictionary = useDictionary();
  const locale = useLocale();
  const router = useRouter();
  const { token } = useAuthSession();

  // State dữ liệu
  const [tier, setTier] = useState("BASIC");
  const [points, setPoints] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);

  const [allPromotions, setAllPromotions] = useState<any[]>([]);
  const [myVouchers, setMyVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Hàm format chuẩn hóa dữ liệu dùng chung
  const formatVouchers = (vouchers: any[]) => {
    const now = dayjs();
    return vouchers
      .filter((v: any) => dayjs(v.validUntil).isAfter(now))
      .map((v: any) => ({
        id: v.id,
        key: v.id,
        code: v.discountCode,
        title: v.title,
        discount: `${v.discountPercent}%`,
        expireAt: dayjs(v.validUntil).format("HH:mm DD/MM/YYYY"),
        isUsed: v.isUsed,
        validUntil: v.validUntil,
        target: v.target,
        validFrom: v.validFrom,
        requiredRewardPoints: v.requiredRewardPoints,
        requiredMemberTier: v.requiredMemberTier,
        isBirthdayPromo: v.isBirthdayPromo,
      }));
  };

  useEffect(() => {
    setLoading(true);
    const now = dayjs();

    // 1. Lấy danh sách Khuyến mãi chung của hệ thống
    fetch("http://localhost:9090/cinema/promotions")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.result) {
          const validPromos = data.result.filter((promo: any) =>
            dayjs(promo.validUntil).isAfter(now),
          );
          setAllPromotions(validPromos);
        }
      })
      .catch((err) => console.error("Lỗi lấy khuyến mãi:", err));

    // 2. Lấy dữ liệu cá nhân nếu đã đăng nhập
    if (token) {
      Promise.all([
        getMyProfile(token),
        getMyTicketsApi(token),
        getMyVouchersApi(token),
      ])
        .then(([profileData, ticketData, voucherData]) => {
          if (profileData) {
            setTier(profileData.memberTier || "BASIC");
            setPoints(profileData.totalRewardPoints || 0);
          }
          if (ticketData && ticketData.result) {
            setTicketCount(ticketData.result.length);
          }
          if (voucherData && voucherData.result) {
            setMyVouchers(formatVouchers(voucherData.result));
          }
        })
        .catch((err) => console.error("Lỗi tải dữ liệu:", err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  // Hàm xử lý khi User bấm "Nhận" mã
  const handleCollect = async (promoId: string) => {
    if (!token) {
      message.warning(
        locale === "vi"
          ? "Vui lòng đăng nhập để nhận mã!"
          : "Please login to collect vouchers!",
      );
      router.push("/dang-nhap");
      return;
    }

    try {
      await collectVoucherApi(token, promoId);
      message.success(
        locale === "vi"
          ? "Nhận mã thành công! Đã lưu vào ví của bạn."
          : "Voucher collected successfully!",
      );

      // Load lại ví voucher để cập nhật trạng thái
      const res = await getMyVouchersApi(token);
      if (res.result) {
        setMyVouchers(formatVouchers(res.result));
      }
    } catch (err: any) {
      message.error(err.message || "Không thể nhận mã lúc này.");
    }
  };

  // Hàm chuyển đổi Target thành text
  const getTargetLabel = (target: string) => {
    if (target === "TICKET")
      return locale === "vi" ? "Áp dụng: Giá vé" : "For: Tickets";
    if (target === "CONCESSION")
      return locale === "vi" ? "Áp dụng: Bắp nước" : "For: Concessions";
    return locale === "vi" ? "Áp dụng: Toàn bộ đơn hàng" : "For: All items";
  };

  // Cấu hình bảng hiển thị trong Tab 2
  const myVoucherColumns = [
    {
      title: "Mã giảm giá",
      dataIndex: "code",
      key: "code",
      render: (text: string) => (
        <Typography.Text strong className="text-[#a61d24]">
          {text}
        </Typography.Text>
      ),
    },
    { title: "Ưu đãi", dataIndex: "title", key: "title" },
    {
      title: "Phạm vi",
      dataIndex: "target",
      key: "target",
      render: (target: string) => (
        <Tag color="blue">{getTargetLabel(target)}</Tag>
      ),
    },
    {
      title: "Hạn dùng",
      dataIndex: "validUntil",
      key: "date",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_: any, record: any) => {
        if (record.isUsed) return <Tag color="default">Đã dùng</Tag>;
        if (dayjs().isAfter(dayjs(record.validUntil)))
          return <Tag color="red">Hết hạn</Tag>;
        return <Tag color="green">Sẵn sàng</Tag>;
      },
    },
  ];

  const now = dayjs();

  const availableVouchers = myVouchers.filter(
    (v) =>
      !v.isUsed &&
      dayjs(v.validFrom).isBefore(now) &&
      dayjs(v.validUntil).isAfter(now),
  );

  const tierPromotions = allPromotions.filter(
    (promo) =>
      promo.requiredMemberTier &&
      promo.requiredMemberTier !== "BASIC" &&
      dayjs(promo.validFrom).isBefore(now) &&
      dayjs(promo.validUntil).isAfter(now),
  );

  const pointPromotions = allPromotions.filter(
    (promo) =>
      promo.requiredRewardPoints > 0 &&
      dayjs(promo.validFrom).isBefore(now) &&
      dayjs(promo.validUntil).isAfter(now),
  );

  return (
    <div className="cinema-page">
      {/* CSS Tab Đỏ */}
      <style>{`
        .member-tabs .ant-tabs-tab.ant-tabs-tab-active {
          background-color: #a61d24 !important;
          border-color: #a61d24 !important;
        }
        .member-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #ffffff !important;
          font-weight: 700;
        }
        .member-tabs .ant-tabs-tab:hover {
          background-color: #ef4444 !important;
          border-color: #ef4444 !important;
        }
        .member-tabs .ant-tabs-tab:hover .ant-tabs-tab-btn {
          color: #ffffff !important;
        }
      `}</style>

      <SiteShell>
        <main className="cinema-shell px-4 py-8 sm:px-6">
          {/* Hàng 1: Cấp bậc & Lịch sử vé */}
          <Row gutter={[24, 24]} className="mb-6">
            <Col xs={24} md={12}>
              <Card
                bordered={false}
                className="cinema-paper rounded-[24px] h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 border-orange-400"
                onClick={() =>
                  router.push(locale === "vi" ? "/user" : "/en/user")
                }
              >
                <div className="flex justify-between items-center">
                  <Space direction="vertical" size={4}>
                    <Typography.Text
                      type="secondary"
                      className="uppercase text-xs font-bold tracking-widest"
                    >
                      {locale === "vi" ? "Hạng hiện tại" : "Current Tier"}
                    </Typography.Text>
                    <Typography.Title
                      level={3}
                      style={{ margin: 0, color: "#a61d24" }}
                    >
                      {tier}
                    </Typography.Title>
                    <Typography.Text className="text-gray-500">
                      {token
                        ? `Bạn đang có ${points} điểm thưởng`
                        : "Đăng nhập để xem điểm"}
                    </Typography.Text>
                  </Space>
                  <StarOutlined
                    style={{ color: "#c89a2b", fontSize: 48, opacity: 0.8 }}
                  />
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card
                bordered={false}
                className="cinema-paper rounded-[24px] h-full hover:shadow-md transition-shadow cursor-pointer border-l-4 border-blue-400"
                onClick={() =>
                  router.push(
                    locale === "vi"
                      ? "/user?tab=history"
                      : "/en/user?tab=history",
                  )
                }
              >
                <div className="flex justify-between items-center">
                  <Space direction="vertical" size={4}>
                    <Typography.Text
                      type="secondary"
                      className="uppercase text-xs font-bold tracking-widest"
                    >
                      {locale === "vi" ? "Tổng vé đã đặt" : "Total Bookings"}
                    </Typography.Text>
                    <Typography.Title
                      level={3}
                      style={{ margin: 0, color: "#1677ff" }}
                    >
                      {ticketCount} Vé
                    </Typography.Title>
                    <Typography.Text className="text-gray-500">
                      {token
                        ? "Cảm ơn bạn đã đồng hành cùng KCT"
                        : "Đăng nhập để xem lịch sử"}
                    </Typography.Text>
                  </Space>
                  <ProfileOutlined
                    style={{ color: "#1677ff", fontSize: 48, opacity: 0.8 }}
                  />
                </div>
              </Card>
            </Col>
          </Row>

          {/* 🔥 Hàng 2: 3 Thẻ thông tin Ưu đãi (Mới bổ sung) */}
          <Row gutter={[24, 24]} className="mb-8">
            <Col xs={24} md={8}>
              <Card
                bordered={false}
                className="cinema-paper rounded-[24px] h-full border-t-4 border-[#a61d24]"
              >
                <Space direction="vertical" size={10} className="w-full">
                  <div className="flex gap-3 items-center">
                    <TagOutlined style={{ fontSize: 24, color: "#a61d24" }} />
                    <Typography.Title level={4} style={{ margin: 0 }}>
                      Voucher khả dụng
                    </Typography.Title>
                  </div>

                  {availableVouchers.slice(0, 4).map((voucher) => (
                    <div
                      key={voucher.id}
                      className="rounded-xl border border-red-100 bg-red-50/40 p-3"
                    >
                      <div className="flex justify-between gap-2">
                        <div>
                          <Typography.Text strong className="text-[#a61d24]">
                            {voucher.code}
                          </Typography.Text>
                          <div className="text-xs text-gray-600">
                            {voucher.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            HSD:{" "}
                            {dayjs(voucher.validUntil).format(
                              "DD/MM/YYYY HH:mm",
                            )}
                          </div>
                          <Tag color="green" className="mt-1">
                            Sẵn sàng
                          </Tag>
                        </div>

                        <Button
                          size="small"
                          disabled
                          className="rounded-full font-semibold px-3"
                        >
                          Đã nhận
                        </Button>
                      </div>
                    </div>
                  ))}
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                bordered={false}
                className="cinema-paper rounded-[24px] h-full border-t-4 border-yellow-500"
              >
                <Space direction="vertical" size={10} className="w-full">
                  <div className="flex gap-3 items-center">
                    <CrownOutlined style={{ fontSize: 24, color: "#eab308" }} />
                    <Typography.Title level={4} style={{ margin: 0 }}>
                      Ưu đãi theo hạng
                    </Typography.Title>
                  </div>

                  {tierPromotions.slice(0, 4).map((promo) => {
                    const isCollected = myVouchers.some(
                      (v) => v.id === promo.id,
                    );

                    return (
                      <div
                        key={promo.id}
                        className="rounded-xl border border-yellow-100 bg-yellow-50/40 p-3"
                      >
                        <div className="flex justify-between gap-2">
                          <div>
                            <Typography.Text strong>
                              {promo.title}
                            </Typography.Text>
                            <div className="text-xs text-gray-600">
                              {promo.discountCode}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              HSD:{" "}
                              {dayjs(promo.validUntil).format(
                                "DD/MM/YYYY HH:mm",
                              )}
                            </div>
                            <Tag color="purple" className="mt-1">
                              Hạng: {promo.requiredMemberTier}
                            </Tag>
                          </div>

                          <Button
                            type={isCollected ? "default" : "primary"}
                            size="small"
                            danger={!isCollected}
                            disabled={isCollected}
                            className="rounded-full font-semibold px-3"
                            onClick={() => handleCollect(promo.id)}
                          >
                            {isCollected ? "Đã nhận" : "Nhận mã"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                bordered={false}
                className="cinema-paper rounded-[24px] h-full border-t-4 border-blue-500"
              >
                <Space direction="vertical" size={10} className="w-full">
                  <div className="flex gap-3 items-center">
                    <TrophyOutlined
                      style={{ fontSize: 24, color: "#3b82f6" }}
                    />
                    <Typography.Title level={4} style={{ margin: 0 }}>
                      Ưu đãi theo điểm
                    </Typography.Title>
                  </div>

                  {pointPromotions.slice(0, 4).map((promo) => {
                    const isCollected = myVouchers.some(
                      (v) => v.id === promo.id,
                    );

                    return (
                      <div
                        key={promo.id}
                        className="rounded-xl border border-blue-100 bg-blue-50/40 p-3"
                      >
                        <div className="flex justify-between gap-2">
                          <div>
                            <Typography.Text strong>
                              {promo.title}
                            </Typography.Text>
                            <div className="text-xs text-gray-600">
                              {promo.discountCode}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              HSD:{" "}
                              {dayjs(promo.validUntil).format(
                                "DD/MM/YYYY HH:mm",
                              )}
                            </div>
                            <Tag color="cyan" className="mt-1">
                              Cần {promo.requiredRewardPoints} điểm
                            </Tag>
                          </div>

                          <Button
                            type={isCollected ? "default" : "primary"}
                            size="small"
                            danger={!isCollected}
                            disabled={isCollected}
                            className="rounded-full font-semibold px-3"
                            onClick={() => handleCollect(promo.id)}
                          >
                            {isCollected ? "Đã nhận" : "Nhận mã"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Khu vực chính: Voucher & Ưu đãi */}
          <Card
            bordered={false}
            className="cinema-paper rounded-[24px] overflow-hidden"
          >
            <div className="bg-[#a61d24] p-4 -mx-6 -mt-6 mb-6 flex items-center gap-3">
              <GiftOutlined style={{ color: "#fff", fontSize: 24 }} />
              <Typography.Title level={4} style={{ margin: 0, color: "#fff" }}>
                {locale === "vi"
                  ? "Kho Voucher & Khuyến Mãi"
                  : "Vouchers & Promotions"}
              </Typography.Title>
            </div>

            <Tabs
              className="member-tabs"
              defaultActiveKey="1"
              type="card"
              size="large"
              items={[
                {
                  key: "1",
                  label: "Chương trình Khuyến mãi",
                  children: (
                    <div className="py-4">
                      <Row gutter={[20, 20]}>
                        {allPromotions.length > 0 ? (
                          allPromotions.map((promo) => {
                            // Kiểm tra xem User đã nhận mã này chưa
                            const isCollected = myVouchers.some(
                              (v) => v.id === promo.id,
                            );
                            const isNotStarted = dayjs().isBefore(
                              dayjs(promo.validFrom),
                            );

                            return (
                              <Col xs={24} sm={12} lg={8} key={promo.id}>
                                <Card
                                  className="rounded-xl border-dashed border-red-200 hover:border-red-500 transition-colors h-full flex flex-col justify-between"
                                  bodyStyle={{
                                    padding: "16px",
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                  }}
                                >
                                  <div className="flex-1 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                      <Tag
                                        color="red"
                                        className="w-fit m-0 text-sm"
                                      >
                                        {promo.discountPercent}% OFF
                                      </Tag>
                                      <Tag color="blue" className="m-0">
                                        {getTargetLabel(promo.target)}
                                      </Tag>
                                    </div>
                                    <Typography.Title
                                      level={5}
                                      className="!m-0 mt-2"
                                    >
                                      {promo.title}
                                    </Typography.Title>
                                    <Typography.Text
                                      type="secondary"
                                      className="text-xs line-clamp-2"
                                    >
                                      {promo.description ||
                                        "Áp dụng cho toàn bộ các suất chiếu tại hệ thống."}
                                    </Typography.Text>
                                    <div className="mt-auto space-y-1">
                                      <Typography.Text className="block text-xs text-gray-500">
                                        Bắt đầu:{" "}
                                        {dayjs(promo.validFrom).format(
                                          "DD/MM/YYYY HH:mm",
                                        )}
                                      </Typography.Text>

                                      <Typography.Text className="block text-xs text-gray-500">
                                        HSD:{" "}
                                        {dayjs(promo.validUntil).format(
                                          "DD/MM/YYYY HH:mm",
                                        )}
                                      </Typography.Text>

                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {promo.requiredMemberTier &&
                                          promo.requiredMemberTier !==
                                            "BASIC" && (
                                            <Tag
                                              color="purple"
                                              className="w-fit m-0"
                                            >
                                              Hạng: {promo.requiredMemberTier}
                                            </Tag>
                                          )}

                                        {promo.requiredRewardPoints > 0 && (
                                          <Tag
                                            color="cyan"
                                            className="w-fit m-0"
                                          >
                                            Cần {promo.requiredRewardPoints}{" "}
                                            điểm
                                          </Tag>
                                        )}

                                        {promo.isBirthdayPromo && (
                                          <Tag
                                            color="magenta"
                                            className="w-fit m-0"
                                          >
                                            Sinh nhật
                                          </Tag>
                                        )}

                                        {isNotStarted && (
                                          <Tag
                                            color="gold"
                                            className="w-fit m-0"
                                          >
                                            Chưa có hiệu lực
                                          </Tag>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                                    <Typography.Text className="font-mono font-bold text-[#a61d24]">
                                      {promo.discountCode}
                                    </Typography.Text>
                                    <Button
                                      type={isCollected ? "default" : "primary"}
                                      size="small"
                                      danger={!isCollected && !isNotStarted}
                                      disabled={isCollected || isNotStarted}
                                      className="rounded-full font-semibold px-4"
                                      onClick={() => handleCollect(promo.id)}
                                    >
                                      {isCollected
                                        ? "Đã nhận"
                                        : isNotStarted
                                          ? "Chưa tới hạn"
                                          : "Nhận mã"}
                                    </Button>
                                  </div>
                                </Card>
                              </Col>
                            );
                          })
                        ) : (
                          <Empty
                            description="Hiện chưa có chương trình khuyến mãi nào"
                            className="w-full py-10"
                          />
                        )}
                      </Row>
                    </div>
                  ),
                },
                {
                  key: "2",
                  label: "Voucher của bạn",
                  children: (
                    <div className="py-4">
                      {token ? (
                        <Table
                          dataSource={myVouchers}
                          columns={myVoucherColumns}
                          rowKey="id"
                          pagination={{
                            pageSize: 5,
                            position: ["bottomCenter"],
                            showSizeChanger: false,
                          }}
                          className="border border-gray-100 rounded-lg shadow-sm"
                          scroll={{ x: "max-content" }}
                        />
                      ) : (
                        <div className="text-center py-10">
                          <Typography.Paragraph className="text-gray-500 text-lg">
                            Vui lòng đăng nhập để xem kho Voucher cá nhân của
                            bạn.
                          </Typography.Paragraph>
                          <Button
                            type="primary"
                            danger
                            size="large"
                            className="rounded-full px-8 mt-2"
                            onClick={() => router.push("/dang-nhap")}
                          >
                            Đăng nhập ngay
                          </Button>
                        </div>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </main>
      </SiteShell>
    </div>
  );
}

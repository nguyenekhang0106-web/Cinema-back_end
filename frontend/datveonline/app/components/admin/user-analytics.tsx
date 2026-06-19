"use client";

import { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Table, Tag, Progress, Tabs } from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import dayjs, { Dayjs } from "dayjs";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_CINEMA_API_URL ?? "http://localhost:9090/cinema"
).replace(/\/$/, "");

const STATISTICS_API_BASE_URL = `${API_BASE_URL}/statistics`;

interface UserAnalyticsProps {
  dateRange: [Dayjs, Dayjs] | null;
}

const cardHeaderStyle = {
  backgroundColor: "#a61d24",
  borderTopLeftRadius: "12px",
  borderTopRightRadius: "12px",
  borderBottom: "none",
  padding: "16px 24px",
};

export default function UserAnalytics({ dateRange }: UserAnalyticsProps) {
  const [cancellationData, setCancellationData] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [userOverview, setUserOverview] = useState({
    totalUsers: 0,
    activeUsers: 0,
  });
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [tierStats, setTierStats] = useState<any[]>([]); // 🔥 STATE CHO HẠNG THÀNH VIÊN
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserAnalytics = async () => {
      setLoading(true);
      try {
        const startDateObj = dateRange
          ? dateRange[0]
          : dayjs().subtract(7, "day");
        const endDateObj = dateRange ? dateRange[1] : dayjs();

        const start = startDateObj.format("YYYY-MM-DD");
        const end = endDateObj.format("YYYY-MM-DD");

        let token = null;
        const sessionStr = localStorage.getItem("kct-auth-session");
        if (sessionStr) {
          try {
            token = JSON.parse(sessionStr).token;
          } catch (e) {}
        }
        if (!token)
          token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        if (token === "null" || token === "undefined") token = null;

        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const baseUrl = STATISTICS_API_BASE_URL;

        // Gọi 5 luồng dữ liệu thật cùng lúc
        const [resCancel, resTop, resOverview, resGrowth, resTier] =
          await Promise.all([
            fetch(
              `${baseUrl}/cancellations?startDate=${start}&endDate=${end}`,
              { headers },
            ).catch(() => null),
            fetch(
              `${baseUrl}/top-customers?startDate=${start}&endDate=${end}`,
              { headers },
            ).catch(() => null),
            fetch(
              `${baseUrl}/user-overview?startDate=${start}&endDate=${end}`,
              { headers },
            ).catch(() => null),
            fetch(`${baseUrl}/user-growth?startDate=${start}&endDate=${end}`, {
              headers,
            }).catch(() => null),
            fetch(`${baseUrl}/tier-stats?startDate=${start}&endDate=${end}`, {
              headers,
            }).catch(() => null), // Gọi API Hạng
          ]);

        if (resCancel && resCancel.ok) {
          const dataCancel = await resCancel.json();
          if (dataCancel.code === 1000) {
            const rawDbData = dataCancel.result || [];
            const fullDateRange = [];
            let currDate = dayjs(start);
            const stopDate = dayjs(end);

            while (
              currDate.isBefore(stopDate) ||
              currDate.isSame(stopDate, "day")
            ) {
              fullDateRange.push({
                date: currDate.format("DD/MM"),
                totalOrders: 0,
                cancelledOrders: 0,
                cancellationRate: 0,
              });
              currDate = currDate.add(1, "day");
            }

            const mergedData = fullDateRange.map((blankDay) => {
              const foundInDb = rawDbData.find(
                (dbItem: any) => dbItem.date === blankDay.date,
              );
              return foundInDb ? foundInDb : blankDay;
            });
            setCancellationData(mergedData);
          }
        }

        if (resTop && resTop.ok) {
          const dataTop = await resTop.json();
          if (dataTop.code === 1000) setTopCustomers(dataTop.result || []);
        }
        if (resOverview && resOverview.ok) {
          const dataOverview = await resOverview.json();
          if (dataOverview.code === 1000)
            setUserOverview(
              dataOverview.result || { totalUsers: 0, activeUsers: 0 },
            );
        }
        if (resGrowth && resGrowth.ok) {
          const dataGrowth = await resGrowth.json();
          if (dataGrowth.code === 1000) setGrowthData(dataGrowth.result || []);
        }
        // Nạp dữ liệu Hạng thành viên
        if (resTier && resTier.ok) {
          const dataTier = await resTier.json();
          if (dataTier.code === 1000) setTierStats(dataTier.result || []);
        }
      } catch (error) {
        console.error("Lỗi lấy dữ liệu người dùng", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAnalytics();
  }, [dateRange]);

  const totalOrders = cancellationData.reduce(
    (sum, item) => sum + (item.totalOrders || 0),
    0,
  );
  const totalCancellations = cancellationData.reduce(
    (sum, item) => sum + (item.cancelledOrders || 0),
    0,
  );
  const avgCancellationRate =
    totalOrders > 0 ? (totalCancellations / totalOrders) * 100 : 0;

  return (
    <div className="space-y-6">
      <style>{`
        .custom-table .ant-table-thead > tr > th {
          background-color: #fff1f0 !important;
          color: #a61d24 !important;
          font-weight: 700 !important;
          text-transform: uppercase;
          font-size: 13px;
          border-bottom: 2px solid #ffccc7 !important;
        }
        .custom-table .ant-table-tbody > tr:hover > td { background-color: #fffbfb !important; }
      `}</style>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card
            className="shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50/40"
            loading={loading}
            bordered={false}
          >
            <Statistic
              title={
                <span className="text-gray-600 font-medium">
                  Tổng User Hệ Thống
                </span>
              }
              value={userOverview.totalUsers}
              valueStyle={{ color: "#1890ff", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            className="shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-green-500 bg-gradient-to-br from-white to-green-50/40"
            loading={loading}
            bordered={false}
          >
            <Statistic
              title={
                <span className="text-gray-600 font-medium">
                  Khách Đã Chi Tiền
                </span>
              }
              value={userOverview.activeUsers}
              valueStyle={{ color: "#52c41a", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            className="shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-[#a61d24] bg-gradient-to-br from-white to-red-50/30"
            loading={loading}
            bordered={false}
          >
            <Statistic
              title={
                <span className="text-gray-600 font-medium">
                  Tỷ Lệ Hủy TB Hệ Thống
                </span>
              }
              value={avgCancellationRate}
              suffix="%"
              precision={1}
              valueStyle={{ color: "#a61d24", fontWeight: "bold" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            className="shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-orange-500 bg-gradient-to-br from-white to-orange-50/40"
            loading={loading}
            bordered={false}
          >
            <Statistic
              title={
                <span className="text-gray-600 font-medium">
                  Tổng Đơn Hủy Tích Lũy
                </span>
              }
              value={totalCancellations}
              formatter={(value) => (value as number).toLocaleString("vi-VN")}
            />
          </Card>
        </Col>
      </Row>

      <Card
        className="shadow-sm border-0 bg-transparent"
        bodyStyle={{ padding: 0 }}
      >
        <Tabs
          type="card"
          className="custom-tabs"
          items={[
            {
              key: "topCustomers",
              label: (
                <span className="font-semibold text-base px-4">
                  👑 Khách Hàng Thân Thiết
                </span>
              ),
              children: (
                <div className="space-y-6 mt-4">
                  {/* 🔥 PHẦN ĐÃ CHỈNH SỬA: HIỂN THỊ DỮ LIỆU ĐỘNG TỪNG HẠNG VỚI MÀU SẮC NỔI BẬT */}
                  <Row gutter={[16, 16]} className="mb-4">
                    {tierStats.length > 0 ? (
                      tierStats.map((stat, index) => {
                        // Xác định màu sắc theo hạng
                        let tierColor = "#595959"; // BASIC (Xám đậm)
                        if (stat.tier === "SILVER")
                          tierColor = "#8c8c8c"; // Bạc
                        else if (stat.tier === "GOLD")
                          tierColor = "#ffa940"; // Vàng
                        else if (stat.tier === "PLATINUM")
                          tierColor = "#722ed1"; // Tím/Bạch kim

                        return (
                          <Col xs={24} sm={12} md={6} key={index}>
                            <Card
                              className="shadow-sm border-t-4 bg-gray-50 rounded-xl"
                              style={{ borderTopColor: tierColor }}
                            >
                              <Statistic
                                title={
                                  <span className="text-gray-500 text-xs uppercase tracking-wider">
                                    Tổng chi tiêu nhóm{" "}
                                    <strong
                                      style={{
                                        color: tierColor,
                                        fontSize: "15px",
                                        letterSpacing: "0.5px",
                                      }}
                                    >
                                      {stat.tier}
                                    </strong>
                                  </span>
                                }
                                value={stat.totalSpent}
                                prefix="₫"
                                valueStyle={{
                                  fontSize: "18px",
                                  fontWeight: "bold",
                                }}
                                formatter={(val) => {
                                  const num = val as number;
                                  return num >= 1000000
                                    ? `${(num / 1000000).toFixed(1)}M`
                                    : num.toLocaleString("vi-VN");
                                }}
                              />
                              <Statistic
                                className="mt-3 pt-3 border-t border-gray-200"
                                title={
                                  <span className="text-gray-500 text-xs uppercase tracking-wider">
                                    Tổng số vé nhóm{" "}
                                    <strong
                                      style={{
                                        color: tierColor,
                                        fontSize: "15px",
                                        letterSpacing: "0.5px",
                                      }}
                                    >
                                      {stat.tier}
                                    </strong>
                                  </span>
                                }
                                value={stat.bookings}
                                valueStyle={{ fontSize: "16px" }}
                              />
                            </Card>
                          </Col>
                        );
                      })
                    ) : (
                      <Col xs={24}>
                        <div className="text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          Chưa có phát sinh giao dịch của thành viên trong thời
                          gian này
                        </div>
                      </Col>
                    )}
                  </Row>

                  <Card
                    title={
                      <span className="text-lg font-bold text-white tracking-wide">
                        🏆 Bảng Xếp Hạng Khách Hàng
                      </span>
                    }
                    headStyle={cardHeaderStyle}
                    className="shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden border-0"
                    bodyStyle={{ padding: 0 }}
                  >
                    <Table
                      loading={loading}
                      className="custom-table"
                      dataSource={topCustomers.map((item, index) => ({
                        key: index,
                        rank: index + 1,
                        ...item,
                      }))}
                      columns={[
                        {
                          title: "Xếp Hạng",
                          dataIndex: "rank",
                          key: "rank",
                          width: 80,
                          align: "center",
                          render: (rank) => {
                            let rankColor = "#8c8c8c";
                            let rankWeight = "font-normal";
                            if (rank === 1) {
                              rankColor = "#ffa940";
                              rankWeight = "font-bold text-lg";
                            } else if (rank === 2) {
                              rankColor = "#bfbfbf";
                              rankWeight = "font-bold text-lg";
                            } else if (rank === 3) {
                              rankColor = "#c18f5e";
                              rankWeight = "font-bold text-lg";
                            }
                            return (
                              <span
                                className={rankWeight}
                                style={{ color: rankColor }}
                              >
                                #{rank}
                              </span>
                            );
                          },
                        },
                        {
                          title: "Tên Khách Hàng",
                          dataIndex: "name",
                          key: "name",
                          render: (text) => (
                            <span className="font-medium text-gray-800">
                              {text}
                            </span>
                          ),
                        },
                        {
                          title: "Email",
                          dataIndex: "email",
                          key: "email",
                          render: (text) => (
                            <span className="text-gray-500">{text}</span>
                          ),
                        },
                        {
                          title: "Số Vé Đã Mua",
                          dataIndex: "bookings",
                          key: "bookings",
                          align: "center",
                          render: (text) => (
                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                              {text}
                            </span>
                          ),
                          sorter: (a, b) => a.bookings - b.bookings,
                        },
                        {
                          title: "Tổng Chi Tiêu",
                          dataIndex: "totalSpent",
                          key: "totalSpent",
                          align: "right",
                          render: (text) => (
                            <strong className="text-[#a61d24]">{`${(text as number).toLocaleString("vi-VN")}₫`}</strong>
                          ),
                          sorter: (a, b) => a.totalSpent - b.totalSpent,
                        },
                        {
                          title: "Giao Dịch Gần Nhất",
                          dataIndex: "lastBooking",
                          key: "lastBooking",
                          align: "center",
                        },
                      ]}
                      pagination={{ pageSize: 10 }}
                    />
                  </Card>
                </div>
              ),
            },
            {
              key: "cancellation",
              label: (
                <span className="font-semibold text-base px-4">
                  ❌ Tỷ Lệ Hủy Vé
                </span>
              ),
              children: (
                <div className="space-y-6 mt-4">
                  <Card
                    title={
                      <span className="text-lg font-bold text-white tracking-wide">
                        📉 Biểu Đồ Tỷ Lệ Hủy Vé
                      </span>
                    }
                    headStyle={cardHeaderStyle}
                    className="shadow-sm rounded-xl overflow-hidden border-0"
                  >
                    <ResponsiveContainer
                      width="100%"
                      height={300}
                      className="mt-4"
                    >
                      <LineChart data={cancellationData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e5e7eb"
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                          formatter={(value) => `${value}%`}
                        />
                        <Legend wrapperStyle={{ paddingTop: "10px" }} />
                        <Line
                          type="monotone"
                          dataKey="cancellationRate"
                          stroke="#a61d24"
                          strokeWidth={3}
                          name="Tỷ lệ hủy (%)"
                          dot={{
                            r: 4,
                            fill: "#a61d24",
                            strokeWidth: 2,
                            stroke: "#fff",
                          }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              ),
            },
            {
              key: "growth",
              label: (
                <span className="font-semibold text-base px-4">
                  📈 Tăng Trưởng User
                </span>
              ),
              children: (
                <div className="space-y-6 mt-4">
                  <Card
                    title={
                      <span className="text-lg font-bold text-white tracking-wide">
                        👥 Biểu Đồ Xu Hướng Tăng Trưởng & Hoạt Động
                      </span>
                    }
                    headStyle={cardHeaderStyle}
                    className="shadow-sm rounded-xl overflow-hidden border-0"
                  >
                    <ResponsiveContainer
                      width="100%"
                      height={300}
                      className="mt-4"
                    >
                      <LineChart data={growthData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e5e7eb"
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: "10px" }} />
                        <Line
                          type="monotone"
                          dataKey="newUsers"
                          stroke="#1890ff"
                          strokeWidth={3}
                          name="Tài khoản mới"
                          dot={{
                            r: 4,
                            fill: "#1890ff",
                            strokeWidth: 2,
                            stroke: "#fff",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="activeUsers"
                          stroke="#52c41a"
                          strokeWidth={2}
                          name="User hoạt động (Mua vé)"
                          dot={{
                            r: 4,
                            fill: "#52c41a",
                            strokeWidth: 2,
                            stroke: "#fff",
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

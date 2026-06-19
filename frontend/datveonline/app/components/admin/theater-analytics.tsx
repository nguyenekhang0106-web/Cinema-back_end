"use client";

import { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Table, Progress, Tag, Tabs } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import dayjs, { Dayjs } from "dayjs";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_CINEMA_API_URL ?? "http://localhost:9090/cinema"
).replace(/\/$/, "");

const STATISTICS_API_BASE_URL = `${API_BASE_URL}/statistics`;

interface TheaterAnalyticsProps {
  selectedTheater: string;
  dateRange?: [Dayjs, Dayjs] | null; // Nhận thêm dateRange từ component cha
}

const COLORS = ["#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1"];

const cardHeaderStyle = {
  backgroundColor: "#a61d24",
  borderTopLeftRadius: "12px",
  borderTopRightRadius: "12px",
  borderBottom: "none",
  padding: "16px 24px",
};

export default function TheaterAnalytics({
  selectedTheater,
  dateRange,
}: TheaterAnalyticsProps) {
  const [cinemaData, setCinemaData] = useState<any[]>([]);
  const [hallData, setHallData] = useState<any[]>([]);
  const [seatData, setSeatData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTheaterAnalytics = async () => {
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

        // Gọi 3 API cùng lúc
        const [resCinema, resHall, resSeat] = await Promise.all([
          fetch(`${baseUrl}/cinema-stats?startDate=${start}&endDate=${end}`, {
            headers,
          }).catch(() => null),
          fetch(
            `${baseUrl}/hall-performance?startDate=${start}&endDate=${end}&cinemaId=${selectedTheater}`,
            { headers },
          ).catch(() => null),
          fetch(
            `${baseUrl}/seat-stats?startDate=${start}&endDate=${end}&cinemaId=${selectedTheater}`,
            { headers },
          ).catch(() => null),
        ]);

        if (resCinema && resCinema.ok) {
          const data = await resCinema.json();
          if (data.code === 1000) setCinemaData(data.result || []);
        }
        if (resHall && resHall.ok) {
          const data = await resHall.json();
          if (data.code === 1000) setHallData(data.result || []);
        }
        if (resSeat && resSeat.ok) {
          const data = await resSeat.json();
          if (data.code === 1000) setSeatData(data.result || []);
        }
      } catch (error) {
        console.error("Lỗi lấy dữ liệu Rạp", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTheaterAnalytics();
  }, [dateRange, selectedTheater]);

  // Tính toán KPI Tổng quan
  const totalRevenue = cinemaData.reduce(
    (sum, item) => sum + (item.revenue || 0),
    0,
  );
  const avgOccupancy =
    hallData.length > 0
      ? hallData.reduce((sum, item) => sum + (item.avgOccupancy || 0), 0) /
        hallData.length
      : 0;
  const totalHalls = hallData.length;
  const totalSeats = hallData.reduce(
    (sum, item) => sum + (item.totalSeats || 0),
    0,
  );

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
            className="shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-[#a61d24] bg-gradient-to-br from-white to-red-50/30"
            loading={loading}
            bordered={false}
          >
            <Statistic
              title={
                <span className="text-gray-600 font-medium">
                  Tổng Doanh Thu Hệ Thống
                </span>
              }
              value={totalRevenue}
              suffix="₫"
              valueStyle={{ color: "#a61d24", fontWeight: "bold" }}
              formatter={(val) => `${(val as number).toLocaleString("vi-VN")}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            className="shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50/40"
            loading={loading}
            bordered={false}
          >
            <Statistic
              title={
                <span className="text-gray-600 font-medium">
                  Tỷ Lệ Lấp Đầy TB Phòng
                </span>
              }
              value={avgOccupancy}
              suffix="%"
              precision={1}
              valueStyle={{ color: "#1890ff", fontWeight: "bold" }}
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
                  Phòng Chiếu Hoạt Động
                </span>
              }
              value={totalHalls}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            className="shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-purple-500 bg-gradient-to-br from-white to-purple-50/40"
            loading={loading}
            bordered={false}
          >
            <Statistic
              title={
                <span className="text-gray-600 font-medium">
                  Tổng Sức Chứa (Ghế)
                </span>
              }
              value={totalSeats}
              formatter={(value) => (value as number).toLocaleString("vi-VN")}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Card
        className="shadow-sm border-0 bg-transparent"
        bodyStyle={{ padding: 0 }}
      >
        <Tabs
          type="card"
          className="custom-tabs"
          items={[
            {
              key: "theaters",
              label: (
                <span className="font-semibold text-base px-4">
                  🏢 Hiệu Suất Theo Cụm Rạp
                </span>
              ),
              children: (
                <div className="space-y-6 mt-4">
                  <Card
                    title={
                      <span className="text-lg font-bold text-white tracking-wide">
                        📊 Doanh Thu Các Cụm Rạp
                      </span>
                    }
                    headStyle={cardHeaderStyle}
                    className="shadow-sm rounded-xl overflow-hidden border-0"
                  >
                    <ResponsiveContainer
                      width="100%"
                      height={320}
                      className="mt-4"
                    >
                      <BarChart data={cinemaData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e5e7eb"
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) =>
                            `${(val / 1000000).toFixed(0)}M`
                          }
                        />
                        <Tooltip
                          cursor={{ fill: "#f3f4f6" }}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                          formatter={(value) =>
                            `${(value as number).toLocaleString("vi-VN")} ₫`
                          }
                        />
                        <Legend wrapperStyle={{ paddingTop: "10px" }} />
                        <Bar
                          dataKey="revenue"
                          fill="#a61d24"
                          name="Doanh thu thực tế"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={60}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card
                    title={
                      <span className="text-lg font-bold text-white tracking-wide">
                        🏆 Bảng Xếp Hạng Cụm Rạp
                      </span>
                    }
                    headStyle={cardHeaderStyle}
                    className="shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden border-0"
                    bodyStyle={{ padding: 0 }}
                  >
                    <Table
                      loading={loading}
                      className="custom-table"
                      dataSource={cinemaData.map((item, index) => ({
                        key: index,
                        rank: index + 1,
                        ...item,
                      }))}
                      columns={[
                        {
                          title: "Top",
                          dataIndex: "rank",
                          key: "rank",
                          width: 80,
                          align: "center",
                          render: (rank) => (
                            <span className="font-bold text-gray-500">
                              #{rank}
                            </span>
                          ),
                        },
                        {
                          title: "Tên Rạp",
                          dataIndex: "name",
                          key: "name",
                          render: (text) => (
                            <span className="font-medium text-gray-800">
                              {text}
                            </span>
                          ),
                        },
                        {
                          title: "Địa Điểm",
                          dataIndex: "location",
                          key: "location",
                          render: (text) => <Tag color="geekblue">{text}</Tag>,
                        },
                        {
                          title: "Vé Đã Bán",
                          dataIndex: "totalTickets",
                          key: "totalTickets",
                          align: "center",
                          render: (text) => (
                            <span className="bg-gray-100 px-3 py-1 rounded-full">
                              {text}
                            </span>
                          ),
                        },
                        {
                          title: "Doanh Thu",
                          dataIndex: "revenue",
                          key: "revenue",
                          align: "right",
                          render: (text) => (
                            <strong className="text-[#a61d24]">{`${(text as number).toLocaleString("vi-VN")}₫`}</strong>
                          ),
                          sorter: (a, b) => a.revenue - b.revenue,
                        },
                      ]}
                      pagination={{ pageSize: 5 }}
                    />
                  </Card>
                </div>
              ),
            },
            {
              key: "halls",
              label: (
                <span className="font-semibold text-base px-4">
                  🏛️ Hiệu Suất Phòng Chiếu
                </span>
              ),
              children: (
                <div className="space-y-6 mt-4">
                  <Card
                    title={
                      <span className="text-lg font-bold text-white tracking-wide">
                        🎬 Bảng Thống Kê Phòng Chiếu
                      </span>
                    }
                    headStyle={cardHeaderStyle}
                    className="shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden border-0"
                    bodyStyle={{ padding: 0 }}
                  >
                    <Table
                      loading={loading}
                      className="custom-table"
                      dataSource={hallData.map((item, index) => ({
                        key: index,
                        ...item,
                      }))}
                      columns={[
                        {
                          title: "Tên Phòng",
                          dataIndex: "hallName",
                          key: "hallName",
                          render: (text) => (
                            <span className="font-medium text-gray-800">
                              {text}
                            </span>
                          ),
                        },
                        {
                          title: "Định Dạng",
                          dataIndex: "format",
                          key: "format",
                          align: "center",
                          render: (text) => <Tag color="blue">{text}</Tag>,
                        },
                        {
                          title: "Tổng Ghế",
                          dataIndex: "totalSeats",
                          key: "totalSeats",
                          align: "center",
                        },
                        {
                          title: "Tỷ Lệ Lấp Đầy",
                          dataIndex: "avgOccupancy",
                          key: "avgOccupancy",
                          align: "center",
                          render: (text) => (
                            <Progress
                              type="dashboard"
                              percent={Number(text)}
                              width={45}
                              strokeColor="#a61d24"
                              format={(p) => (
                                <span className="text-xs">{p}%</span>
                              )}
                            />
                          ),
                          sorter: (a, b) => a.avgOccupancy - b.avgOccupancy,
                        },
                        {
                          title: "Doanh Thu",
                          dataIndex: "revenue",
                          key: "revenue",
                          align: "right",
                          render: (text) => (
                            <strong className="text-[#a61d24]">{`${((text as number) / 1000000).toFixed(1)}M₫`}</strong>
                          ),
                          sorter: (a, b) => a.revenue - b.revenue,
                        },
                      ]}
                      pagination={{ pageSize: 10 }}
                    />
                  </Card>
                </div>
              ),
            },
            {
              key: "seats",
              label: (
                <span className="font-semibold text-base px-4">
                  🪑 Loại Ghế
                </span>
              ),
              children: (
                <div className="space-y-6 mt-4">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Card
                        title={
                          <span className="text-lg font-bold text-white tracking-wide">
                            🥧 Phân Bổ Loại Ghế Đã Bán
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
                          <PieChart>
                            <Pie
                              data={
                                seatData.length > 0
                                  ? seatData
                                  : [
                                      {
                                        seatType: "Chưa có dữ liệu",
                                        booked: 1,
                                        percentage: 100,
                                      },
                                    ]
                              }
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="booked"
                              label={({ seatType, percentage }) =>
                                seatType !== "Chưa có dữ liệu"
                                  ? `${seatType}: ${percentage}%`
                                  : seatType
                              }
                              labelLine={false}
                            >
                              {seatData.length > 0 ? (
                                seatData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                    stroke="none"
                                  />
                                ))
                              ) : (
                                <Cell fill="#f3f4f6" stroke="none" />
                              )}
                            </Pie>
                            {seatData.length > 0 && (
                              <Tooltip
                                contentStyle={{
                                  borderRadius: "8px",
                                  border: "none",
                                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                                formatter={(value) =>
                                  (value as number).toLocaleString("vi-VN")
                                }
                              />
                            )}
                          </PieChart>
                        </ResponsiveContainer>
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card
                        title={
                          <span className="text-lg font-bold text-white tracking-wide">
                            📊 Tỷ Lệ Lựa Chọn Theo Loại
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
                          <BarChart data={seatData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#e5e7eb"
                            />
                            <XAxis
                              dataKey="seatType"
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip
                              cursor={{ fill: "#f3f4f6" }}
                              contentStyle={{
                                borderRadius: "8px",
                                border: "none",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                              }}
                              formatter={(value) => `${value}%`}
                            />
                            <Legend wrapperStyle={{ paddingTop: "10px" }} />
                            <Bar
                              dataKey="percentage"
                              fill="#1890ff"
                              name="Tỷ lệ đặt (%)"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={50}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </Card>
                    </Col>
                  </Row>

                  <Card
                    className="shadow-sm rounded-xl overflow-hidden border-0"
                    bodyStyle={{ padding: 0 }}
                  >
                    <Table
                      loading={loading}
                      className="custom-table"
                      dataSource={seatData.map((item, index) => ({
                        key: index,
                        ...item,
                      }))}
                      columns={[
                        {
                          title: "Loại Ghế",
                          dataIndex: "seatType",
                          key: "seatType",
                          render: (text) => (
                            <span className="font-medium text-gray-800 uppercase">
                              {text}
                            </span>
                          ),
                        },
                        {
                          title: "Ghế Được Đặt",
                          dataIndex: "booked",
                          key: "booked",
                          align: "center",
                          render: (text) => (
                            <span className="bg-gray-100 px-3 py-1 rounded-full">
                              {text}
                            </span>
                          ),
                        },
                        {
                          title: "Tỷ Lệ Lựa Chọn",
                          dataIndex: "percentage",
                          key: "percentage",
                          render: (text) => (
                            <Progress
                              percent={text as number}
                              strokeColor="#a61d24"
                            />
                          ),
                          sorter: (a, b) => a.percentage - b.percentage,
                        },
                      ]}
                      pagination={false}
                    />
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

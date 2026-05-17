"use client";

import { useEffect, useState } from "react";
import { Card, Row, Col, Table, Progress, Statistic, Tag, Tabs } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import dayjs, { Dayjs } from "dayjs";

interface MoviePerformanceProps {
  dateRange: [Dayjs, Dayjs] | null;
  selectedTheater: string;
}

const cardHeaderStyle = {
  backgroundColor: "#a61d24",
  borderTopLeftRadius: "12px",
  borderTopRightRadius: "12px",
  borderBottom: "none",
  padding: "16px 24px",
};

export default function MoviePerformance({
  dateRange,
  selectedTheater,
}: MoviePerformanceProps) {
  const [movieData, setMovieData] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [hallData, setHallData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMoviePerformance = async () => {
      setLoading(true);
      try {
        const start = dateRange
          ? dateRange[0].format("YYYY-MM-DD")
          : dayjs().subtract(7, "day").format("YYYY-MM-DD");
        const end = dateRange
          ? dateRange[1].format("YYYY-MM-DD")
          : dayjs().format("YYYY-MM-DD");

        let token = null;
        const sessionStr = localStorage.getItem("kct-auth-session");
        if (sessionStr) {
          try {
            token = JSON.parse(sessionStr).token;
          } catch (e) {
            console.error(e);
          }
        }
        if (!token)
          token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        if (token === "null" || token === "undefined") token = null;

        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const baseUrl = "http://localhost:9090/cinema/statistics";

        const [resMovie, resHourly, resHall] = await Promise.all([
          fetch(
            `${baseUrl}/movie-performance?startDate=${start}&endDate=${end}&cinemaId=${selectedTheater}`,
            { headers },
          ),
          fetch(
            `${baseUrl}/hourly-trends?startDate=${start}&endDate=${end}&cinemaId=${selectedTheater}`,
            { headers },
          ),
          fetch(
            `${baseUrl}/hall-performance?startDate=${start}&endDate=${end}&cinemaId=${selectedTheater}`,
            { headers },
          ),
        ]);

        const dataMovie = await resMovie.json();
        const dataHourly = await resHourly.json();
        const dataHall = await resHall.json();

        if (dataMovie.code === 1000) setMovieData(dataMovie.result || []);
        if (dataHourly.code === 1000) setHourlyData(dataHourly.result || []);
        if (dataHall.code === 1000) setHallData(dataHall.result || []);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu thống kê phim", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMoviePerformance();
  }, [dateRange, selectedTheater]);

  const avgOccupancy =
    movieData.length > 0
      ? movieData.reduce((sum, item) => sum + item.occupancyRate, 0) /
        movieData.length
      : 0;
  const totalTickets = movieData.reduce(
    (sum, item) => sum + item.ticketsSold,
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
        .custom-table .ant-table-tbody > tr:hover > td {
          background-color: #fffbfb !important;
        }
      `}</style>

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
                  Tỷ Lệ Lấp Đầy TB
                </span>
              }
              value={avgOccupancy}
              suffix="%"
              precision={1}
              valueStyle={{ color: "#a61d24", fontWeight: "bold" }}
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
                  Tổng Vé Bán Ra
                </span>
              }
              value={totalTickets}
              formatter={(val) => Number(val).toLocaleString("vi-VN")}
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
                  Phim Đã Bán Vé
                </span>
              }
              value={movieData.length}
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
                  Phim Ăn Khách Nhất
                </span>
              }
              value={
                movieData.length > 0
                  ? movieData[0]?.title.substring(0, 15) + "..."
                  : "Chưa có"
              }
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
              key: "boxoffice",
              label: (
                <span className="font-semibold text-base px-4">
                  🎬 Top Phim Ăn Khách
                </span>
              ),
              children: (
                <div className="space-y-6 mt-4">
                  <Card
                    title={
                      <span className="text-lg font-bold text-white tracking-wide">
                        📊 Biểu Đồ Số Lượng Vé Phim
                      </span>
                    }
                    headStyle={cardHeaderStyle}
                    className="shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden border-0"
                  >
                    {movieData.length > 0 ? (
                      <ResponsiveContainer
                        width="100%"
                        height={320}
                        className="mt-4"
                      >
                        <BarChart data={movieData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="title"
                            angle={-45}
                            textAnchor="end"
                            height={120}
                            fontSize={11}
                            tickMargin={5}
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
                            formatter={(value) =>
                              `${(value as number).toLocaleString("vi-VN")} vé`
                            }
                          />
                          <Legend wrapperStyle={{ paddingTop: "10px" }} />
                          <Bar
                            dataKey="ticketsSold"
                            fill="#1890ff"
                            name="Số vé bán ra"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={60}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-50/50 rounded-lg border border-dashed border-gray-200 mt-4">
                        Không có dữ liệu phim
                      </div>
                    )}
                  </Card>

                  <Card
                    title={
                      <span className="text-lg font-bold text-white tracking-wide">
                        🏆 Bảng Xếp Hạng Doanh Thu Phim
                      </span>
                    }
                    headStyle={cardHeaderStyle}
                    className="shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden border-0"
                    bodyStyle={{ padding: 0 }}
                  >
                    <Table
                      loading={loading}
                      className="custom-table"
                      dataSource={movieData.map((item, index) => ({
                        key: index,
                        ...item,
                      }))}
                      columns={[
                        // 👇 BẮT ĐẦU CHỈNH SỬA CỘT HẠNG Ở ĐÂY 👇
                        {
                          title: "Hạng",
                          width: 80,
                          align: "center",
                          render: (_, __, index) => {
                            const rank = index + 1;
                            let rankColor = "#8c8c8c"; // Màu xám mặc định cho hạng > 3
                            let rankWeight = "font-normal"; // Mặc định bỏ in đậm cho hạng > 3

                            if (rank === 1) {
                              rankColor = "#ffa940"; // Vàng Gold ấm
                              rankWeight = "font-bold text-lg"; // Đậm và to hơn
                            } else if (rank === 2) {
                              rankColor = "#bfbfbf"; // Bạc Silver lạnh
                              rankWeight = "font-bold text-lg";
                            } else if (rank === 3) {
                              rankColor = "#c18f5e"; // Đồng Bronze ấm
                              rankWeight = "font-bold text-lg";
                            }

                            // Áp dụng style màu sắc cho cả dấu # và số
                            return (
                              <span
                                className={`${rankWeight}`}
                                style={{ color: rankColor }}
                              >
                                #{rank}
                              </span>
                            );
                          },
                        },
                        // 👆 KẾT THÚC CHỈNH SỬA CỘT HẠNG 👆
                        {
                          title: "Tên Phim",
                          dataIndex: "title",
                          key: "title",
                          render: (text) => (
                            <span className="font-medium text-gray-800">
                              {text}
                            </span>
                          ),
                        },
                        {
                          title: "Thể Loại",
                          dataIndex: "genre",
                          key: "genre",
                          render: (text) => <Tag color="red">{text}</Tag>,
                        },
                        {
                          title: "Vé Bán",
                          dataIndex: "ticketsSold",
                          key: "ticketsSold",
                          align: "center",
                          render: (text) => (
                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                              {Number(text).toLocaleString("vi-VN")}
                            </span>
                          ),
                          sorter: (a, b) => a.ticketsSold - b.ticketsSold,
                        },
                        {
                          title: "Tỷ Lệ Lấp Đầy",
                          dataIndex: "occupancyRate",
                          key: "occupancyRate",
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
                          sorter: (a, b) => a.occupancyRate - b.occupancyRate,
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
              key: "hourly",
              label: (
                <span className="font-semibold text-base px-4">
                  ⏰ Giờ Cao Điểm
                </span>
              ),
              children: (
                <div className="space-y-4 mt-4">
                  <Card
                    title={
                      <span className="text-lg font-bold text-white tracking-wide">
                        📈 Biểu Đồ Lượng Vé Mua Theo Giờ (Real-time)
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
                      <LineChart data={hourlyData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e5e7eb"
                        />
                        <XAxis
                          dataKey="time"
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: "8px", border: "none" }}
                          formatter={(val) => `${val} vé`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="tickets"
                          stroke="#a61d24"
                          strokeWidth={3}
                          name="Số lượng vé bán ra"
                          dot={{
                            r: 4,
                            fill: "#a61d24",
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
            {
              key: "hall",
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
                        🏢 Bảng Thống Kê Phòng Chiếu Thực Tế
                      </span>
                    }
                    headStyle={cardHeaderStyle}
                    className="shadow-sm rounded-xl overflow-hidden border-0"
                    bodyStyle={{ padding: 0 }}
                  >
                    <Table
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
                          render: (text) => (
                            <span className="bg-gray-100 px-3 py-1 rounded-full">
                              {text}
                            </span>
                          ),
                        },
                        {
                          title: "Tỷ Lệ Lấp Đầy",
                          dataIndex: "avgOccupancy",
                          key: "avgOccupancy",
                          align: "center",
                          render: (text) => (
                            <Progress
                              percent={Number(text)}
                              strokeColor="#a61d24"
                            />
                          ),
                        },
                        {
                          title: "Doanh Thu",
                          dataIndex: "revenue",
                          key: "revenue",
                          align: "right",
                          render: (text) => (
                            <strong className="text-[#a61d24] bg-red-50 px-3 py-1 rounded-full">{`${(Number(text) / 1000000).toFixed(1)}M₫`}</strong>
                          ),
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

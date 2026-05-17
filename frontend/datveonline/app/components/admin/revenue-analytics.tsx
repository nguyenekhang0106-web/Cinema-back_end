"use client";

import { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Table } from "antd";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import dayjs, { Dayjs } from "dayjs";

interface RevenueAnalyticsProps {
  dateRange: [Dayjs, Dayjs] | null;
  selectedTheater: string;
}

const COLORS = ["#a61d24", "#faad14", "#1890ff", "#52c41a", "#722ed1"];

const cardHeaderStyle = {
  backgroundColor: "#a61d24",
  borderTopLeftRadius: "12px",
  borderTopRightRadius: "12px",
  borderBottom: "none",
  padding: "16px 24px",
};

export default function RevenueAnalytics({
  dateRange,
  selectedTheater,
}: RevenueAnalyticsProps) {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [movieRevenueData, setMovieRevenueData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
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
            const sessionObj = JSON.parse(sessionStr);
            token = sessionObj.token;
          } catch (e) {
            console.error(e);
          }
        }

        if (!token) {
          token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        }
        if (token === "null" || token === "undefined") token = null;

        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const baseUrl = "http://localhost:9090/cinema/statistics";
        const [resRevenue, resMovie, resWeekly, resPayment] = await Promise.all(
          [
            fetch(
              `${baseUrl}/revenue-by-date?startDate=${start}&endDate=${end}&cinemaId=${selectedTheater}`,
              { headers },
            ),
            fetch(
              `${baseUrl}/revenue-by-movie?startDate=${start}&endDate=${end}&cinemaId=${selectedTheater}`,
              { headers },
            ),
            fetch(
              `${baseUrl}/revenue-by-week?startDate=${start}&endDate=${end}&cinemaId=${selectedTheater}`,
              { headers },
            ),
            fetch(
              `${baseUrl}/payment-methods?startDate=${start}&endDate=${end}&cinemaId=${selectedTheater}`,
              { headers },
            ),
          ],
        );

        // 🔥 THUẬT TOÁN LẤP ĐẦY NGÀY TRỐNG CHO BIỂU ĐỒ DOANH THU
        const dataRevenue = await resRevenue.json();
        if (dataRevenue.code === 1000) {
          const rawDbData = dataRevenue.result || [];

          // Tạo mảng chứa toàn bộ các ngày từ start đến end
          const fullDateRange = [];
          let currDate = dayjs(start);
          const stopDate = dayjs(end);

          while (
            currDate.isBefore(stopDate) ||
            currDate.isSame(stopDate, "day")
          ) {
            fullDateRange.push({
              date: currDate.format("DD/MM"),
              revenue: 0,
              ticket: 0,
              fnb: 0,
            });
            currDate = currDate.add(1, "day");
          }

          // Ghi đè dữ liệu DB vào mảng đầy đủ
          const mergedData = fullDateRange.map((blankDay) => {
            const foundInDb = rawDbData.find(
              (dbItem: any) => dbItem.date === blankDay.date,
            );
            return foundInDb ? foundInDb : blankDay;
          });

          setRevenueData(mergedData);
        } else {
          setRevenueData([]);
        }

        const dataMovie = await resMovie.json();
        const dataWeekly = await resWeekly.json();
        const dataPayment = await resPayment.json();

        if (dataMovie.code === 1000)
          setMovieRevenueData(dataMovie.result || []);
        if (dataWeekly.code === 1000) setWeeklyData(dataWeekly.result || []);
        if (dataPayment.code === 1000) setPaymentData(dataPayment.result || []);
      } catch (error) {
        console.error("Lỗi lấy dữ liệu thống kê", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange, selectedTheater]);

  const totalRevenue = revenueData.reduce(
    (sum, item) => sum + (item.revenue || 0),
    0,
  );
  const totalTicketRevenue = revenueData.reduce(
    (sum, item) => sum + (item.ticket || 0),
    0,
  );
  const totalFNBRevenue = revenueData.reduce(
    (sum, item) => sum + (item.fnb || 0),
    0,
  );
  const fnbPercentage =
    totalRevenue > 0 ? (totalFNBRevenue / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
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
                  Tổng Doanh Thu
                </span>
              }
              value={totalRevenue}
              suffix="₫"
              valueStyle={{ color: "#a61d24", fontWeight: "bold" }}
              formatter={(v) => `${(v as number).toLocaleString("vi-VN")}`}
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
                <span className="text-gray-600 font-medium">Doanh Thu Vé</span>
              }
              value={totalTicketRevenue}
              suffix="₫"
              formatter={(v) => `${(v as number).toLocaleString("vi-VN")}`}
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
                <span className="text-gray-600 font-medium">Doanh Thu F&B</span>
              }
              value={totalFNBRevenue}
              suffix="₫"
              formatter={(v) => `${(v as number).toLocaleString("vi-VN")}`}
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
                <span className="text-gray-600 font-medium">Tỷ lệ F&B</span>
              }
              value={fnbPercentage}
              suffix="%"
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      {/* BIỂU ĐỒ DOANH THU */}
      <Card
        title={
          <span className="text-lg font-bold text-white tracking-wide">
            📈 Xu Hướng Doanh Thu Theo Ngày
          </span>
        }
        headStyle={cardHeaderStyle}
        className="shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden border-0"
        loading={loading}
      >
        {revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart
              data={revenueData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e7eb"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value / 1000000}M`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value) =>
                  `${(value as number).toLocaleString("vi-VN")}₫`
                }
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#a61d24"
                strokeWidth={3}
                name="Tổng doanh thu"
                dot={{ r: 4, fill: "#a61d24", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="ticket"
                stroke="#1890ff"
                strokeWidth={2}
                name="Doanh thu vé"
              />
              <Line
                type="monotone"
                dataKey="fnb"
                stroke="#faad14"
                strokeWidth={2}
                name="Doanh thu F&B"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-50/50 rounded-lg border border-dashed border-gray-200 mt-4">
            Chưa có phát sinh giao dịch trong khoảng thời gian này
          </div>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title={
              <span className="text-lg font-bold text-white tracking-wide">
                📊 So Sánh Doanh Thu Tuần
              </span>
            }
            headStyle={cardHeaderStyle}
            className="shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden border-0 h-full"
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={300} className="mt-4">
              <BarChart data={weeklyData} margin={{ top: 10 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="period"
                  fontSize={11}
                  tickMargin={10}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value / 1000000}M`}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value) =>
                    `${(value as number).toLocaleString("vi-VN")}₫`
                  }
                />
                <Legend wrapperStyle={{ paddingTop: "10px" }} />
                <Bar
                  dataKey="revenue"
                  fill="#a61d24"
                  name="Thực tế"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
                <Bar
                  dataKey="target"
                  fill="#e5e7eb"
                  name="Mục tiêu"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <span className="text-lg font-bold text-white tracking-wide">
                💳 Phương Thức Thanh Toán
              </span>
            }
            headStyle={cardHeaderStyle}
            className="shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden border-0 h-full"
            loading={loading}
          >
            <ResponsiveContainer width="100%" height={300} className="mt-4">
              <PieChart>
                <Pie
                  data={
                    paymentData.length > 0
                      ? paymentData
                      : [{ name: "Chưa có dữ liệu", value: 100 }]
                  }
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) =>
                    paymentData.length > 0 ? `${name}: ${value}%` : name
                  }
                  labelLine={false}
                >
                  {paymentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        paymentData.length > 0
                          ? COLORS[index % COLORS.length]
                          : "#f3f4f6"
                      }
                      stroke="none"
                    />
                  ))}
                </Pie>
                {paymentData.length > 0 && (
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value) => `${value}%`}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* BẢNG DOANH THU THEO PHIM */}
      <Card
        title={
          <span className="text-lg font-bold text-white tracking-wide">
            🎬 Phân Bổ Doanh Thu Theo Phim
          </span>
        }
        headStyle={cardHeaderStyle}
        className="shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden border-0"
        loading={loading}
        bodyStyle={{ padding: "0px" }}
      >
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

        <Table
          dataSource={movieRevenueData.map((item, index) => ({
            key: index,
            ...item,
          }))}
          columns={[
            {
              title: "Tên Phim",
              dataIndex: "movieName",
              key: "movieName",
              render: (text) => (
                <span className="font-medium text-gray-800">{text}</span>
              ),
            },
            {
              title: "Doanh Thu",
              dataIndex: "revenue",
              key: "revenue",
              align: "right",
              render: (text) => (
                <strong className="text-[#a61d24] text-base bg-red-50 px-3 py-1 rounded-full">
                  {`${(text as number).toLocaleString("vi-VN")}₫`}
                </strong>
              ),
              sorter: (a, b) => a.revenue - b.revenue,
            },
            {
              title: "Số Lượng Vé",
              dataIndex: "tickets",
              key: "tickets",
              align: "center",
              render: (text) => (
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                  {Number(text).toLocaleString("vi-VN")}
                </span>
              ),
              sorter: (a, b) => a.tickets - b.tickets,
            },
            {
              title: "Doanh Thu Trung Bình / Vé",
              key: "avgPrice",
              align: "right",
              render: (_, record) => (
                <span className="text-gray-500">
                  {`${Math.round(record.tickets > 0 ? record.revenue / record.tickets : 0).toLocaleString("vi-VN")}₫`}
                </span>
              ),
            },
          ]}
          pagination={{ pageSize: 5 }}
          className="custom-table"
        />
      </Card>
    </div>
  );
}

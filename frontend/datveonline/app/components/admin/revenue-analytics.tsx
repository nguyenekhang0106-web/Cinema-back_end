"use client";

import { Card, Row, Col, Statistic, Table, Select, Space, Segmented } from "antd";
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
import { Dayjs } from "dayjs";

interface RevenueAnalyticsProps {
  dateRange: [Dayjs, Dayjs] | null;
  selectedTheater: string;
}

const COLORS = ["#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1"];

// Mock data for revenue
const mockRevenueData = [
  { date: "01/05", revenue: 45000000, ticket: 30000000, fnb: 15000000 },
  { date: "02/05", revenue: 52000000, ticket: 35000000, fnb: 17000000 },
  { date: "03/05", revenue: 48000000, ticket: 32000000, fnb: 16000000 },
  { date: "04/05", revenue: 61000000, ticket: 40000000, fnb: 21000000 },
  { date: "05/05", revenue: 58000000, ticket: 38000000, fnb: 20000000 },
  { date: "06/05", revenue: 72000000, ticket: 48000000, fnb: 24000000 },
  { date: "07/05", revenue: 68000000, ticket: 45000000, fnb: 23000000 },
];

const mockRevenueByMovie = [
  { name: "Avatar: The Way of Water", revenue: 320000000, tickets: 85000 },
  { name: "Fast & Furious 10", revenue: 280000000, tickets: 72000 },
  { name: "Oppenheimer", revenue: 210000000, tickets: 50000 },
  { name: "Barbie", revenue: 195000000, tickets: 48000 },
  { name: "Dune: Part 2", revenue: 175000000, tickets: 45000 },
];

const mockPaymentMethods = [
  { name: "Ví điện tử (Momo)", value: 45 },
  { name: "Thẻ ngân hàng", value: 35 },
  { name: "Điểm thưởng/Voucher", value: 15 },
  { name: "Tiền mặt", value: 5 },
];

const mockRevenueComparison = [
  { period: "Tuần 1", revenue: 310000000, target: 300000000 },
  { period: "Tuần 2", revenue: 340000000, target: 320000000 },
  { period: "Tuần 3", revenue: 380000000, target: 350000000 },
  { period: "Tuần 4", revenue: 420000000, target: 400000000 },
];

export default function RevenueAnalytics({
  dateRange,
  selectedTheater,
}: RevenueAnalyticsProps) {
  const totalRevenue = mockRevenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalTicketRevenue = mockRevenueData.reduce((sum, item) => sum + item.ticket, 0);
  const totalFNBRevenue = mockRevenueData.reduce((sum, item) => sum + item.fnb, 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <Statistic
              title="Tổng Doanh Thu"
              value={totalRevenue}
              suffix="₫"
              formatter={(value) => {
                const val = value as number;
                if (val >= 1000000) {
                  return `${(val / 1000000).toFixed(1)}M`;
                }
                return val.toLocaleString("vi-VN");
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm border-l-4 border-l-green-500">
            <Statistic
              title="Doanh Thu Vé"
              value={totalTicketRevenue}
              suffix="₫"
              formatter={(value) => {
                const val = value as number;
                if (val >= 1000000) {
                  return `${(val / 1000000).toFixed(1)}M`;
                }
                return val.toLocaleString("vi-VN");
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm border-l-4 border-l-orange-500">
            <Statistic
              title="Doanh Thu F&B"
              value={totalFNBRevenue}
              suffix="₫"
              formatter={(value) => {
                const val = value as number;
                if (val >= 1000000) {
                  return `${(val / 1000000).toFixed(1)}M`;
                }
                return val.toLocaleString("vi-VN");
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm border-l-4 border-l-purple-500">
            <Statistic
              title="Tỷ lệ F&B"
              value={(totalFNBRevenue / totalRevenue) * 100}
              suffix="%"
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      {/* Revenue Trend Chart */}
      <Card title="📈 Xu Hướng Doanh Thu Theo Ngày" className="shadow-sm">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockRevenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              formatter={(value) => `${(value as number).toLocaleString("vi-VN")}₫`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#1890ff"
              strokeWidth={2}
              name="Tổng doanh thu"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="ticket"
              stroke="#52c41a"
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
      </Card>

      {/* Revenue by Source and Comparison */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="📊 So Sánh Doanh Thu vs Mục Tiêu" className="shadow-sm">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockRevenueComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `${(value as number).toLocaleString("vi-VN")}₫`}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#1890ff" name="Doanh thu thực tế" />
                <Bar dataKey="target" fill="#d9d9d9" name="Mục tiêu" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="💳 Phương Thức Thanh Toán" className="shadow-sm">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockPaymentMethods}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockPaymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Revenue by Movie */}
      <Card title="🎬 Doanh Thu Theo Phim" className="shadow-sm">
        <Table
          dataSource={mockRevenueByMovie.map((item, index) => ({
            key: index,
            ...item,
          }))}
          columns={[
            {
              title: "Tên Phim",
              dataIndex: "name",
              key: "name",
            },
            {
              title: "Doanh Thu",
              dataIndex: "revenue",
              key: "revenue",
              render: (text) => `${(text as number).toLocaleString("vi-VN")}₫`,
              sorter: (a, b) => (a.revenue as number) - (b.revenue as number),
            },
            {
              title: "Số Lượng Vé",
              dataIndex: "tickets",
              key: "tickets",
              render: (text) => (text as number).toLocaleString("vi-VN"),
              sorter: (a, b) => (a.tickets as number) - (b.tickets as number),
            },
            {
              title: "Doanh Thu/Vé",
              dataIndex: "revenue",
              key: "avgPrice",
              render: (_, record) => {
                const avgPrice = (record.revenue as number) / (record.tickets as number);
                return `${avgPrice.toLocaleString("vi-VN")}₫`;
              },
            },
          ]}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}

"use client";

import { Card, Row, Col, Statistic, Table, Tag, Progress, Tabs, List } from "antd";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Dayjs } from "dayjs";

interface UserAnalyticsProps {
  dateRange: [Dayjs, Dayjs] | null;
}

// Mock data for new users
const mockNewUsers = [
  { date: "01/05", newUsers: 120, activeUsers: 2450 },
  { date: "02/05", newUsers: 145, activeUsers: 2580 },
  { date: "03/05", newUsers: 110, activeUsers: 2650 },
  { date: "04/05", newUsers: 160, activeUsers: 2780 },
  { date: "05/05", newUsers: 155, activeUsers: 2900 },
  { date: "06/05", newUsers: 200, activeUsers: 3080 },
  { date: "07/05", newUsers: 180, activeUsers: 3250 },
];

// Mock data for booking frequency
const mockBookingFrequency = [
  { frequency: "1-5 vé/tháng", count: 8450, percentage: 35 },
  { frequency: "6-10 vé/tháng", count: 5200, percentage: 22 },
  { frequency: "11-20 vé/tháng", count: 3800, percentage: 16 },
  { frequency: "21-50 vé/tháng", count: 2100, percentage: 9 },
  { frequency: ">50 vé/tháng", count: 4450, percentage: 18 },
];

// Mock data for cancellation rate
const mockCancellationData = [
  { date: "01/05", totalOrders: 450, cancelledOrders: 18, cancellationRate: 4 },
  { date: "02/05", totalOrders: 520, cancelledOrders: 20, cancellationRate: 3.8 },
  { date: "03/05", totalOrders: 480, cancelledOrders: 22, cancellationRate: 4.6 },
  { date: "04/05", totalOrders: 620, cancelledOrders: 24, cancellationRate: 3.9 },
  { date: "05/05", totalOrders: 580, cancelledOrders: 19, cancellationRate: 3.3 },
  { date: "06/05", totalOrders: 750, cancelledOrders: 25, cancellationRate: 3.3 },
  { date: "07/05", totalOrders: 680, cancelledOrders: 28, cancellationRate: 4.1 },
];

// Mock data for top customers
const mockTopCustomers = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    email: "nguyen.a@email.com",
    totalSpent: 18500000,
    bookings: 42,
    lastBooking: "2024-05-15",
    joinDate: "2023-01-10",
  },
  {
    id: 2,
    name: "Trần Thị B",
    email: "tran.b@email.com",
    totalSpent: 16200000,
    bookings: 38,
    lastBooking: "2024-05-14",
    joinDate: "2023-02-15",
  },
  {
    id: 3,
    name: "Lê Văn C",
    email: "le.c@email.com",
    totalSpent: 14800000,
    bookings: 35,
    lastBooking: "2024-05-13",
    joinDate: "2023-03-20",
  },
  {
    id: 4,
    name: "Phạm Thị D",
    email: "pham.d@email.com",
    totalSpent: 13500000,
    bookings: 32,
    lastBooking: "2024-05-12",
    joinDate: "2023-04-05",
  },
  {
    id: 5,
    name: "Hoàng Văn E",
    email: "hoang.e@email.com",
    totalSpent: 12900000,
    bookings: 30,
    lastBooking: "2024-05-11",
    joinDate: "2023-05-10",
  },
];

// Mock data for booking by hour
const mockBookingByHour = [
  { hour: "00:00-06:00", bookings: 45 },
  { hour: "06:00-12:00", bookings: 320 },
  { hour: "12:00-18:00", bookings: 680 },
  { hour: "18:00-24:00", bookings: 850 },
];

export default function UserAnalytics({ dateRange }: UserAnalyticsProps) {
  const totalNewUsers = mockNewUsers.reduce((sum, item) => sum + item.newUsers, 0);
  const avgActiveUsers =
    mockNewUsers.reduce((sum, item) => sum + item.activeUsers, 0) / mockNewUsers.length;
  const totalCancellations = mockCancellationData.reduce(
    (sum, item) => sum + item.cancelledOrders,
    0
  );
  const avgCancellationRate =
    mockCancellationData.reduce((sum, item) => sum + item.cancellationRate, 0) /
    mockCancellationData.length;
  const totalCustomers = mockTopCustomers.reduce((sum, item) => sum + item.bookings, 0);
  const totalMoneySpent = mockTopCustomers.reduce((sum, item) => sum + item.totalSpent, 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <Statistic
              title="User Mới"
              value={totalNewUsers}
              formatter={(value) => {
                const val = value as number;
                if (val >= 1000) {
                  return `${(val / 1000).toFixed(1)}K`;
                }
                return val.toLocaleString("vi-VN");
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm border-l-4 border-l-green-500">
            <Statistic
              title="User Hoạt Động TB"
              value={avgActiveUsers}
              precision={0}
              formatter={(value) => {
                const val = value as number;
                if (val >= 1000) {
                  return `${(val / 1000).toFixed(1)}K`;
                }
                return val.toLocaleString("vi-VN");
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm border-l-4 border-l-orange-500">
            <Statistic
              title="Tỷ Lệ Hủy TB"
              value={avgCancellationRate}
              suffix="%"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm border-l-4 border-l-purple-500">
            <Statistic
              title="Tổng Hủy Vé"
              value={totalCancellations}
              formatter={(value) => (value as number).toLocaleString("vi-VN")}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs for different views */}
      <Card className="shadow-sm">
        <Tabs
          items={[
            {
              key: "growth",
              label: "📈 Tăng Trưởng User",
              children: (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockNewUsers}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="newUsers"
                        stroke="#1890ff"
                        strokeWidth={2}
                        name="User mới"
                        dot={{ r: 4 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="activeUsers"
                        stroke="#52c41a"
                        strokeWidth={2}
                        name="User hoạt động"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ),
            },
            {
              key: "frequency",
              label: "🎫 Tần Suất Đặt Vé",
              children: (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockBookingFrequency}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="frequency" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => (value as number).toLocaleString("vi-VN")}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="#1890ff" name="Số lượng user" />
                    </BarChart>
                  </ResponsiveContainer>

                  <Table
                    dataSource={mockBookingFrequency.map((item, index) => ({
                      key: index,
                      ...item,
                    }))}
                    columns={[
                      {
                        title: "Tần Suất Đặt Vé",
                        dataIndex: "frequency",
                        key: "frequency",
                      },
                      {
                        title: "Số Lượng User",
                        dataIndex: "count",
                        key: "count",
                        render: (text) => (text as number).toLocaleString("vi-VN"),
                        sorter: (a, b) => (a.count as number) - (b.count as number),
                      },
                      {
                        title: "Tỷ Lệ",
                        dataIndex: "percentage",
                        key: "percentage",
                        render: (text) => (
                          <Progress
                            type="line"
                            percent={text as number}
                            format={(percent) => `${percent}%`}
                          />
                        ),
                      },
                    ]}
                    pagination={false}
                  />
                </div>
              ),
            },
            {
              key: "cancellation",
              label: "❌ Tỷ Lệ Hủy Vé",
              children: (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockCancellationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => `${value}%`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cancellationRate"
                        stroke="#f5222d"
                        strokeWidth={2}
                        name="Tỷ lệ hủy (%)"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  <Table
                    dataSource={mockCancellationData.map((item, index) => ({
                      key: index,
                      ...item,
                    }))}
                    columns={[
                      {
                        title: "Ngày",
                        dataIndex: "date",
                        key: "date",
                      },
                      {
                        title: "Tổng Đơn",
                        dataIndex: "totalOrders",
                        key: "totalOrders",
                        render: (text) => (text as number).toLocaleString("vi-VN"),
                      },
                      {
                        title: "Đơn Hủy",
                        dataIndex: "cancelledOrders",
                        key: "cancelledOrders",
                        render: (text) => (
                          <Tag color="red">{(text as number).toLocaleString("vi-VN")}</Tag>
                        ),
                      },
                      {
                        title: "Tỷ Lệ Hủy",
                        dataIndex: "cancellationRate",
                        key: "cancellationRate",
                        render: (text) => `${text}%`,
                        sorter: (a, b) =>
                          (a.cancellationRate as number) -
                          (b.cancellationRate as number),
                      },
                    ]}
                    pagination={{ pageSize: 10 }}
                  />
                </div>
              ),
            },
            {
              key: "topCustomers",
              label: "👑 Khách Hàng Thân Thiết",
              children: (
                <div className="space-y-6">
                  <Row gutter={[16, 16]} className="mb-4">
                    <Col xs={24} sm={12} md={8}>
                      <Card className="shadow-sm">
                        <Statistic
                          title="Tổng Chi Tiêu (Top 5)"
                          value={totalMoneySpent}
                          prefix="₫"
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
                    <Col xs={24} sm={12} md={8}>
                      <Card className="shadow-sm">
                        <Statistic
                          title="Tổng Booking"
                          value={totalCustomers}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Card className="shadow-sm">
                        <Statistic
                          title="Chi Tiêu Trung Bình"
                          value={totalMoneySpent / mockTopCustomers.length}
                          prefix="₫"
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
                  </Row>

                  <Table
                    dataSource={mockTopCustomers.map((item, index) => ({
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
                      },
                      {
                        title: "Tên Khách Hàng",
                        dataIndex: "name",
                        key: "name",
                      },
                      {
                        title: "Email",
                        dataIndex: "email",
                        key: "email",
                      },
                      {
                        title: "Booking",
                        dataIndex: "bookings",
                        key: "bookings",
                        render: (text) => <Tag color="blue">{text}</Tag>,
                        sorter: (a, b) => (a.bookings as number) - (b.bookings as number),
                      },
                      {
                        title: "Tổng Chi Tiêu",
                        dataIndex: "totalSpent",
                        key: "totalSpent",
                        render: (text) =>
                          `${((text as number) / 1000000).toFixed(1)}M₫`,
                        sorter: (a, b) =>
                          (a.totalSpent as number) - (b.totalSpent as number),
                      },
                      {
                        title: "Lần Booking Cuối",
                        dataIndex: "lastBooking",
                        key: "lastBooking",
                      },
                      {
                        title: "Ngày Tham Gia",
                        dataIndex: "joinDate",
                        key: "joinDate",
                      },
                    ]}
                    pagination={{ pageSize: 10 }}
                  />
                </div>
              ),
            },
            {
              key: "bookingTime",
              label: "⏰ Thời Gian Đặt Vé",
              children: (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockBookingByHour}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => (value as number).toLocaleString("vi-VN")}
                      />
                      <Legend />
                      <Bar dataKey="bookings" fill="#1890ff" name="Số lượng booking" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

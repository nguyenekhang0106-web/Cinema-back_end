"use client";

import { Card, Row, Col, Statistic, Table, Progress, Tag, Tabs } from "antd";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

interface TheaterAnalyticsProps {
  selectedTheater: string;
}

// Mock data for theaters
const mockTheaterPerformance = [
  {
    id: 1,
    name: "CGV Landmark 81",
    revenue: 450000000,
    occupancyRate: 82,
    totalTickets: 95000,
    location: "Ho Chi Minh City",
    totalHalls: 8,
    totalSeats: 1200,
  },
  {
    id: 2,
    name: "CGV Binh Duong",
    revenue: 320000000,
    occupancyRate: 75,
    totalTickets: 68000,
    location: "Binh Duong",
    totalHalls: 6,
    totalSeats: 900,
  },
  {
    id: 3,
    name: "CGV Ha Noi",
    revenue: 380000000,
    occupancyRate: 78,
    totalTickets: 80000,
    location: "Ha Noi",
    totalHalls: 7,
    totalSeats: 1050,
  },
];

// Mock data for seat types
const mockSeatTypeData = [
  { seatType: "Standard", count: 3200, percentage: 50 },
  { seatType: "VIP", count: 1600, percentage: 25 },
  { seatType: "Couple/Sweetbox", count: 800, percentage: 12.5 },
  { seatType: "Wheelchair", count: 400, percentage: 6.25 },
  { seatType: "Kids", count: 160, percentage: 2.5 },
];

// Mock data for seat selection
const mockSeatSelectionStats = [
  { seatType: "Standard", booked: 2400, percentage: 75 },
  { seatType: "VIP", booked: 1200, percentage: 75 },
  { seatType: "Couple/Sweetbox", booked: 760, percentage: 95 },
  { seatType: "Wheelchair", booked: 200, percentage: 50 },
  { seatType: "Kids", booked: 120, percentage: 75 },
];

// Mock data for theater comparison
const mockTheaterComparison = [
  {
    week: "Tuần 1",
    landmark: 85000000,
    binh: 60000000,
    hanoi: 70000000,
  },
  {
    week: "Tuần 2",
    landmark: 95000000,
    binh: 65000000,
    hanoi: 80000000,
  },
  {
    week: "Tuần 3",
    landmark: 110000000,
    binh: 75000000,
    hanoi: 90000000,
  },
  {
    week: "Tuần 4",
    landmark: 120000000,
    binh: 80000000,
    hanoi: 95000000,
  },
];

// Mock data for halls
const mockHallPerformance = [
  {
    hallId: 1,
    hallName: "Hall 1 - Standard",
    totalSeats: 150,
    bookedSeats: 125,
    occupancyRate: 83,
    revenue: 35000000,
    format: "2D",
  },
  {
    hallId: 2,
    hallName: "Hall 2 - IMAX",
    totalSeats: 200,
    bookedSeats: 185,
    occupancyRate: 92,
    revenue: 62000000,
    format: "IMAX",
  },
  {
    hallId: 3,
    hallName: "Hall 3 - 3D",
    totalSeats: 160,
    bookedSeats: 140,
    occupancyRate: 87,
    revenue: 48000000,
    format: "3D",
  },
  {
    hallId: 4,
    hallName: "Hall 4 - VIP",
    totalSeats: 80,
    bookedSeats: 68,
    occupancyRate: 85,
    revenue: 58000000,
    format: "2D",
  },
  {
    hallId: 5,
    hallName: "Hall 5 - Couple",
    totalSeats: 50,
    bookedSeats: 48,
    occupancyRate: 96,
    revenue: 42000000,
    format: "2D",
  },
  {
    hallId: 6,
    hallName: "Hall 6 - Standard",
    totalSeats: 140,
    bookedSeats: 110,
    occupancyRate: 78,
    revenue: 30000000,
    format: "2D",
  },
];

const COLORS = ["#1890ff", "#52c41a", "#faad14", "#f5222d", "#722ed1"];

export default function TheaterAnalytics({ selectedTheater }: TheaterAnalyticsProps) {
  const totalTheaterRevenue = mockTheaterPerformance.reduce(
    (sum, item) => sum + item.revenue,
    0
  );
  const avgOccupancy =
    mockTheaterPerformance.reduce((sum, item) => sum + item.occupancyRate, 0) /
    mockTheaterPerformance.length;
  const totalHalls = mockTheaterPerformance.reduce((sum, item) => sum + item.totalHalls, 0);
  const totalSeats = mockTheaterPerformance.reduce((sum, item) => sum + item.totalSeats, 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <Statistic
              title="Tổng Doanh Thu"
              value={totalTheaterRevenue}
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
              title="Tỷ Lệ Lấp Đầy TB"
              value={avgOccupancy}
              suffix="%"
              precision={1}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm border-l-4 border-l-orange-500">
            <Statistic title="Số Phòng Chiếu" value={totalHalls} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm border-l-4 border-l-purple-500">
            <Statistic title="Tổng Ghế" value={totalSeats} />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Card className="shadow-sm">
        <Tabs
          items={[
            {
              key: "theaters",
              label: "🏢 Hiệu Suất Theo Cụm Rạp",
              children: (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockTheaterComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) =>
                          `${((value as number) / 1000000).toFixed(0)}M₫`
                        }
                      />
                      <Legend />
                      <Bar dataKey="landmark" fill="#1890ff" name="Landmark 81" />
                      <Bar dataKey="binh" fill="#52c41a" name="Binh Duong" />
                      <Bar dataKey="hanoi" fill="#faad14" name="Ha Noi" />
                    </BarChart>
                  </ResponsiveContainer>

                  <Table
                    dataSource={mockTheaterPerformance.map((item, index) => ({
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
                        title: "Tên Rạp",
                        dataIndex: "name",
                        key: "name",
                      },
                      {
                        title: "Địa Điểm",
                        dataIndex: "location",
                        key: "location",
                      },
                      {
                        title: "Phòng Chiếu",
                        dataIndex: "totalHalls",
                        key: "totalHalls",
                      },
                      {
                        title: "Tổng Ghế",
                        dataIndex: "totalSeats",
                        key: "totalSeats",
                      },
                      {
                        title: "Doanh Thu",
                        dataIndex: "revenue",
                        key: "revenue",
                        render: (text) =>
                          `${((text as number) / 1000000).toFixed(1)}M₫`,
                        sorter: (a, b) => (a.revenue as number) - (b.revenue as number),
                      },
                      {
                        title: "Tỷ Lệ Lấp Đầy",
                        dataIndex: "occupancyRate",
                        key: "occupancyRate",
                        render: (text) => (
                          <Progress
                            type="circle"
                            percent={text as number}
                            width={50}
                            format={(percent) => `${percent}%`}
                          />
                        ),
                        sorter: (a, b) =>
                          (a.occupancyRate as number) - (b.occupancyRate as number),
                      },
                    ]}
                    pagination={{ pageSize: 10 }}
                  />
                </div>
              ),
            },
            {
              key: "halls",
              label: "🏛️ Hiệu Suất Phòng Chiếu",
              children: (
                <div className="space-y-6">
                  <Table
                    dataSource={mockHallPerformance.map((item, index) => ({
                      key: index,
                      ...item,
                    }))}
                    columns={[
                      {
                        title: "Tên Phòng",
                        dataIndex: "hallName",
                        key: "hallName",
                      },
                      {
                        title: "Định Dạng",
                        dataIndex: "format",
                        key: "format",
                        render: (text) => <Tag color="blue">{text}</Tag>,
                      },
                      {
                        title: "Tổng Ghế",
                        dataIndex: "totalSeats",
                        key: "totalSeats",
                      },
                      {
                        title: "Ghế Đã Đặt",
                        dataIndex: "bookedSeats",
                        key: "bookedSeats",
                      },
                      {
                        title: "Tỷ Lệ Lấp Đầy",
                        dataIndex: "occupancyRate",
                        key: "occupancyRate",
                        render: (text) => (
                          <Progress
                            type="circle"
                            percent={text as number}
                            width={50}
                            format={(percent) => `${percent}%`}
                          />
                        ),
                        sorter: (a, b) =>
                          (a.occupancyRate as number) - (b.occupancyRate as number),
                      },
                      {
                        title: "Doanh Thu",
                        dataIndex: "revenue",
                        key: "revenue",
                        render: (text) =>
                          `${((text as number) / 1000000).toFixed(1)}M₫`,
                        sorter: (a, b) => (a.revenue as number) - (b.revenue as number),
                      },
                    ]}
                    pagination={{ pageSize: 10 }}
                  />
                </div>
              ),
            },
            {
              key: "seats",
              label: "🪑 Loại Ghế",
              children: (
                <div className="space-y-6">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Card title="Phân Bổ Loại Ghế" className="shadow-sm">
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={mockSeatTypeData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ seatType, percentage }) =>
                                `${seatType}: ${percentage}%`
                              }
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="count"
                            >
                              {mockSeatTypeData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => (value as number).toLocaleString("vi-VN")}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card title="Tỷ Lệ Đặt Ghế Theo Loại" className="shadow-sm">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={mockSeatSelectionStats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="seatType" angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Tooltip
                              formatter={(value) => `${value}%`}
                            />
                            <Legend />
                            <Bar dataKey="percentage" fill="#1890ff" name="Tỷ lệ đặt (%)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Card>
                    </Col>
                  </Row>

                  <Table
                    dataSource={mockSeatSelectionStats.map((item, index) => ({
                      key: index,
                      ...item,
                    }))}
                    columns={[
                      {
                        title: "Loại Ghế",
                        dataIndex: "seatType",
                        key: "seatType",
                      },
                      {
                        title: "Ghế Được Đặt",
                        dataIndex: "booked",
                        key: "booked",
                        render: (text) => (text as number).toLocaleString("vi-VN"),
                      },
                      {
                        title: "Tỷ Lệ Lựa Chọn",
                        dataIndex: "percentage",
                        key: "percentage",
                        render: (text) => (
                          <Progress
                            type="line"
                            percent={text as number}
                            format={(percent) => `${percent}%`}
                          />
                        ),
                        sorter: (a, b) =>
                          (a.percentage as number) - (b.percentage as number),
                      },
                    ]}
                    pagination={false}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

"use client";

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
  ScatterChart,
  Scatter,
} from "recharts";
import { Dayjs } from "dayjs";

interface MoviePerformanceProps {
  dateRange: [Dayjs, Dayjs] | null;
  selectedTheater: string;
}

// Mock data for movies
const mockBoxOffice = [
  {
    id: 1,
    title: "Avatar: The Way of Water",
    ticketsSold: 85000,
    revenue: 320000000,
    occupancyRate: 92,
    genre: "Sci-Fi",
    format: "3D/IMAX",
  },
  {
    id: 2,
    title: "Fast & Furious 10",
    ticketsSold: 72000,
    revenue: 280000000,
    occupancyRate: 88,
    genre: "Action",
    format: "2D",
  },
  {
    id: 3,
    title: "Oppenheimer",
    ticketsSold: 50000,
    revenue: 210000000,
    occupancyRate: 75,
    genre: "Drama",
    format: "2D/IMAX",
  },
  {
    id: 4,
    title: "Barbie",
    ticketsSold: 48000,
    revenue: 195000000,
    occupancyRate: 72,
    genre: "Comedy",
    format: "2D",
  },
  {
    id: 5,
    title: "Dune: Part 2",
    ticketsSold: 45000,
    revenue: 175000000,
    occupancyRate: 68,
    genre: "Sci-Fi",
    format: "IMAX",
  },
];

// Mock data for hourly trends
const mockHourlyTrends = [
  { time: "09:00", occupancy: 15 },
  { time: "10:00", occupancy: 22 },
  { time: "11:00", occupancy: 35 },
  { time: "12:00", occupancy: 45 },
  { time: "13:00", occupancy: 52 },
  { time: "14:00", occupancy: 48 },
  { time: "15:00", occupancy: 60 },
  { time: "16:00", occupancy: 75 },
  { time: "17:00", occupancy: 85 },
  { time: "18:00", occupancy: 92 },
  { time: "19:00", occupancy: 95 },
  { time: "20:00", occupancy: 98 },
  { time: "21:00", occupancy: 85 },
  { time: "22:00", occupancy: 60 },
];

// Mock data for genre preferences
const mockGenrePreferences = [
  { genre: "Action", viewers: 185000, revenue: 720000000, avgOccupancy: 85 },
  { genre: "Sci-Fi", viewers: 145000, revenue: 610000000, avgOccupancy: 82 },
  { genre: "Comedy", viewers: 125000, revenue: 480000000, avgOccupancy: 75 },
  { genre: "Drama", viewers: 95000, revenue: 390000000, avgOccupancy: 68 },
  { genre: "Horror", viewers: 75000, revenue: 250000000, avgOccupancy: 60 },
];

// Mock data for format performance
const mockFormatPerformance = [
  {
    hallId: 1,
    hallName: "Hall 1 - Standard 2D",
    format: "2D",
    seatType: "Standard",
    totalSeats: 150,
    avgOccupancy: 72,
    revenue: 180000000,
  },
  {
    hallId: 2,
    hallName: "Hall 2 - VIP",
    format: "2D",
    seatType: "VIP",
    totalSeats: 80,
    avgOccupancy: 85,
    revenue: 210000000,
  },
  {
    hallId: 3,
    hallName: "Hall 3 - IMAX",
    format: "IMAX",
    seatType: "Premium",
    totalSeats: 200,
    avgOccupancy: 92,
    revenue: 380000000,
  },
  {
    hallId: 4,
    hallName: "Hall 4 - 3D",
    format: "3D",
    seatType: "Standard",
    totalSeats: 160,
    avgOccupancy: 88,
    revenue: 250000000,
  },
  {
    hallId: 5,
    hallName: "Hall 5 - Couple Seat",
    format: "2D",
    seatType: "Couple",
    totalSeats: 50,
    avgOccupancy: 95,
    revenue: 140000000,
  },
];

export default function MoviePerformance({
  dateRange,
  selectedTheater,
}: MoviePerformanceProps) {
  const avgOccupancy =
    mockBoxOffice.reduce((sum, item) => sum + item.occupancyRate, 0) / mockBoxOffice.length;
  const totalTickets = mockBoxOffice.reduce((sum, item) => sum + item.ticketsSold, 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <Statistic
              title="Tỷ Lệ Lấp Đầy Ghế Trung Bình"
              value={avgOccupancy}
              suffix="%"
              precision={1}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm border-l-4 border-l-green-500">
            <Statistic
              title="Tổng Vé Bán Ra"
              value={totalTickets}
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
              title="Phim Đang Chiếu"
              value={mockBoxOffice.length}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="shadow-sm border-l-4 border-l-purple-500">
            <Statistic
              title="Phim Ăn Khách Nhất"
              value={mockBoxOffice[0]?.title.substring(0, 15) + "..."}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs for different views */}
      <Card className="shadow-sm">
        <Tabs
          items={[
            {
              key: "boxoffice",
              label: "🎬 Top Phim Ăn Khách",
              children: (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockBoxOffice}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="title"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value) =>
                          `${(value as number).toLocaleString("vi-VN")} vé`
                        }
                      />
                      <Legend />
                      <Bar dataKey="ticketsSold" fill="#1890ff" name="Số vé bán ra" />
                    </BarChart>
                  </ResponsiveContainer>

                  <Table
                    dataSource={mockBoxOffice.map((item, index) => ({
                      key: index,
                      ...item,
                    }))}
                    columns={[
                      {
                        title: "Xếp Hạng",
                        render: (_, __, index) => index + 1,
                        width: 80,
                      },
                      {
                        title: "Tên Phim",
                        dataIndex: "title",
                        key: "title",
                      },
                      {
                        title: "Thể Loại",
                        dataIndex: "genre",
                        key: "genre",
                        render: (text) => <Tag color="blue">{text}</Tag>,
                      },
                      {
                        title: "Định Dạng",
                        dataIndex: "format",
                        key: "format",
                        render: (text) => <Tag color="cyan">{text}</Tag>,
                      },
                      {
                        title: "Vé Bán",
                        dataIndex: "ticketsSold",
                        key: "ticketsSold",
                        render: (text) => (text as number).toLocaleString("vi-VN"),
                        sorter: (a, b) => (a.ticketsSold as number) - (b.ticketsSold as number),
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
              key: "hourly",
              label: "⏰ Giờ Cao Điểm vs Thấp Điểm",
              children: (
                <div className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    Tỷ lệ lấp đầy ghế trung bình theo từng khung giờ trong ngày
                  </p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockHourlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="occupancy"
                        stroke="#1890ff"
                        strokeWidth={2}
                        name="Tỷ lệ lấp đầy (%)"
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ),
            },
            {
              key: "genre",
              label: "🎭 Thể Loại Phim Được Yêu Thích",
              children: (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockGenrePreferences}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="genre" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => (value as number).toLocaleString("vi-VN")}
                      />
                      <Legend />
                      <Bar dataKey="viewers" fill="#52c41a" name="Số lượng khán giả" />
                    </BarChart>
                  </ResponsiveContainer>

                  <Table
                    dataSource={mockGenrePreferences.map((item, index) => ({
                      key: index,
                      ...item,
                    }))}
                    columns={[
                      {
                        title: "Thể Loại",
                        dataIndex: "genre",
                        key: "genre",
                      },
                      {
                        title: "Số Khán Giả",
                        dataIndex: "viewers",
                        key: "viewers",
                        render: (text) => (text as number).toLocaleString("vi-VN"),
                        sorter: (a, b) => (a.viewers as number) - (b.viewers as number),
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
                        title: "Tỷ Lệ Lấp Đầy TB",
                        dataIndex: "avgOccupancy",
                        key: "avgOccupancy",
                        render: (text) => `${text}%`,
                        sorter: (a, b) =>
                          (a.avgOccupancy as number) - (b.avgOccupancy as number),
                      },
                    ]}
                    pagination={{ pageSize: 10 }}
                  />
                </div>
              ),
            },
            {
              key: "hall",
              label: "🏛️ Hiệu Suất Phòng Chiếu",
              children: (
                <div className="space-y-6">
                  <Table
                    dataSource={mockFormatPerformance.map((item, index) => ({
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
                        title: "Loại Ghế",
                        dataIndex: "seatType",
                        key: "seatType",
                      },
                      {
                        title: "Tổng Ghế",
                        dataIndex: "totalSeats",
                        key: "totalSeats",
                      },
                      {
                        title: "Tỷ Lệ Lấp Đầy",
                        dataIndex: "avgOccupancy",
                        key: "avgOccupancy",
                        render: (text) => (
                          <Progress
                            type="circle"
                            percent={text as number}
                            width={50}
                            format={(percent) => `${percent}%`}
                          />
                        ),
                        sorter: (a, b) =>
                          (a.avgOccupancy as number) - (b.avgOccupancy as number),
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
          ]}
        />
      </Card>
    </div>
  );
}

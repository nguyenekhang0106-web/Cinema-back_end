"use client";

import { useState, useRef } from "react";
import {
  Layout,
  Card,
  Row,
  Col,
  DatePicker,
  Select,
  Button,
  Tabs,
  Space,
  message,
} from "antd";
import {
  DownloadOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import RevenueAnalytics from "./admin/revenue-analytics";
import MoviePerformance from "./admin/movie-performance";
import UserAnalytics from "./admin/user-analytics";
import TheaterAnalytics from "./admin/theater-analytics";
import { exportToExcel, exportToPDF } from "../lib/statistics-utils";

const { Content } = Layout;
const { RangePicker } = DatePicker;

export default function AdminStatistics() {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedTheater, setSelectedTheater] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("revenue");
  const printRef = useRef<HTMLDivElement>(null);

  // Mock data for theaters
  const theaters = [
    { id: "all", name: "Tất cả rạp" },
    { id: "1", name: "CGV Landmark 81" },
    { id: "2", name: "CGV Binh Duong" },
    { id: "3", name: "CGV Ha Noi" },
  ];

  const handleExportExcel = () => {
    try {
      const data = {
        dateRange: dateRange
          ? `${dateRange[0].format("DD/MM/YYYY")} - ${dateRange[1].format("DD/MM/YYYY")}`
          : "Tất cả",
        theater: theaters.find((t) => t.id === selectedTheater)?.name || "Tất cả",
        tab: activeTab,
      };
      exportToExcel(data);
      message.success("Xuất file Excel thành công!");
    } catch (error) {
      message.error("Lỗi khi xuất file Excel");
    }
  };

  const handleExportPDF = () => {
    try {
      if (printRef.current) {
        const data = {
          dateRange: dateRange
            ? `${dateRange[0].format("DD/MM/YYYY")} - ${dateRange[1].format("DD/MM/YYYY")}`
            : "Tất cả",
          theater: theaters.find((t) => t.id === selectedTheater)?.name || "Tất cả",
          tab: activeTab,
          htmlContent: printRef.current.innerHTML,
        };
        exportToPDF(data);
        message.success("Xuất file PDF thành công!");
      }
    } catch (error) {
      message.error("Lỗi khi xuất file PDF");
    }
  };

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            📊 Bảng Thống Kê & Báo Cáo
          </h1>
          <p className="text-gray-600">
            Theo dõi doanh thu, hiệu suất phim, người dùng và hoạt động rạp
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-0 shadow-sm">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khoảng thời gian
              </label>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                presets={[
                  { label: "Hôm nay", value: [dayjs(), dayjs()] },
                  { label: "7 ngày qua", value: [dayjs().subtract(7, "d"), dayjs()] },
                  { label: "30 ngày qua", value: [dayjs().subtract(30, "d"), dayjs()] },
                  { label: "Tháng này", value: [dayjs().startOf("month"), dayjs()] },
                  { label: "Năm này", value: [dayjs().startOf("year"), dayjs()] },
                ]}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn rạp
              </label>
              <Select
                value={selectedTheater}
                onChange={setSelectedTheater}
                options={theaters.map((t) => ({
                  label: t.name,
                  value: t.id,
                }))}
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xuất báo cáo
              </label>
              <Space>
                <Button
                  type="primary"
                  icon={<FileExcelOutlined />}
                  onClick={handleExportExcel}
                >
                  Excel
                </Button>
                <Button
                  icon={<FilePdfOutlined />}
                  onClick={handleExportPDF}
                >
                  PDF
                </Button>
              </Space>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Button
                block
                onClick={() => {
                  setDateRange(null);
                  setSelectedTheater("all");
                }}
              >
                Đặt lại bộ lọc
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Content Area for Print */}
        <div ref={printRef}>
          {/* Tabs */}
          <Card className="border-0 shadow-sm">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: "revenue",
                  label: "💰 Thống Kê Doanh Thu",
                  children: <RevenueAnalytics dateRange={dateRange} selectedTheater={selectedTheater} />,
                },
                {
                  key: "movie",
                  label: "🎬 Hiệu Suất Phim",
                  children: <MoviePerformance dateRange={dateRange} selectedTheater={selectedTheater} />,
                },
                {
                  key: "user",
                  label: "👥 Thống Kê Người Dùng",
                  children: <UserAnalytics dateRange={dateRange} />,
                },
                {
                  key: "theater",
                  label: "🏢 Thống Kê Rạp & Phòng Chiếu",
                  children: <TheaterAnalytics selectedTheater={selectedTheater} />,
                },
              ]}
            />
          </Card>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            .ant-btn, .ant-select, .ant-picker {
              display: none !important;
            }
            body {
              background: white;
            }
          }
        `}</style>
      </Content>
    </Layout>
  );
}

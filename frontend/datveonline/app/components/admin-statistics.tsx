"use client";

import { useState, useRef, useEffect } from "react";
import {
  Layout,
  Card,
  Row,
  Col,
  DatePicker,
  Select,
  Button,
  Tabs,
  Typography,
  message,
} from "antd";
import {
  FilePdfOutlined,
  FileExcelOutlined,
  BarChartOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import RevenueAnalytics from "./admin/revenue-analytics";
import MoviePerformance from "./admin/movie-performance";
import UserAnalytics from "./admin/user-analytics";
import TheaterAnalytics from "./admin/theater-analytics";
import { exportToExcel, exportToPDF } from "../lib/statistics-utils";
import { SiteShell } from "./site-shell";
// 🔥 IMPORT HOOK ĐA NGÔN NGỮ
import { useLocale } from "./locale-provider";

const { Content } = Layout;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

export default function AdminStatistics() {
  // 1. Khởi tạo Hook Đa ngôn ngữ
  const locale = useLocale();

  // 2. Bộ từ điển (Dictionary) tĩnh cho trang Thống Kê
  const dict = {
    vi: {
      title: "Bảng Thống Kê & Báo Cáo",
      timeRange: "Khoảng thời gian",
      selectTheater: "Chọn rạp",
      allTheaters: "Tất cả rạp",
      actions: "Thao tác",
      btnExcel: "Xuất Excel",
      btnPdf: "Xuất PDF",
      btnReset: "Đặt lại",
      tabRevenue: "💰 Thống Kê Doanh Thu",
      tabMovie: "🎬 Hiệu Suất Phim",
      tabUser: "👥 Thống Kê Người Dùng",
      tabTheater: "🏢 Thống Kê Rạp & Phòng Chiếu",
      msgExcelSuccess: "Xuất file Excel thành công!",
      msgExcelError: "Lỗi khi xuất file Excel",
      msgPdfSuccess: "Xuất file PDF thành công!",
      msgPdfError: "Lỗi khi xuất file PDF",
      presets: {
        today: "Hôm nay",
        last7: "7 ngày qua",
        last30: "30 ngày qua",
        thisMonth: "Tháng này",
        thisYear: "Năm này",
      },
    },
    en: {
      title: "Statistics & Reports",
      timeRange: "Time Range",
      selectTheater: "Select Cinema",
      allTheaters: "All Cinemas",
      actions: "Actions",
      btnExcel: "Export Excel",
      btnPdf: "Export PDF",
      btnReset: "Reset",
      tabRevenue: "💰 Revenue Analytics",
      tabMovie: "🎬 Movie Performance",
      tabUser: "👥 User Analytics",
      tabTheater: "🏢 Theaters & Halls",
      msgExcelSuccess: "Excel file exported successfully!",
      msgExcelError: "Failed to export Excel file",
      msgPdfSuccess: "PDF file exported successfully!",
      msgPdfError: "Failed to export PDF file",
      presets: {
        today: "Today",
        last7: "Last 7 days",
        last30: "Last 30 days",
        thisMonth: "This Month",
        thisYear: "This Year",
      },
    },
  };

  const t = locale === "en" ? dict.en : dict.vi; // Tự động chọn ngôn ngữ

  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().subtract(7, "day"),
    dayjs(),
  ]);
  const [selectedTheater, setSelectedTheater] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("revenue");
  const printRef = useRef<HTMLDivElement>(null);

  const [theaters, setTheaters] = useState<{ id: string; name: string }[]>([
    { id: "all", name: t.allTheaters },
  ]);

  // Cập nhật lại tên "Tất cả rạp" khi đổi ngôn ngữ
  useEffect(() => {
    setTheaters((prev) => {
      const updated = [...prev];
      if (updated.length > 0 && updated[0].id === "all") {
        updated[0].name = t.allTheaters;
      }
      return updated;
    });
  }, [locale, t.allTheaters]);

  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const res = await fetch("http://localhost:9090/cinema/cinemas");
        const data = await res.json();
        if (data.code === 1000 && data.result) {
          const realTheaters = data.result.map((c: any) => ({
            id: c.id,
            name: c.name,
          }));
          setTheaters([{ id: "all", name: t.allTheaters }, ...realTheaters]);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách rạp:", error);
      }
    };
    fetchCinemas();
  }, [t.allTheaters]);

  const handleExportExcel = () => {
    try {
      const data = {
        dateRange: dateRange
          ? `${dateRange[0].format("DD/MM/YYYY")} - ${dateRange[1].format("DD/MM/YYYY")}`
          : "All",
        theater:
          theaters.find((th) => th.id === selectedTheater)?.name || "All",
        tab: activeTab,
        htmlContent: printRef.current?.innerHTML || "",
      };
      exportToExcel(data);
      message.success(t.msgExcelSuccess);
    } catch (error) {
      message.error(t.msgExcelError);
    }
  };

  const handleExportPDF = () => {
    try {
      if (printRef.current) {
        const data = {
          dateRange: dateRange
            ? `${dateRange[0].format("DD/MM/YYYY")} - ${dateRange[1].format("DD/MM/YYYY")}`
            : "All",
          theater:
            theaters.find((th) => th.id === selectedTheater)?.name || "All",
          tab: activeTab,
          htmlContent: printRef.current.innerHTML,
        };
        exportToPDF(data);
        message.success(t.msgPdfSuccess);
      }
    } catch (error) {
      message.error(t.msgPdfError);
    }
  };

  return (
    <div className="cinema-page">
      <SiteShell>
        <Layout className="min-h-screen bg-transparent">
          <Content className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">
            {/* Tiêu đề trang */}
            <div className="mb-6 flex flex-col items-center md:items-start text-center md:text-left pt-4">
              <Title
                level={2}
                className="!mb-0 !text-gray-800 flex items-center gap-3"
              >
                <BarChartOutlined className="text-[#a61d24]" />
                {t.title}
              </Title>
            </div>

            {/* KHU VỰC BỘ LỌC */}
            <Card
              className="mb-8 border-0 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-2xl bg-white overflow-hidden relative"
              bodyStyle={{ padding: "24px 32px" }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#a61d24] to-red-400"></div>

              <Row gutter={[24, 24]} align="bottom">
                <Col xs={24} sm={12} md={7}>
                  <div className="flex flex-col">
                    <Text className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                      <FilterOutlined /> {t.timeRange}
                    </Text>
                    <RangePicker
                      size="large"
                      className="rounded-lg hover:border-[#a61d24] focus:border-[#a61d24]"
                      value={dateRange}
                      onChange={(dates) =>
                        setDateRange(dates as [Dayjs, Dayjs] | null)
                      }
                      style={{ width: "100%" }}
                      format="DD/MM/YYYY"
                      presets={[
                        { label: t.presets.today, value: [dayjs(), dayjs()] },
                        {
                          label: t.presets.last7,
                          value: [dayjs().subtract(7, "d"), dayjs()],
                        },
                        {
                          label: t.presets.last30,
                          value: [dayjs().subtract(30, "d"), dayjs()],
                        },
                        {
                          label: t.presets.thisMonth,
                          value: [dayjs().startOf("month"), dayjs()],
                        },
                        {
                          label: t.presets.thisYear,
                          value: [dayjs().startOf("year"), dayjs()],
                        },
                      ]}
                    />
                  </div>
                </Col>

                <Col xs={24} sm={12} md={6}>
                  <div className="flex flex-col">
                    <Text className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                      {t.selectTheater}
                    </Text>
                    <Select
                      size="large"
                      className="rounded-lg"
                      value={selectedTheater}
                      onChange={setSelectedTheater}
                      options={theaters.map((th) => ({
                        label: th.name,
                        value: th.id,
                      }))}
                      style={{ width: "100%" }}
                    />
                  </div>
                </Col>

                <Col xs={24} sm={24} md={11}>
                  <div className="flex flex-col">
                    <Text className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                      {t.actions}
                    </Text>
                    <div className="flex flex-wrap items-center gap-3 justify-start md:justify-end">
                      {/* 🔥 NÚT EXCEL: Đã dùng Inline Style để vô hiệu hóa CSS của Antd */}
                      <Button
                        size="large"
                        icon={<FileExcelOutlined />}
                        onClick={handleExportExcel}
                        className="border-0 shadow-sm rounded-lg font-medium px-6 flex items-center justify-center transition-all hover:opacity-80"
                        style={{
                          background:
                            "linear-gradient(to right, #107c41, #185c37)",
                          color: "white",
                        }}
                      >
                        {t.btnExcel}
                      </Button>

                      {/* 🔥 NÚT PDF: Đã dùng Inline Style để vô hiệu hóa CSS của Antd */}
                      <Button
                        size="large"
                        icon={<FilePdfOutlined />}
                        onClick={handleExportPDF}
                        className="border-0 shadow-sm rounded-lg font-medium px-6 flex items-center justify-center transition-all hover:opacity-80"
                        style={{
                          background:
                            "linear-gradient(to right, #f40f02, #c91517)",
                          color: "white",
                        }}
                      >
                        {t.btnPdf}
                      </Button>

                      <Button
                        size="large"
                        icon={<ReloadOutlined />}
                        onClick={() => {
                          setDateRange([dayjs().subtract(7, "day"), dayjs()]);
                          setSelectedTheater("all");
                        }}
                        className="rounded-lg border-gray-300 text-gray-600 hover:text-[#a61d24] hover:border-[#a61d24]"
                      >
                        {t.btnReset}
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>

            <div ref={printRef}>
              <Card className="border-0 shadow-sm rounded-2xl overflow-hidden mb-12">
                <Tabs
                  size="large"
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  tabBarStyle={{
                    padding: "0 24px",
                    backgroundColor: "#fff",
                    borderBottom: "1px solid #f0f0f0",
                    marginBottom: 0,
                  }}
                  items={[
                    {
                      key: "revenue",
                      label: (
                        <span className="font-medium">{t.tabRevenue}</span>
                      ),
                      children: (
                        <div className="bg-gray-50/50 p-6">
                          <RevenueAnalytics
                            dateRange={dateRange}
                            selectedTheater={selectedTheater}
                          />
                        </div>
                      ),
                    },
                    {
                      key: "movie",
                      label: <span className="font-medium">{t.tabMovie}</span>,
                      children: (
                        <div className="bg-gray-50/50 p-6">
                          <MoviePerformance
                            dateRange={dateRange}
                            selectedTheater={selectedTheater}
                          />
                        </div>
                      ),
                    },
                    {
                      key: "user",
                      label: <span className="font-medium">{t.tabUser}</span>,
                      children: (
                        <div className="bg-gray-50/50 p-6">
                          <UserAnalytics dateRange={dateRange} />
                        </div>
                      ),
                    },
                    {
                      key: "theater",
                      label: (
                        <span className="font-medium">{t.tabTheater}</span>
                      ),
                      children: (
                        <div className="bg-gray-50/50 p-6">
                          <TheaterAnalytics
                            selectedTheater={selectedTheater}
                            dateRange={dateRange}
                          />
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>
            </div>

            {/* Print Styles */}
            <style>{`
              @media print {
                .ant-btn, .ant-select, .ant-picker, .ant-tabs-nav {
                  display: none !important;
                }
                body { background: white !important; }
                .ant-layout { background: white !important; }
              }
            `}</style>
          </Content>
        </Layout>
      </SiteShell>
    </div>
  );
}

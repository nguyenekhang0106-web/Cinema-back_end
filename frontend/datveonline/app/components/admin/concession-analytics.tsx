"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, Row, Col, Statistic, Table, Tag, Empty, message } from "antd";
import {
  ShoppingCartOutlined,
  DollarOutlined,
  FireOutlined,
  CoffeeOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import {
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

interface ConcessionAnalyticsProps {
  dateRange: [Dayjs, Dayjs] | null;
  selectedTheater: string;
}

type ConcessionItemSale = {
  id: string;
  name: string;
  category: "POPCORN" | "DRINK" | "COMBO" | "SNACK" | string;
  price: number;
  quantity: number;
  revenue: number;
};

type ConcessionCategorySale = {
  name: string;
  value: number;
};

type ConcessionAnalyticsResponse = {
  totalRevenue: number;
  totalItems: number;
  items: ConcessionItemSale[];
  categories: ConcessionCategorySale[];
};

const COLORS = ["#a61d24", "#faad14", "#1890ff", "#52c41a"];

const cardHeaderStyle = {
  backgroundColor: "#a61d24",
  borderTopLeftRadius: "12px",
  borderTopRightRadius: "12px",
  borderBottom: "none",
  padding: "16px 24px",
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_CINEMA_API_URL ?? "http://localhost:9090/cinema";

function formatMoney(value: number) {
  return `${(value || 0).toLocaleString("vi-VN")}₫`;
}

function getCategoryLabel(category: string) {
  const map: Record<string, string> = {
    POPCORN: "Bắp rang",
    DRINK: "Nước uống",
    COMBO: "Combo",
    SNACK: "Ăn vặt",
  };

  return map[category] || category;
}

function getCategoryIcon(category: string) {
  const iconClass = "mr-1";
  const map: Record<string, React.ReactNode> = {
    POPCORN: <FireOutlined className={iconClass} />,
    DRINK: <CoffeeOutlined className={iconClass} />,
    COMBO: <ShoppingCartOutlined className={iconClass} />,
    SNACK: <AppstoreOutlined className={iconClass} />,
  };

  return map[category] || <AppstoreOutlined className={iconClass} />;
}

function getTokenFromSession() {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem("kct-auth-session");
  if (raw) {
    try {
      const session = JSON.parse(raw);
      if (session?.token) return session.token;
    } catch {}
  }

  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token")
  );
}

export default function ConcessionAnalytics({
  dateRange,
  selectedTheater,
}: ConcessionAnalyticsProps) {
  const [loading, setLoading] = useState(false);
  const [concessionData, setConcessionData] = useState<ConcessionItemSale[]>(
    [],
  );
  const [categoryData, setCategoryData] = useState<ConcessionCategorySale[]>(
    [],
  );
  const [summary, setSummary] = useState({ totalRevenue: 0, totalItems: 0 });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (dateRange) {
      params.set("startDate", dateRange[0].format("YYYY-MM-DD"));
      params.set("endDate", dateRange[1].format("YYYY-MM-DD"));
    }

    if (selectedTheater && selectedTheater !== "all") {
      params.set("cinemaId", selectedTheater);
    }

    return params.toString();
  }, [dateRange, selectedTheater]);

  useEffect(() => {
    const fetchConcessionAnalytics = async () => {
      setLoading(true);

      try {
        const token = getTokenFromSession();

        const res = await fetch(
          `${API_BASE_URL}/statistics/concessions?${queryString}`,
          {
            method: "GET",
            cache: "no-store",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          },
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok || (data.code && data.code !== 1000)) {
          throw new Error(data.message || "Không thể tải thống kê bắp nước");
        }

        const result: ConcessionAnalyticsResponse = data.result || {
          totalRevenue: 0,
          totalItems: 0,
          items: [],
          categories: [],
        };

        setConcessionData(result.items || []);
        setCategoryData(result.categories || []);
        setSummary({
          totalRevenue: result.totalRevenue || 0,
          totalItems: result.totalItems || 0,
        });
      } catch (error: any) {
        message.error(error.message || "Không thể tải thống kê bắp nước");
        setConcessionData([]);
        setCategoryData([]);
        setSummary({ totalRevenue: 0, totalItems: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchConcessionAnalytics();
  }, [queryString]);

  const columns = [
    {
      title: "Tên mặt hàng",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: ConcessionItemSale) => (
        <div className="flex items-center gap-2">
          <span className="text-xl text-[#a61d24]">
            {getCategoryIcon(record.category)}
          </span>
          <strong className="text-gray-800">{text}</strong>
        </div>
      ),
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      render: (cat: string) => {
        const colorMap: Record<string, string> = {
          POPCORN: "gold",
          DRINK: "blue",
          COMBO: "red",
          SNACK: "green",
        };

        return (
          <Tag color={colorMap[cat] || "default"} className="font-medium">
            {getCategoryIcon(cat)}
            {getCategoryLabel(cat)}
          </Tag>
        );
      },
    },
    {
      title: "Đơn giá",
      dataIndex: "price",
      key: "price",
      align: "right" as const,
      render: (val: number) => formatMoney(val),
    },
    {
      title: "Số lượng đã bán",
      dataIndex: "quantity",
      key: "quantity",
      align: "center" as const,
      sorter: (a: ConcessionItemSale, b: ConcessionItemSale) =>
        a.quantity - b.quantity,
      render: (val: number) => (
        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
          {(val || 0).toLocaleString("vi-VN")}
        </span>
      ),
    },
    {
      title: "Tổng Doanh Thu",
      dataIndex: "revenue",
      key: "revenue",
      align: "right" as const,
      sorter: (a: ConcessionItemSale, b: ConcessionItemSale) =>
        a.revenue - b.revenue,
      render: (val: number) => (
        <strong className="text-[#a61d24] text-base bg-red-50 px-3 py-1 rounded-full">
          {formatMoney(val)}
        </strong>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card bordered={false} className="shadow-sm rounded-2xl">
            <Statistic
              title={
                <span className="flex items-center gap-2">
                  <DollarOutlined className="text-[#a61d24]" />
                  Tổng Doanh Thu Bắp Nước
                </span>
              }
              value={summary.totalRevenue}
              suffix="₫"
              formatter={(value) => Number(value || 0).toLocaleString("vi-VN")}
              valueStyle={{ color: "#a61d24", fontWeight: "bold" }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card bordered={false} className="shadow-sm rounded-2xl">
            <Statistic
              title={
                <span className="flex items-center gap-2">
                  <ShoppingCartOutlined className="text-[#1890ff]" />
                  Tổng Sản Phẩm Đã Bán
                </span>
              }
              value={summary.totalItems}
              suffix=" SP"
              formatter={(value) => Number(value || 0).toLocaleString("vi-VN")}
              valueStyle={{ color: "#1890ff", fontWeight: "bold" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <Card
            title={
              <span className="text-white font-bold">
                <AppstoreOutlined className="mr-2" />
                Cơ cấu doanh thu theo danh mục
              </span>
            }
            headStyle={cardHeaderStyle}
            className="shadow-sm rounded-2xl overflow-hidden h-full"
            bordered={false}
          >
            <div className="h-[300px] mt-4">
              {categoryData.length === 0 ? (
                <Empty description="Chưa có dữ liệu bắp nước" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ percent }) =>
                        `${((percent || 0) * 100).toFixed(0)}%`
                      }
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) =>
                        `${value.toLocaleString("vi-VN")}₫`
                      }
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={
              <span className="text-white font-bold">
                <FireOutlined className="mr-2" />
                Top mặt hàng bán chạy
              </span>
            }
            headStyle={cardHeaderStyle}
            className="shadow-sm rounded-2xl overflow-hidden h-full"
            bordered={false}
          >
            <div className="h-[300px] mt-4">
              {concessionData.length === 0 ? (
                <Empty description="Chưa có dữ liệu bắp nước" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={concessionData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(val) => `${val / 1000000}M`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number) =>
                        `${value.toLocaleString("vi-VN")}₫`
                      }
                    />
                    <Bar
                      dataKey="revenue"
                      name="Doanh thu"
                      fill="#faad14"
                      radius={[0, 4, 4, 0]}
                      barSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <span className="text-white font-bold">
            <ShoppingCartOutlined className="mr-2" />
            Chi tiết bán hàng Bắp Nước
          </span>
        }
        headStyle={cardHeaderStyle}
        className="shadow-sm rounded-2xl overflow-hidden"
        bordered={false}
      >
        <Table
          columns={columns}
          dataSource={concessionData}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          loading={loading}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "Chưa có dữ liệu bắp nước trong khoảng này" }}
        />
      </Card>
    </div>
  );
}

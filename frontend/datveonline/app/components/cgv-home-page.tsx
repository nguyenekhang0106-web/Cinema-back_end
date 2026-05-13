"use client";

import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  FireOutlined,
  GiftOutlined,
  TrophyOutlined,
  StarFilled,
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  List,
  Row,
  Space,
  Tag,
  Typography,
  Carousel,
  Modal,
  Table,
  Form,
  Input,
  InputNumber,
  Switch,
  Popconfirm,
  message,
  Image as AntImage,
} from "antd";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type MovieItem } from "../data/cgv-template";
import { getMoviesWithFallback } from "../lib/cinema-api";
import {
  getLocalizedCinemas,
  getLocalizedPromotions,
} from "../lib/localized-data";
import { localizeHref } from "../lib/i18n";
import { useDictionary, useLocale } from "./locale-provider";
import { MovieGrid } from "./movie-grid";
import { SiteShell } from "./site-shell";
import { TemplatePage } from "./template-page";
import { useAuthSession } from "./auth-session-provider";
import { BannerItem, getActiveBanners } from "../lib/cinema-api";

// ============================================================================
// 🔥 COMPONENT: TRÌNH QUẢN LÝ BANNER TRANG CHỦ DÀNH RIÊNG CHO ADMIN 🔥
// ============================================================================
function BannerManagerModal({
  open,
  onCancel,
  onSuccess,
}: {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [form] = Form.useForm();

  // Hàm lấy token
  const getAuthToken = () => {
    let token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("token");

    if (!token) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value && value.includes('"token"')) {
            try {
              const parsed = JSON.parse(value);
              if (parsed.token) token = parsed.token;
              if (parsed.accessToken) token = parsed.accessToken;
            } catch (e) {}
          }
        }
      }
    }

    if (!token) {
      message.error("Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại!");
      return "";
    }
    return token;
  };

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }
      // Gọi API lấy toàn bộ banner trang chủ (đã lọc cinemaId IS NULL ở backend)
      const res = await fetch("http://localhost:9090/cinema/banners/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBanners(data.result || []);
      } else {
        message.error(`Lỗi tải dữ liệu (Mã ${res.status})`);
      }
    } catch (err) {
      message.error("Lỗi mạng khi tải banner!");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchBanners();
  }, [open]);

  const handleAdd = () => {
    setEditingBanner(null);
    form.resetFields();
    form.setFieldsValue({ active: true, displayOrder: 0 });
    setFormModalOpen(true);
  };

  const handleEdit = (record: BannerItem) => {
    setEditingBanner(record);
    form.setFieldsValue(record);
    setFormModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch(`http://localhost:9090/cinema/banners/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        message.success("Đã xóa banner!");
        fetchBanners();
        onSuccess();
      } else {
        message.error(`Xóa thất bại (Mã lỗi ${res.status})`);
      }
    } catch (error) {
      message.error("Lỗi mạng khi xóa!");
    }
  };

  const handleSave = async (values: any) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const isUpdate = !!editingBanner;
      const url = isUpdate
        ? `http://localhost:9090/cinema/banners/${editingBanner.id}`
        : "http://localhost:9090/cinema/banners";

      // 🔥 QUAN TRỌNG: Ép cứng cinemaId = null để Backend biết đây là Banner Trang Chủ
      const payload = {
        ...values,
        cinemaId: null,
      };

      const res = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        message.success(
          isUpdate ? "Cập nhật thành công!" : "Thêm mới thành công!",
        );
        setFormModalOpen(false);
        fetchBanners();
        onSuccess();
      } else {
        const errorData = await res.json();
        const errorMsg =
          errorData.message || errorData.error || `Lỗi HTTP ${res.status}`;

        if (res.status === 401 && errorMsg.includes("JWT")) {
          message.error(
            "Phiên đăng nhập đã HẾT HẠN. Vui lòng Đăng xuất và Đăng nhập lại!",
          );
        } else {
          message.error(`Từ chối thao tác: ${errorMsg}`);
        }
      }
    } catch (error) {
      message.error("Lỗi mạng! Máy chủ đang tắt hoặc bị lỗi CORS.");
    }
  };

  const columns = [
    {
      title: "Hình ảnh",
      dataIndex: "imageUrl",
      key: "imageUrl",
      render: (url: string) => (
        <AntImage
          src={url}
          width={100}
          className="rounded object-cover aspect-[21/9]"
        />
      ),
    },
    { title: "Tiêu đề", dataIndex: "title", key: "title" },
    {
      title: "Thứ tự",
      dataIndex: "displayOrder",
      key: "displayOrder",
      align: "center" as const,
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      render: (active: boolean) => (
        <Tag color={active ? "green" : "red"}>
          {active ? "Đang hiện" : "Đã ẩn"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: BannerItem) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xóa banner này?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <Typography.Title level={4}>
            Quản lý Banner Trang Chủ
          </Typography.Title>
        }
        open={open}
        onCancel={onCancel}
        width={900}
        footer={null}
        destroyOnClose
      >
        <div className="mb-4 flex justify-end">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            className="bg-[#a61d24]"
          >
            Thêm Banner Mới
          </Button>
        </div>
        <Table
          dataSource={banners}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Modal>

      <Modal
        title={editingBanner ? "Cập nhật Banner" : "Thêm Banner Mới"}
        open={formModalOpen}
        onCancel={() => setFormModalOpen(false)}
        onOk={() => form.submit()}
        okText="Lưu lại"
        cancelText="Hủy"
        okButtonProps={{ className: "bg-[#a61d24]" }}
        zIndex={1050}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="title" label="Tiêu đề Banner">
            <Input placeholder="Nhập tên gợi nhớ (VD: Khuyến mãi Hè)" />
          </Form.Item>
          <Form.Item
            name="imageUrl"
            label="URL Hình ảnh"
            rules={[{ required: true, message: "URL không được để trống" }]}
          >
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="link" label="Đường dẫn khi Click (Không bắt buộc)">
            <Input placeholder="/phim/avengers-endgame" />
          </Form.Item>
          <Form.Item
            name="displayOrder"
            label="Thứ tự ưu tiên (Nhỏ xếp trước)"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item
            name="active"
            label="Trạng thái hiển thị"
            valuePropName="checked"
          >
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
// ============================================================================

function CinemaAndPromoSection() {
  const locale = useLocale();
  const dictionary = useDictionary();
  const cinemas = getLocalizedCinemas(locale);
  const promotions = getLocalizedPromotions(locale);

  return (
    <section className="mb-16">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={15}>
          <Card bordered={false} className="cinema-paper rounded-[28px]">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <Typography.Title
                  level={2}
                  className="cinema-section-title"
                  style={{ margin: 0, color: "#4a3426" }}
                >
                  {dictionary.home.cinemaTitle}
                </Typography.Title>
                <Typography.Paragraph
                  style={{ color: "#6d5a46", marginTop: 16 }}
                >
                  {dictionary.home.cinemaDescription}
                </Typography.Paragraph>
              </div>
              <Tag color="gold">KCT locations</Tag>
            </div>
            <List
              itemLayout="vertical"
              dataSource={cinemas}
              renderItem={(cinema) => (
                <List.Item key={cinema.id}>
                  <Card
                    bordered
                    style={{ borderColor: "#ead8c1", background: "#fffaf4" }}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <Space wrap size={10}>
                          <Typography.Title
                            level={4}
                            style={{ margin: 0, color: "#4a3426" }}
                          >
                            {cinema.name}
                          </Typography.Title>
                          <Tag color="red">
                            <EnvironmentOutlined /> {cinema.area}
                          </Tag>
                        </Space>
                        <Typography.Paragraph
                          style={{ margin: "8px 0 0", color: "#6d5a46" }}
                        >
                          {cinema.address}
                        </Typography.Paragraph>
                        <Space wrap className="mt-1">
                          {cinema.features.map((feature) => (
                            <Tag key={feature} color="gold">
                              {feature}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                      <Space wrap>
                        {cinema.showtimes.slice(0, 4).map((time) => (
                          <Button key={time} disabled>
                            {time}
                          </Button>
                        ))}
                      </Space>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Space direction="vertical" size={24} className="w-full">
            <Card bordered={false} className="cinema-paper rounded-[28px]">
              <Typography.Title
                level={2}
                className="cinema-section-title"
                style={{ margin: 0, color: "#4a3426" }}
              >
                {dictionary.home.promoTitle}
              </Typography.Title>
              <List
                className="mt-5"
                dataSource={promotions}
                renderItem={(promotion) => (
                  <List.Item key={promotion.id}>
                    <Card
                      bordered
                      size="small"
                      style={{
                        width: "100%",
                        borderColor: "#ead8c1",
                        background:
                          "linear-gradient(135deg, rgba(200,154,43,0.12), rgba(166,29,36,0.04))",
                      }}
                    >
                      <Space align="start">
                        <GiftOutlined
                          style={{ fontSize: 22, color: "#a61d24" }}
                        />
                        <div>
                          <Typography.Title
                            level={5}
                            style={{ margin: 0, color: "#4a3426" }}
                          >
                            {promotion.title}
                          </Typography.Title>
                          <Typography.Paragraph
                            style={{ margin: "6px 0 0", color: "#6d5a46" }}
                          >
                            {promotion.description}
                          </Typography.Paragraph>
                        </div>
                      </Space>
                    </Card>
                  </List.Item>
                )}
              />
            </Card>

            <Card bordered={false} className="cinema-paper rounded-[28px]">
              <Typography.Title
                level={4}
                style={{ marginTop: 0, color: "#4a3426" }}
              >
                {dictionary.home.sitePartsTitle}
              </Typography.Title>
              <List
                dataSource={dictionary.home.siteParts}
                renderItem={(item) => (
                  <List.Item>
                    <Space>
                      <TrophyOutlined style={{ color: "#c89a2b" }} />
                      <Typography.Text>{item}</Typography.Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          </Space>
        </Col>
      </Row>
    </section>
  );
}

function NewsStrip() {
  const dictionary = useDictionary();

  return (
    <section className="mb-20">
      <Card bordered={false} className="cinema-paper rounded-[28px]">
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} md={8}>
            <Typography.Title level={3} style={{ margin: 0, color: "#4a3426" }}>
              {dictionary.home.newsTitle}
            </Typography.Title>
            <Typography.Paragraph style={{ marginTop: 10, color: "#6d5a46" }}>
              {dictionary.home.newsDescription}
            </Typography.Paragraph>
          </Col>
          <Col xs={24} md={16}>
            <Row gutter={[16, 16]}>
              {dictionary.home.newsItems.map((item, index) => (
                <Col xs={24} md={8} key={item.key}>
                  <Card
                    bordered
                    style={{
                      height: "100%",
                      borderColor: "#ead8c1",
                      background: "#fffaf4",
                    }}
                  >
                    <Space direction="vertical" size={10}>
                      {index === 0 ? (
                        <FireOutlined style={{ color: "#a61d24" }} />
                      ) : index === 1 ? (
                        <ClockCircleOutlined style={{ color: "#a61d24" }} />
                      ) : (
                        <StarFilled style={{ color: "#c89a2b" }} />
                      )}
                      <Typography.Title level={5} style={{ margin: 0 }}>
                        {item.title}
                      </Typography.Title>
                      <Typography.Text style={{ color: "#6d5a46" }}>
                        {item.desc}
                      </Typography.Text>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Card>
    </section>
  );
}

// === MAIN COMPONENT ===
export function CgvHomePage() {
  const locale = useLocale();
  const [movies, setMovies] = useState<MovieItem[]>([]);

  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const { role } = useAuthSession();

  const loadBanners = () => {
    // getActiveBanners gọi API lấy banner (đã lọc cinemaId IS NULL ở Backend)
    getActiveBanners().then((items) => setBanners(items));
  };

  useEffect(() => {
    let mounted = true;
    getMoviesWithFallback(locale).then((items) => {
      if (mounted) setMovies(items);
    });
    if (mounted) loadBanners();
    return () => {
      mounted = false;
    };
  }, [locale]);

  const featuredMovies = movies.filter((movie) => movie.featured === true);

  return (
    <div className="cinema-page">
      <SiteShell>
        <div className="cinema-shell">
          {/* BANNER TỰ ĐỘNG LẤY TỪ DB */}
          <div className="px-4 sm:px-6 pt-6 relative group">
            {/* NÚT QUẢN LÝ CHO ADMIN */}
            {role === "admin" && (
              <div className="absolute top-10 right-10 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                  type="primary"
                  icon={<SettingOutlined />}
                  size="large"
                  onClick={() => setIsManageModalOpen(true)}
                  className="bg-[#a61d24] font-semibold shadow-lg hover:scale-105"
                >
                  Quản lý Banner
                </Button>
              </div>
            )}

            <div className="w-full shadow-sm border border-gray-200 bg-white">
              {banners.length > 0 ? (
                <Carousel autoplay effect="fade" arrows>
                  {banners.map((banner) => (
                    <div
                      key={banner.id}
                      className="relative h-[200px] md:h-[300px] lg:h-[400px] w-full focus:outline-none"
                    >
                      {banner.link ? (
                        <a
                          href={banner.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full h-full"
                        >
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ) : (
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                </Carousel>
              ) : (
                <div className="h-[200px] md:h-[300px] lg:h-[400px] w-full bg-[#fffaf4] flex flex-col items-center justify-center border border-dashed border-[#d7c0a0] text-[#6d5a46]">
                  <p className="text-lg font-semibold">
                    Chưa có banner nào được kích hoạt
                  </p>
                  {role === "admin" && (
                    <p className="mt-2">
                      Bấm "Quản lý Banner" ở góc phải để thêm mới.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <main className="pb-8 pt-10">
            {featuredMovies.length > 0 && (
              <div className="mb-16 px-4 sm:px-6">
                <div className="flex items-center justify-between mb-8">
                  <Typography.Title
                    level={2}
                    className="cinema-section-title"
                    style={{
                      margin: 0,
                      color: "#4a3426",
                      borderLeft: "5px solid #a61d24",
                      paddingLeft: "14px",
                      textTransform: "uppercase",
                    }}
                  >
                    Phim Nổi Bật
                  </Typography.Title>
                  <Link
                    href={localizeHref("/phim", locale)}
                    className="text-[#a61d24] font-semibold hover:underline text-base"
                  >
                    Xem tất cả &gt;
                  </Link>
                </div>
                <MovieGrid movies={featuredMovies} showBooking={true} />
              </div>
            )}

            <div className="px-4 sm:px-6">
              <CinemaAndPromoSection />
              <NewsStrip />
            </div>
          </main>
        </div>
      </SiteShell>

      {/* NHÚNG MODAL QUẢN LÝ VÀO GIAO DIỆN */}
      {role === "admin" && (
        <BannerManagerModal
          open={isManageModalOpen}
          onCancel={() => setIsManageModalOpen(false)}
          onSuccess={loadBanners}
        />
      )}
    </div>
  );
}

export function PlaceholderRoutePage(props: {
  title: string;
  description: string;
  eyebrow: string;
}) {
  return (
    <div className="cinema-page">
      <SiteShell>
        <main className="cinema-shell px-4 py-8 sm:px-6">
          <TemplatePage
            title={props.title}
            description={props.description}
            eyebrow={props.eyebrow}
          />
        </main>
      </SiteShell>
    </div>
  );
}

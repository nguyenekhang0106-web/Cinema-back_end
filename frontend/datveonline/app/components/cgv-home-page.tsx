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
  VideoCameraOutlined,
  PictureOutlined,
  PhoneOutlined, // 🔥 BẠN THÊM DÒNG NÀY VÀO NHÉ
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
  Spin,
  Image as AntImage,
  Select, // 🔥 BẠN THÊM DÒNG NÀY
  DatePicker, // 🔥 VÀ THÊM CẢ DÒNG NÀY NỮA NHÉ
} from "antd";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type MovieItem } from "../data/cgv-template";
import dayjs from "dayjs";
import { getMoviesWithFallback, getCinemas } from "../lib/cinema-api";
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
import { useRouter } from "next/navigation";

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
// CÁC HÀM TIỆN ÍCH BỔ TRỢ CHO RẠP & LỊCH CHIẾU
// ============================================================================
const cityMapVi: Record<string, string> = {
  HA_NOI: "Hà Nội",
  TUYEN_QUANG: "Tuyên Quang",
  LAO_CAI: "Lào Cai",
  THAI_NGUYEN: "Thái Nguyên",
  PHU_THO: "Phú Thọ",
  BAC_NINH: "Bắc Ninh",
  HUNG_YEN: "Hưng Yên",
  HAI_PHONG: "Hải Phòng",
  NINH_BINH: "Ninh Bình",
  QUANG_TRI: "Quảng Trị",
  DA_NANG: "Đà Nẵng",
  QUANG_NGAI: "Quảng Ngãi",
  GIA_LAI: "Gia Lai",
  KHANH_HOA: "Khánh Hòa",
  LAM_DONG: "Lâm Đồng",
  DAK_LAK: "Đắk Lắk",
  HO_CHI_MINH: "TP.HCM",
  DONG_NAI: "Đồng Nai",
  TAY_NINH: "Tây Ninh",
  CAN_THO: "Cần Thơ",
  VINH_LONG: "Vĩnh Long",
  DONG_THAP: "Đồng Tháp",
  CA_MAU: "Cà Mau",
  AN_GIANG: "An Giang",
  HUE: "Huế",
  LAI_CHAU: "Lai Châu",
  DIEN_BIEN: "Điện Biên",
  SON_LA: "Sơn La",
  LANG_SON: "Lạng Sơn",
  QUANG_NINH: "Quảng Ninh",
  THANH_HOA: "Thanh Hóa",
  NGHE_AN: "Nghệ An",
  HA_TINH: "Hà Tĩnh",
  CAO_BANG: "Cao Bằng",
};
const cityMapEn: Record<string, string> = {};
const translateCity = (cityCode: string, locale: string) =>
  locale === "en"
    ? cityMapEn[cityCode] || cityCode
    : cityMapVi[cityCode] || cityCode;

const formatDisplayMap: Record<string, string> = {
  TWO_D: "2D",
  THREE_D: "3D",
  IMAX: "IMAX",
  FOUR_DX: "4DX",
};

const generateDates = () => {
  const dates = [];
  const days = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    const dateLabel = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    let dayLabel = days[d.getDay()];
    if (i === 0) dayLabel = "Hôm nay";
    dates.push({ iso, dateLabel, dayLabel });
  }
  return dates;
};

function CinemaAndPromoSection() {
  const locale = useLocale();
  const dictionary = useDictionary();
  const promotions = getLocalizedPromotions(locale);
  const { role } = useAuthSession();
  const isAdmin = role === "admin";

  // === STATE CỦA RẠP & LỊCH CHIẾU ===
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [moviesList, setMoviesList] = useState<any[]>([]);

  // Trạng thái mở rộng (Expand)
  const [expandedCinemaId, setExpandedCinemaId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    generateDates()[0].iso,
  );
  const [cinemaShowtimes, setCinemaShowtimes] = useState<any[]>([]);
  const [cinemaHallsForShowtimes, setCinemaHallsForShowtimes] = useState<any[]>(
    [],
  );
  const [isFetchingShowtimes, setIsFetchingShowtimes] = useState(false);
  const [theaterBanners, setTheaterBanners] = useState<any[]>([]);

  // Các Modal Form của Admin
  const [isShowtimeModalOpen, setIsShowtimeModalOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState<any | null>(null);
  const [showtimeForm] = Form.useForm();

  // === STATE CHO POPUP CLICK GIỜ CHIẾU ===
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timeModalData, setTimeModalData] = useState<{
    cinemaName: string;
    time: string;
    showtimes: any[];
  }>({ cinemaName: "", time: "", showtimes: [] });

  const getAuthToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("token")
    );
  };

  // 1. TẢI DỮ LIỆU RẠP & PHIM KHI MỞ TRANG
  useEffect(() => {
    let isMounted = true;

    const fetchCinemaData = async () => {
      try {
        setLoading(true);
        const cinemasData = await getCinemas();
        if (!isMounted) return;

        const moviesRes = await fetch(`http://localhost:9090/cinema/movies`);
        if (moviesRes.ok) {
          const moviesData = await moviesRes.json();
          setMoviesList(moviesData.result || []);
        }

        const stRes = await fetch(`http://localhost:9090/cinema/showtimes`);
        let activeShowtimes: any[] = [];
        if (stRes.ok) {
          const stData = await stRes.json();
          activeShowtimes = (stData.result || []).filter(
            (st: any) => st.status === "SCHEDULED",
          );
        }
        if (!isMounted) return;

        const today = dayjs().format("YYYY-MM-DD");
        const now = dayjs();

        const mappedCinemas = await Promise.all(
          cinemasData.map(async (cinema: any) => {
            try {
              const hallRes = await fetch(
                `http://localhost:9090/cinema/halls/cinema/${cinema.id}`,
              );
              let hallIds: string[] = [];
              if (hallRes.ok) {
                const hallData = await hallRes.json();
                hallIds = (hallData.result || []).map((h: any) => h.id);
              }

              const cinemaShowtimes = activeShowtimes
                .filter((st: any) => {
                  const stTime = dayjs(st.startTime);
                  return (
                    hallIds.includes(st.hallId) &&
                    stTime.format("YYYY-MM-DD") === today &&
                    stTime.isAfter(now)
                  );
                })
                .sort((a: any, b: any) =>
                  a.startTime.localeCompare(b.startTime),
                );

              // Lưu lại mảng giờ HH:mm để hiển thị
              const timeStrings = cinemaShowtimes.map((st: any) =>
                dayjs(st.startTime).format("HH:mm"),
              );
              const uniqueShowtimes = Array.from(new Set(timeStrings)).slice(
                0,
                4,
              );

              return {
                ...cinema,
                todayShowtimes: cinemaShowtimes, // 🔥 Lưu trữ toàn bộ object suất chiếu để dùng cho Popup
                showtimesToDisplay: uniqueShowtimes,
              };
            } catch (e) {
              return { ...cinema, todayShowtimes: [], showtimesToDisplay: [] };
            }
          }),
        );

        if (isMounted) setCinemas(mappedCinemas);
      } catch (error) {
        console.error("Lỗi tải dữ liệu rạp:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCinemaData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. TẢI LỊCH CHIẾU & ẢNH RẠP KHI BẤM NÚT "XEM LỊCH CHIẾU" (XỔ XUỐNG)
  const loadCinemaDetails = async (cinemaId: string) => {
    setIsFetchingShowtimes(true);
    try {
      const hallsRes = await fetch(
        `http://localhost:9090/cinema/halls/cinema/${cinemaId}`,
      );
      const hallsData = await hallsRes.json();
      const fetchedHalls = hallsData.result || [];
      setCinemaHallsForShowtimes(fetchedHalls);
      const hallIds = fetchedHalls.map((h: any) => h.id);

      const stRes = await fetch(`http://localhost:9090/cinema/showtimes`);
      if (stRes.ok) {
        const stData = await stRes.json();
        const allShowtimes = stData.result || [];
        const filtered = allShowtimes.filter(
          (st: any) => hallIds.includes(st.hallId) && st.status === "SCHEDULED",
        );
        setCinemaShowtimes(filtered);
      }

      const token = getAuthToken();
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const url = isAdmin
        ? `http://localhost:9090/cinema/banners/cinema/${cinemaId}/all`
        : `http://localhost:9090/cinema/banners/cinema/${cinemaId}`;
      const imgRes = await fetch(url, { headers });
      if (imgRes.ok) {
        const imgData = await imgRes.json();
        setTheaterBanners(imgData.result || []);
      } else {
        setTheaterBanners([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingShowtimes(false);
    }
  };

  const handleViewShowtimes = async (cinema: any) => {
    if (expandedCinemaId === cinema.id) {
      setExpandedCinemaId(null);
      return;
    }
    setExpandedCinemaId(cinema.id);
    loadCinemaDetails(cinema.id);
  };

  // 🔥 3. XỬ LÝ KHI CLICK VÀO NÚT GIỜ CHIẾU (MỞ POPUP ĐẸP MẮT) 🔥
  const handleTimeClick = (cinema: any, timeStr: string) => {
    const matchingShowtimes = (cinema.todayShowtimes || []).filter(
      (st: any) => dayjs(st.startTime).format("HH:mm") === timeStr,
    );
    setTimeModalData({
      cinemaName: cinema.name,
      time: timeStr,
      showtimes: matchingShowtimes,
    });
    setTimeModalVisible(true);
  };

  // 4. GROUP VÀ FILTER SUẤT CHIẾU THEO NGÀY VÀ PHIM BÊN TRONG KHUNG MỞ RỘNG
  const getGroupedShowtimes = () => {
    const now = dayjs();
    const thresholdTime = now.subtract(20, "minute");

    const dateShowtimes = cinemaShowtimes.filter((st) => {
      if (!st.startTime.startsWith(selectedDate)) return false;
      const showtimeTime = dayjs(st.startTime);
      if (showtimeTime.isBefore(thresholdTime)) {
        if (!isAdmin) return false;
      }
      return true;
    });

    const groups: Record<string, any[]> = {};
    dateShowtimes.forEach((st) => {
      if (!groups[st.movieId]) groups[st.movieId] = [];
      groups[st.movieId].push(st);
    });

    return Object.keys(groups).map((movieId) => ({
      movieId,
      showtimes: groups[movieId].sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      ),
    }));
  };

  const getMovieInfo = (movieId: string) => {
    const realMovie = moviesList.find((m) => m.id === movieId);
    if (realMovie) {
      return {
        title: realMovie.title || realMovie.name || "Đang cập nhật tên phim",
        poster: realMovie.posterUrl || "https://www.cgv.vn/default-poster.jpg",
        genre: realMovie.genre || "Đang cập nhật",
        duration: realMovie.durationMin
          ? `${realMovie.durationMin} phút`
          : "Chưa xác định",
      };
    }
    return {
      title: "Phim không tồn tại",
      poster: "https://www.cgv.vn/default-poster.jpg",
      genre: "N/A",
      duration: "N/A",
    };
  };

  // 5. ADMIN ACTIONS (THÊM, SỬA, XÓA LỊCH CHIẾU)
  const handleAddShowtime = () => {
    setEditingShowtime(null);
    showtimeForm.resetFields();
    setIsShowtimeModalOpen(true);
  };

  const handleEditShowtime = (showtime: any) => {
    setEditingShowtime(showtime);
    showtimeForm.setFieldsValue({
      ...showtime,
      startTime: dayjs(showtime.startTime),
    });
    setIsShowtimeModalOpen(true);
  };

  const handleDeleteShowtime = async (showtimeId: string) => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(
        `http://localhost:9090/cinema/showtimes/${showtimeId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        message.success("Đã xóa suất chiếu thành công!");
        loadCinemaDetails(expandedCinemaId!);
      } else {
        message.error("Lỗi xóa suất chiếu");
      }
    } catch (error) {
      message.error("Lỗi mạng");
    }
  };

  const handleSaveShowtime = async (values: any) => {
    const token = getAuthToken();
    if (!token) return;
    const isUpdate = !!editingShowtime;
    const url = isUpdate
      ? `http://localhost:9090/cinema/showtimes/${editingShowtime.id}`
      : `http://localhost:9090/cinema/showtimes`;

    const payload = {
      ...values,
      startTime: values.startTime.format("YYYY-MM-DDTHH:mm:ss"),
    };

    try {
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
        setIsShowtimeModalOpen(false);
        loadCinemaDetails(expandedCinemaId!);
      } else {
        const err = await res.json();
        message.error(err.message || "Lỗi lưu suất chiếu");
      }
    } catch (error) {
      message.error("Lỗi mạng");
    }
  };

  return (
    <>
      {/* ====================================================== */}
      {/* 1. KHỐI RẠP CHIẾU (Chiếm toàn bộ chiều rộng)           */}
      {/* ====================================================== */}
      <section className="mb-12">
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
              <Typography.Paragraph style={{ color: "#6d5a46", marginTop: 16 }}>
                {dictionary.home.cinemaDescription}
              </Typography.Paragraph>
            </div>
            <Tag color="gold">KCT locations</Tag>
          </div>

          {loading ? (
            <div className="flex justify-center mt-12">
              <Spin size="large" />
            </div>
          ) : (
            <List
              itemLayout="vertical"
              dataSource={cinemas}
              locale={{ emptyText: "Chưa có dữ liệu rạp chiếu" }}
              renderItem={(cinema) => (
                <List.Item key={cinema.id}>
                  <Card
                    bordered
                    style={{ borderColor: "#ead8c1", background: "#fffaf4" }}
                  >
                    <div className="flex justify-between items-start">
                      <Space direction="vertical" size={14} className="w-full">
                        <div>
                          <Typography.Title
                            level={3}
                            style={{ margin: 0, color: "#4a3426" }}
                          >
                            {cinema.name}
                          </Typography.Title>
                          <Typography.Paragraph
                            style={{ color: "#6d5a46", margin: "8px 0 0" }}
                          >
                            <EnvironmentOutlined className="mr-1" />{" "}
                            {cinema.address}
                          </Typography.Paragraph>
                          <Typography.Paragraph
                            style={{ color: "#6d5a46", margin: "4px 0 0" }}
                          >
                            <PhoneOutlined className="mr-1" /> Hotline:{" "}
                            <strong>{cinema.hotline}</strong>
                          </Typography.Paragraph>
                        </div>

                        <Space wrap>
                          <Tag color="gold" className="px-3 py-1 text-sm">
                            Khu vực {translateCity(cinema.city, locale)}
                          </Tag>
                        </Space>

                        {/* 🔥 NÚT GIỜ CHIẾU CLICK ĐƯỢC 🔥 */}
                        <Space wrap>
                          {cinema.showtimesToDisplay &&
                          cinema.showtimesToDisplay.length > 0 ? (
                            cinema.showtimesToDisplay.map(
                              (time: string, index: number) => (
                                <Button
                                  key={`${cinema.id}-${index}`}
                                  type="dashed"
                                  className="border-[#a61d24] text-[#a61d24] hover:bg-[#a61d24] hover:text-white transition-colors cursor-pointer font-bold shadow-sm"
                                  onClick={() => handleTimeClick(cinema, time)}
                                >
                                  {time}
                                </Button>
                              ),
                            )
                          ) : (
                            <span className="text-gray-400 text-sm italic">
                              Hôm nay chưa có lịch chiếu
                            </span>
                          )}
                        </Space>

                        <Button
                          type={
                            expandedCinemaId === cinema.id
                              ? "default"
                              : "primary"
                          }
                          size="large"
                          onClick={() => handleViewShowtimes(cinema)}
                          className={`mt-2 ${expandedCinemaId === cinema.id ? "border-[#a61d24] text-[#a61d24]" : "bg-[#a61d24] border-none hover:bg-[#85161c]"}`}
                        >
                          {expandedCinemaId === cinema.id
                            ? "Đóng Lịch Chiếu"
                            : "Xem Lịch Chiếu Rạp"}
                        </Button>
                      </Space>
                    </div>

                    {/* KHU VỰC LỊCH CHIẾU VÀ THEATER XỔ XUỐNG KHI BẤM NÚT */}
                    {expandedCinemaId === cinema.id && (
                      <div className="mt-8 pt-8 border-t-2 border-dashed border-gray-200 animate-fade-in transition-all">
                        <div className="text-center mb-12">
                          <div className="flex items-center justify-center gap-4 w-full mb-6">
                            <div className="h-[2px] bg-[#4a3426] w-12 md:w-32"></div>
                            <h2 className="text-3xl font-serif tracking-[0.3em] uppercase font-bold text-[#4a3426]">
                              Theater
                            </h2>
                            <div className="h-[2px] bg-[#4a3426] w-12 md:w-32"></div>
                          </div>
                          <div className="max-w-4xl mx-auto rounded-lg overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.15)] bg-white relative">
                            {theaterBanners.filter((b) => b.active || isAdmin)
                              .length > 0 ? (
                              <Carousel
                                autoplay
                                autoplaySpeed={4000}
                                effect="fade"
                                dotPosition="bottom"
                              >
                                {theaterBanners
                                  .filter((b) => b.active || isAdmin)
                                  .sort(
                                    (a, b) =>
                                      (a.displayOrder || 0) -
                                      (b.displayOrder || 0),
                                  )
                                  .map((img) => (
                                    <div key={img.id} className="relative">
                                      <img
                                        src={img.imageUrl}
                                        alt="Theater Interior"
                                        className={`w-full object-cover h-[300px] md:h-[450px] ${!img.active ? "opacity-50 grayscale" : ""}`}
                                      />
                                      {!img.active && (
                                        <div className="absolute top-4 right-4 z-10">
                                          <Tag
                                            color="red"
                                            className="text-sm font-bold px-3 py-1 shadow-md"
                                          >
                                            Đang Ẩn
                                          </Tag>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                              </Carousel>
                            ) : (
                              <div className="w-full h-[300px] bg-gray-100 flex flex-col items-center justify-center text-gray-400">
                                <PictureOutlined className="text-5xl mb-3 opacity-30" />
                                <p>Rạp chưa có ảnh nội thất nào</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                          <div className="text-center mb-8 relative flex flex-col items-center">
                            <h2 className="text-3xl font-black uppercase inline-block border-[3px] border-[#4a3426] px-8 py-3 bg-white relative z-10 shadow-[6px_6px_0px_0px_#4a3426] tracking-wider text-[#4a3426]">
                              LỊCH CHIẾU
                            </h2>
                            {isAdmin && (
                              <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleAddShowtime}
                                className="mt-6 bg-[#a61d24] border-none shadow-md z-10"
                              >
                                Thêm Suất Chiếu
                              </Button>
                            )}
                          </div>

                          <div className="flex overflow-x-auto gap-3 justify-start md:justify-center mb-8 pb-4 scrollbar-hide">
                            {generateDates().map((dateObj) => {
                              const isActive = selectedDate === dateObj.iso;
                              return (
                                <button
                                  key={dateObj.iso}
                                  onClick={() => setSelectedDate(dateObj.iso)}
                                  className={`shrink-0 min-w-[120px] px-4 py-3 border rounded-lg flex flex-col items-center justify-center transition-all ${isActive ? "bg-[#1eb3a6] text-white border-[#1eb3a6] shadow-[0_4px_10px_rgba(30,179,166,0.4)] transform -translate-y-1" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
                                >
                                  <span className="font-semibold text-sm">
                                    {dateObj.dayLabel}
                                  </span>
                                  <span className="text-xs mt-1">
                                    {dateObj.dateLabel}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {isFetchingShowtimes ? (
                            <div className="flex justify-center py-10">
                              <Spin size="large" />
                            </div>
                          ) : getGroupedShowtimes().length === 0 ? (
                            <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                              <VideoCameraOutlined className="text-4xl mb-3 opacity-30" />
                              <p>
                                Không có suất chiếu nào được lên lịch vào ngày
                                này tại rạp.
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-8 max-w-4xl mx-auto">
                              {getGroupedShowtimes().map((movieGroup) => {
                                const movieDetails = getMovieInfo(
                                  movieGroup.movieId,
                                );
                                return (
                                  <div
                                    key={movieGroup.movieId}
                                    className="flex flex-col md:flex-row gap-6 p-5 bg-white rounded-xl shadow-sm border border-gray-100"
                                  >
                                    <img
                                      src={movieDetails.poster}
                                      alt={movieDetails.title}
                                      className="w-full md:w-36 md:h-52 object-cover rounded-lg shadow-md"
                                    />
                                    <div className="flex-1">
                                      <h3 className="text-xl font-bold text-gray-800 uppercase mb-3 leading-snug">
                                        {movieDetails.title}
                                      </h3>
                                      <p className="text-sm text-gray-600 mb-1">
                                        <strong>Thể loại:</strong>{" "}
                                        {movieDetails.genre}
                                      </p>
                                      <p className="text-sm text-gray-600 mb-5">
                                        <strong>Thời lượng:</strong>{" "}
                                        {movieDetails.duration}
                                      </p>

                                      <div className="flex flex-wrap gap-3">
                                        {movieGroup.showtimes.map((st: any) => {
                                          const hall =
                                            cinemaHallsForShowtimes.find(
                                              (h: any) => h.id === st.hallId,
                                            );
                                          const hallName = hall
                                            ? hall.name
                                            : "Phòng chiếu";
                                          const now = dayjs();
                                          const startTime = dayjs(st.startTime);
                                          const endTime = dayjs(st.endTime);
                                          const timeStr =
                                            startTime.format("HH:mm");

                                          let displayTag = null;
                                          let buttonStyle =
                                            "bg-gray-50 border-gray-300 hover:border-[#1eb3a6] hover:bg-white cursor-pointer";
                                          let textStyle =
                                            "text-gray-800 group-hover:text-[#1eb3a6]";
                                          let isLockedForUser = false;

                                          if (st.status === "CANCELLED") {
                                            displayTag = (
                                              <span className="text-[9px] text-red-600 bg-red-100 px-2 py-0.5 rounded mt-1 font-bold">
                                                ĐÃ HỦY
                                              </span>
                                            );
                                            buttonStyle =
                                              "bg-red-50 border-red-200 opacity-70 cursor-not-allowed";
                                            textStyle =
                                              "text-red-400 line-through";
                                            isLockedForUser = true;
                                          } else if (
                                            st.status === "COMPLETED" ||
                                            now.isAfter(endTime)
                                          ) {
                                            displayTag = (
                                              <span className="text-[9px] text-gray-500 bg-gray-200 px-2 py-0.5 rounded mt-1 font-bold">
                                                ĐÃ CHIẾU
                                              </span>
                                            );
                                            buttonStyle =
                                              "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed";
                                            textStyle = "text-gray-400";
                                            isLockedForUser = true;
                                          } else if (
                                            st.status === "SCHEDULED"
                                          ) {
                                            if (
                                              now.isAfter(startTime) &&
                                              now.isBefore(endTime)
                                            ) {
                                              displayTag = (
                                                <span className="text-[9px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded mt-1 font-bold animate-pulse">
                                                  ĐANG CHIẾU
                                                </span>
                                              );
                                              buttonStyle =
                                                "bg-blue-50 border-blue-200 cursor-not-allowed";
                                              textStyle = "text-blue-500";
                                              isLockedForUser = true;
                                            } else if (
                                              now.isAfter(
                                                startTime.add(20, "minute"),
                                              )
                                            ) {
                                              displayTag = (
                                                <span className="text-[9px] text-orange-600 bg-orange-100 px-2 py-0.5 rounded mt-1 font-bold">
                                                  ĐÓNG BÁN VÉ
                                                </span>
                                              );
                                              buttonStyle =
                                                "bg-gray-50 border-gray-200 opacity-80 cursor-not-allowed";
                                              textStyle = "text-gray-500";
                                              isLockedForUser = true;
                                            }
                                          }

                                          if (!isAdmin && isLockedForUser)
                                            return null;

                                          const innerContent = (
                                            <>
                                              <span
                                                className={`font-bold text-lg ${textStyle}`}
                                              >
                                                {timeStr}
                                              </span>
                                              <span
                                                className={`text-xs mt-1 ${isLockedForUser ? "text-gray-400" : "text-gray-500"}`}
                                              >
                                                {hallName}
                                              </span>
                                              {st.format && (
                                                <span
                                                  className={`text-[10px] font-bold mt-1 px-2 rounded-full ${isLockedForUser ? "bg-gray-200 text-gray-400" : "bg-yellow-100 text-yellow-800"}`}
                                                >
                                                  {formatDisplayMap[
                                                    st.format
                                                  ] || st.format}
                                                </span>
                                              )}
                                              {isAdmin && displayTag}
                                            </>
                                          );

                                          return (
                                            <div
                                              key={st.id}
                                              className="relative group inline-block"
                                            >
                                              {isLockedForUser && !isAdmin ? (
                                                <div
                                                  className={`w-full border rounded-lg px-5 py-2 flex flex-col items-center transition-all ${buttonStyle}`}
                                                >
                                                  {innerContent}
                                                </div>
                                              ) : (
                                                <Link
                                                  href={localizeHref(
                                                    `/dat-ve/${st.id}`,
                                                    locale,
                                                  )}
                                                  className={`w-full border rounded-lg px-5 py-2 flex flex-col items-center transition-all ${buttonStyle}`}
                                                >
                                                  {innerContent}
                                                </Link>
                                              )}
                                              {isAdmin && (
                                                <div className="absolute -top-3 -right-3 hidden group-hover:flex gap-1 z-10 bg-white p-1 rounded-full shadow-md border border-gray-200">
                                                  <Button
                                                    size="small"
                                                    shape="circle"
                                                    icon={
                                                      <EditOutlined className="text-blue-500" />
                                                    }
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      e.stopPropagation();
                                                      handleEditShowtime(st);
                                                    }}
                                                    className="border-none shadow-none"
                                                  />
                                                  <Popconfirm
                                                    title="Xóa (Hủy) suất chiếu này?"
                                                    onConfirm={(e) => {
                                                      e?.stopPropagation();
                                                      handleDeleteShowtime(
                                                        st.id,
                                                      );
                                                    }}
                                                    onCancel={(e) =>
                                                      e?.stopPropagation()
                                                    }
                                                  >
                                                    <Button
                                                      size="small"
                                                      shape="circle"
                                                      danger
                                                      icon={<DeleteOutlined />}
                                                      onClick={(e) =>
                                                        e.preventDefault()
                                                      }
                                                      className="border-none shadow-none"
                                                    />
                                                  </Popconfirm>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                </List.Item>
              )}
            />
          )}

          {/* Nút Xem Tất Cả chuyển đến trang Lịch chiếu chi tiết */}
          <div className="mt-6 flex justify-center">
            <Link href={localizeHref("/rap-gia-ve", locale)}>
              <Button
                type="default"
                size="large"
                className="text-[#a61d24] border-[#a61d24] hover:bg-red-50 font-semibold rounded-full px-8"
              >
                Xem toàn bộ Rạp & Lịch chiếu
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* ====================================================== */}
      {/* 3. CÁC MODAL HIỂN THỊ (ADMIN FORM & POPUP XEM PHIM)    */}
      {/* ====================================================== */}
      <Modal
        title={
          <div className="border-l-[4px] border-[#a61d24] pl-3">
            <Typography.Title level={4} style={{ margin: 0, color: "#4a3426" }}>
              {editingShowtime ? "CẬP NHẬT LỊCH CHIẾU" : "THÊM LỊCH CHIẾU"}
            </Typography.Title>
          </div>
        }
        open={isShowtimeModalOpen}
        onCancel={() => setIsShowtimeModalOpen(false)}
        onOk={() => showtimeForm.submit()}
        okText="Lưu lại"
        cancelText="Hủy"
        okButtonProps={{ className: "bg-[#a61d24] border-none" }}
        zIndex={1060}
      >
        <Form
          form={showtimeForm}
          layout="vertical"
          onFinish={handleSaveShowtime}
          className="mt-4"
        >
          <Form.Item label="Phim chiếu" required>
            <div className="flex gap-2">
              <Form.Item
                name="movieId"
                noStyle
                rules={[{ required: true, message: "Chọn phim!" }]}
              >
                <Select placeholder="-- Chọn một bộ phim --" className="flex-1">
                  {moviesList.map((m) => (
                    <Select.Option key={m.id} value={m.id}>
                      {m.title || m.name || "Phim chưa có tên"}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
          </Form.Item>
          <Form.Item
            name="hallId"
            label="Phòng chiếu"
            rules={[{ required: true, message: "Chọn phòng chiếu!" }]}
          >
            <Select placeholder="-- Chọn phòng thuộc rạp này --">
              {cinemaHallsForShowtimes.map((h) => (
                <Select.Option key={h.id} value={h.id}>
                  {h.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="startTime"
            label="Thời gian bắt đầu (Ngày giờ)"
            rules={[{ required: true, message: "Vui lòng chọn thời gian!" }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              className="w-full"
              placeholder="Chọn ngày và giờ"
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
            />
          </Form.Item>
          <div className="flex gap-4">
            <Form.Item
              name="basePrice"
              label="Giá vé cơ bản (VNĐ)"
              className="w-1/2"
              rules={[
                { required: true, message: "Nhập giá vé!" },
                { type: "number", min: 1000 },
              ]}
            >
              <InputNumber
                min={1000 as number}
                step={1000 as number}
                className="w-full"
                placeholder="VD: 50000"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) =>
                  (value
                    ? value.replace(/\$\s?|(,*)/g, "")
                    : "") as unknown as number
                }
              />
            </Form.Item>
            <Form.Item
              name="format"
              label="Định dạng hình ảnh"
              className="w-1/2"
              rules={[{ required: true, message: "Chọn định dạng!" }]}
            >
              <Select placeholder="-- Định dạng --">
                <Select.Option value="TWO_D">2D</Select.Option>
                <Select.Option value="THREE_D">3D</Select.Option>
                <Select.Option value="IMAX">IMAX</Select.Option>
                <Select.Option value="FOUR_DX">4DX</Select.Option>
              </Select>
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* 🔥 MODAL POPUP HIỂN THỊ PHIM KHI CLICK VÀO GIỜ CHIẾU 🔥 */}
      <Modal
        title={
          <div className="border-l-[4px] border-[#a61d24] pl-3 uppercase">
            <Typography.Title level={4} style={{ margin: 0, color: "#4a3426" }}>
              Suất chiếu {timeModalData.time} - {timeModalData.cinemaName}
            </Typography.Title>
          </div>
        }
        open={timeModalVisible}
        onCancel={() => setTimeModalVisible(false)}
        footer={null}
        width={600}
        zIndex={1100}
        centered
      >
        <div className="flex flex-col gap-4 mt-6">
          {timeModalData.showtimes.length > 0 ? (
            timeModalData.showtimes.map((st: any) => {
              const movieDetails = getMovieInfo(st.movieId);
              return (
                <div
                  key={st.id}
                  className="flex gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-lg transition-all bg-gray-50"
                >
                  <img
                    src={movieDetails.poster}
                    alt={movieDetails.title}
                    className="w-24 h-32 object-cover rounded-lg shadow-sm"
                  />
                  <div className="flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-lg font-bold text-[#a61d24] mb-1 leading-snug">
                        {movieDetails.title}
                      </h3>
                      <p className="text-sm text-gray-600 m-0 mt-1">
                        <strong>Thể loại:</strong> {movieDetails.genre}
                      </p>
                      <p className="text-sm text-gray-600 m-0 mt-1">
                        <strong>Thời lượng:</strong> {movieDetails.duration}
                      </p>
                      {st.format && (
                        <Tag
                          color="blue"
                          className="mt-2 text-[10px] font-bold"
                        >
                          {formatDisplayMap[st.format] || st.format}
                        </Tag>
                      )}
                    </div>
                    <div className="text-right mt-2">
                      <Link href={localizeHref(`/dat-ve/${st.id}`, locale)}>
                        <Button
                          type="primary"
                          className="bg-[#a61d24] border-none font-semibold px-6 rounded-full shadow-md hover:scale-105 transition-transform"
                        >
                          Mua Vé Ngay
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 py-6">
              Không tìm thấy thông tin phim cho giờ này.
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

function NewsStrip() {
  const locale = useLocale();
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedArticles = async () => {
      try {
        const res = await fetch("http://localhost:9090/cinema/articles");
        const data = await res.json();

        if (data.code === 1000) {
          const featuredNews = (data.result || []).filter((item: any) => {
            const isFeatured =
              item.featured === true ||
              item.featured === 1 ||
              item.featured === "1";

            const isPublished = !item.status || item.status === "PUBLISHED";

            return isFeatured && isPublished;
          });

          setArticles(featuredNews);
        }
      } catch (error) {
        console.error("Lỗi tải tin tức nổi bật:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedArticles();
  }, []);

  return (
    <section className="mb-20 mt-12">
      <div className="mb-6 flex items-center border-b-2 border-gray-200">
        <div className="flex items-center gap-2 border-b-[3px] border-[#a61d24] pb-2 -mb-[2px]">
          <FireOutlined className="text-2xl text-[#a61d24]" />
          <Typography.Title
            level={3}
            className="!m-0 !text-[#4a3426] uppercase"
          >
            {locale === "vi" ? "Tin Mới & Sự Kiện" : "News & Events"}
          </Typography.Title>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spin size="large" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center text-gray-500 py-10 border border-dashed border-gray-300 rounded-lg">
          {locale === "vi" ? "Hiện chưa có bài viết nào." : "No articles yet."}
        </div>
      ) : (
        <List
          grid={{ gutter: 24, xs: 1, sm: 2, md: 3, lg: 3, xl: 3, xxl: 3 }}
          dataSource={articles}
          pagination={{
            pageSize: 3,
            align: "center",
            showSizeChanger: false,
          }}
          renderItem={(item) => (
            <List.Item>
              <Card
                hoverable
                onClick={() => {
                  router.push(
                    localizeHref(`/cultureplex?article=${item.id}`, locale),
                  );
                }}
                className="rounded-xl border border-gray-100 shadow-sm overflow-hidden group cursor-pointer w-full"
                bodyStyle={{
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div className="flex flex-col w-full">
                  <div className="relative h-[200px] overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={
                        item.thumbnailUrl ||
                        "https://via.placeholder.com/400x200?text=News"
                      }
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-2 right-2 bg-[#a61d24] text-white px-2 py-0.5 rounded text-xs font-bold shadow-md">
                      {dayjs(item.publishDate).format("DD/MM/YYYY")}
                    </div>
                  </div>

                  <div className="p-4 bg-white flex flex-col">
                    <Typography.Text
                      strong
                      className="text-base line-clamp-2 mb-2 block group-hover:text-[#a61d24] transition-colors"
                      style={{ minHeight: "48px" }} // 🔥 Ép tiêu đề luôn chiếm đủ không gian của 2 dòng
                    >
                      {item.title}
                    </Typography.Text>

                    <Typography.Paragraph
                      type="secondary"
                      className="text-sm line-clamp-3 !m-0"
                      style={{ minHeight: "66px" }} // 🔥 Ép phần tóm tắt luôn chiếm đủ không gian của 3 dòng
                    >
                      {item.summary}
                    </Typography.Paragraph>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}
    </section>
  );
}

export function CgvHomePage() {
  const locale = useLocale();
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const { role } = useAuthSession();

  // ====================================================================
  // 🔥 MÁY HÚT BỤI: DỌN SẠCH CÁC PHIÊN ĐẶT VÉ CŨ KHI USER VỀ TRANG CHỦ
  // ====================================================================
  useEffect(() => {
    if (typeof window !== "undefined") {
      Object.keys(sessionStorage).forEach((key) => {
        // Tìm và tiêu diệt toàn bộ các key đặt vé tạm thời
        if (key.startsWith("kct_temp_wizard_state_")) {
          sessionStorage.removeItem(key);
        }
      });
      // Xóa luôn key lưu trạng thái VNPay nếu còn sót
      sessionStorage.removeItem("kct_booking_state");
    }
  }, []);
  // ====================================================================

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

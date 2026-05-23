"use client";

// ==========================================
// 1. REACT & NEXT.JS
// ==========================================
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// ==========================================
// 2. THIRD-PARTY LIBRARIES
// ==========================================
import dayjs from "dayjs";

// ==========================================
// 3. ANT DESIGN COMPONENTS
// ==========================================
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
  type TabsProps,
} from "antd";
import type { ColumnsType } from "antd/es/table";

// ==========================================
// 4. ANT DESIGN ICONS
// ==========================================
import {
  CameraOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";

// ==========================================
// 5. API SERVICES
// ==========================================
import {
  changePasswordApi,
  createMovieApi,
  updateMovieApi,
  getMyProfile,
  updateMyProfile,
  uploadAvatarApi,
  getMoviesApi,
  uploadMovieImagesApi,
  getMyTicketsApi,
  getMyVouchersApi,
} from "../lib/cinema-api";

// ==========================================
// 6. LOCAL COMPONENTS & PROVIDERS
// ==========================================
import { useAuthSession } from "./auth-session-provider";
import { AdminMovieManager } from "./admin-movie-manager";
import { SiteShell } from "./site-shell";
import { useDictionary, useLocale } from "./locale-provider";
import { AdminConcessionManager } from "../admin/components/admin-concession-manager";
import { AdminPromotionManager } from "../admin/components/admin-promotion-manager";

type MovieStatus = "showing" | "coming" | "hidden";
type ShowtimeStatus = "open" | "paused" | "soldout";
type UserRole = "admin" | "user";
type UserStatus = "active" | "blocked";
type EditorMode = "create" | "edit";

type MovieRecord = {
  key: string;
  title: string;
  genre: string;
  status: MovieStatus;
  featured: boolean;
};

type ShowtimeRecord = {
  key: string;
  movieTitle: string;
  cinema: string;
  room: string;
  format: string;
  time: string;
  status: ShowtimeStatus;
};

type UserRecord = {
  key: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  vouchers: number;
  memberTier: string;
  totalSpending: number;
};

type TicketRecord = {
  key: string;
  movie: string;
  seats: string;
  cinema: string;
  time: string;
  status: "paid" | "reserved" | "used";
  total: string;
};

type VoucherRecord = {
  key: string;
  code: string;
  title: string;
  discount: string;
  expireAt: string;
  status: "available" | "used";
};

type UserProfile = {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  province: string;
  citizenId: string;
  memberTier: string;
  points: number;
  avatarUrl: string;
  totalSpending: number;
};

const initialMovies: MovieRecord[] = [
  {
    key: "mv-01",
    title: "Địa Đạo: Mặt Trời Trong Bóng Tối",
    genre: "Drama",
    status: "showing",
    featured: true,
  },
  {
    key: "mv-02",
    title: "Lật Mặt 8",
    genre: "Action",
    status: "coming",
    featured: false,
  },
];

const initialShowtimes: ShowtimeRecord[] = [
  {
    key: "st-01",
    movieTitle: "Địa Đạo: Mặt Trời Trong Bóng Tối",
    cinema: "KCT Vincom",
    room: "P01",
    format: "2D",
    time: "20:30 21/04/2026",
    status: "open",
  },
];

const initialUsers: UserRecord[] = [
  {
    key: "us-01",
    fullName: "Nguyễn Quản Trị",
    email: "admin@kctcinema.vn",
    role: "admin",
    status: "active",
    vouchers: 8,
    // 🔥 KHỞI TẠO DỮ LIỆU MẪU CHO ADMIN
    memberTier: "PLATINUM",
    totalSpending: 15500000,
  },
];

const initialProfile: UserProfile = {
  fullName: "Trần Khách Hàng",
  email: "user@kctcinema.vn",
  phone: "0909 123 456",
  gender: "male",
  birthDay: "15",
  birthMonth: "08",
  birthYear: "1998",
  province: "Thành phố Hồ Chí Minh",
  citizenId: "012345678901",
  memberTier: "Gold",
  points: 1280,
  totalSpending: 0,
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
};

const days = Array.from({ length: 31 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);
const months = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);
const years = Array.from({ length: 87 }, (_, index) => String(2025 - index));

const VIETNAM_PROVINCES = [
  "An Giang",
  "Bắc Ninh",
  "Cà Mau",
  "Cao Bằng",
  "Cần Thơ",
  "Đà Nẵng",
  "Đắk Lắk",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Nội",
  "Hà Tĩnh",
  "Hải Phòng",
  "Hưng Yên",
  "Huế",
  "Khánh Hòa",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Nghệ An",
  "Ninh Bình",
  "Phú Thọ",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sơn La",
  "Tây Ninh",
  "Thái Nguyên",
  "Thanh Hóa",
  "Thành phố Hồ Chí Minh",
  "Tuyên Quang",
  "Vĩnh Long",
] as const;

const AREA_MAP: Record<string, string> = {
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
  HO_CHI_MINH: "Thành phố Hồ Chí Minh",
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

const initialUpcomingTickets: TicketRecord[] = [
  {
    key: "t-1",
    movie: "Địa Đạo: Mặt Trời Trong Bóng Tối",
    seats: "B5, B6",
    cinema: "KCT Vincom",
    time: "20:30 21/04/2026",
    status: "paid",
    total: "220.000đ",
  },
];

const initialBookingHistory: TicketRecord[] = [
  {
    key: "h-1",
    movie: "Nhà Bà Nữ",
    seats: "D4, D5",
    cinema: "KCT Gò Vấp",
    time: "19:15 03/04/2026",
    status: "used",
    total: "210.000đ",
  },
];

const initialVouchers: VoucherRecord[] = [
  {
    key: "v-1",
    code: "KCTGOLD50",
    title: "Giảm 50.000đ cho hóa đơn từ 2 vé",
    discount: "50.000đ",
    expireAt: "30/04/2026",
    status: "available",
  },
];

function DashboardHero(props: {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  stats: Array<{ label: string; value: string | number }>;
}) {
  return (
    <Card
      bordered={false}
      className="cinema-paper overflow-hidden rounded-[28px]"
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-4">
          <Tag color="red">{props.eyebrow}</Tag>
          <Typography.Title level={1} style={{ margin: 0, color: "#4a3426" }}>
            {props.title}
          </Typography.Title>
          <Typography.Paragraph style={{ color: "#6d5a46", marginBottom: 0 }}>
            {props.description}
          </Typography.Paragraph>
          <Row gutter={[16, 16]}>
            {props.stats.map((stat) => (
              <Col xs={24} sm={8} key={stat.label}>
                <Card bordered className="rounded-[22px]">
                  <Statistic title={stat.label} value={stat.value} />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
        <div className="relative min-h-[280px] overflow-hidden rounded-[24px]">
          <Image
            src={props.image}
            alt={props.title}
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            style={{ objectFit: "cover" }}
          />
        </div>
      </div>
    </Card>
  );
}

function StatusTag(props: { color: string; label: string }) {
  return <Tag color={props.color}>{props.label}</Tag>;
}

export function AdminDashboardPage() {
  const { message } = App.useApp();
  const locale = useLocale();
  const dictionary = useDictionary();
  const copy = locale === "en" ? adminCopy.en : adminCopy.vi;

  const router = useRouter();
  const [concessionModalOpen, setConcessionModalOpen] = useState(false);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [movies, setMovies] = useState<any[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(false);

  const [showtimes, setShowtimes] = useState(initialShowtimes);
  const [users, setUsers] = useState(initialUsers);

  const [movieForm] = Form.useForm<MovieRecord>();
  const [showtimeForm] = Form.useForm<ShowtimeRecord>();
  const [userForm] = Form.useForm<UserRecord>();

  const { token, user } = useAuthSession();
  const isAdmin = String(user?.role).toUpperCase().includes("ADMIN");

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [submittingMovie, setSubmittingMovie] = useState(false);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoadingMovies(true);
      try {
        const res = await getMoviesApi();
        if (res.result) {
          const formattedMovies = res.result.map((movie: any) => ({
            ...movie,
            key: movie.id,
          }));
          setMovies(formattedMovies);
        }
      } catch (error: any) {
        message.error("Không thể kết nối Database để lấy danh sách phim!");
      } finally {
        setLoadingMovies(false);
      }
    };

    fetchMovies();
  }, []);

  const [movieModal, setMovieModal] = useState<{
    open: boolean;
    mode: EditorMode;
    editingKey?: string;
  }>({ open: false, mode: "create" });
  const [showtimeModal, setShowtimeModal] = useState<{
    open: boolean;
    mode: EditorMode;
    editingKey?: string;
  }>({ open: false, mode: "create" });
  const [userModal, setUserModal] = useState<{
    open: boolean;
    mode: EditorMode;
    editingKey?: string;
  }>({ open: false, mode: "create" });

  const stats = [
    { label: dictionary.pages.admin.stats[0].label, value: movies.length },
    { label: dictionary.pages.admin.stats[1].label, value: showtimes.length },
    {
      label: dictionary.pages.admin.stats[2].label,
      value: users.filter((item) => item.role === "admin").length,
    },
  ];

  const movieColumns: ColumnsType<MovieRecord> = [
    {
      title: "Poster",
      dataIndex: "posterUrl",
      key: "posterUrl",
      render: (url: string, record: any) => {
        if (!url) return <div className="w-12 h-16 bg-gray-200 rounded"></div>;
        return (
          <img
            src={url}
            alt={record.title}
            width={48}
            height={72}
            className="rounded object-cover shadow-sm border border-gray-200"
          />
        );
      },
    },
    { title: copy.movieColumns.title, dataIndex: "title", key: "title" },
    { title: copy.movieColumns.genre, dataIndex: "genre", key: "genre" },
    {
      title: copy.movieColumns.status,
      dataIndex: "status",
      key: "status",
      render: (value: string) => {
        let color = "default";
        let label = "Ngừng chiếu";
        if (value === "NOW_SHOWING" || value === "showing") {
          color = "green";
          label = "Đang chiếu";
        } else if (value === "COMING_SOON" || value === "coming") {
          color = "gold";
          label = "Sắp chiếu";
        }
        return <StatusTag color={color} label={label} />;
      },
    },
    {
      title: copy.movieColumns.featured,
      dataIndex: "featured",
      key: "featured",
      render: (value: boolean) => (
        <Tag color={value ? "red" : "default"}>
          {value ? copy.featuredYes : copy.featuredNo}
        </Tag>
      ),
    },
    ...(isAdmin
      ? [
          {
            title: copy.actions,
            key: "actions",
            render: (_: any, record: any) => (
              <Space wrap>
                <Button
                  size="small"
                  onClick={() => openMovieEditor("edit", record)}
                >
                  {copy.edit}
                </Button>
                <Button
                  size="small"
                  onClick={() => toggleMovieFeatured(record.key)}
                >
                  {record.featured ? copy.unfeature : copy.feature}
                </Button>
                <Button
                  danger
                  size="small"
                  onClick={() => removeMovie(record.key)}
                >
                  {copy.delete}
                </Button>
              </Space>
            ),
          },
        ]
      : []),
  ];

  const showtimeColumns: ColumnsType<ShowtimeRecord> = [
    {
      title: copy.showtimeColumns.movie,
      dataIndex: "movieTitle",
      key: "movieTitle",
    },
    { title: copy.showtimeColumns.cinema, dataIndex: "cinema", key: "cinema" },
    { title: copy.showtimeColumns.room, dataIndex: "room", key: "room" },
    { title: copy.showtimeColumns.time, dataIndex: "time", key: "time" },
    {
      title: copy.showtimeColumns.status,
      dataIndex: "status",
      key: "status",
      render: (value: ShowtimeStatus) => (
        <StatusTag
          color={
            value === "open" ? "green" : value === "paused" ? "gold" : "red"
          }
          label={copy.showtimeStatus[value]}
        />
      ),
    },
    {
      title: copy.actions,
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button
            size="small"
            onClick={() => openShowtimeEditor("edit", record)}
          >
            {copy.edit}
          </Button>
          <Button size="small" onClick={() => cycleShowtimeStatus(record.key)}>
            {copy.changeStatus}
          </Button>
          <Button
            danger
            size="small"
            onClick={() => removeShowtime(record.key)}
          >
            {copy.delete}
          </Button>
        </Space>
      ),
    },
  ];

  const userColumns: ColumnsType<UserRecord> = [
    { title: copy.userColumns.name, dataIndex: "fullName", key: "fullName" },
    { title: copy.userColumns.email, dataIndex: "email", key: "email" },

    // 🔥 BỔ SUNG CỘT HẠNG THÀNH VIÊN CHO TRANG QUẢN LÝ
    {
      title: locale === "vi" ? "Hạng" : "Tier",
      dataIndex: "memberTier",
      key: "memberTier",
      render: (tier: string) => {
        const colorMap: Record<string, string> = {
          PLATINUM: "red",
          GOLD: "gold",
          SILVER: "blue",
          BASIC: "default",
        };
        return (
          <Tag color={colorMap[tier?.toUpperCase()] || "default"}>
            {tier || "BASIC"}
          </Tag>
        );
      },
    },

    // 🔥 BỔ SUNG CỘT TỔNG CHI TIÊU
    {
      title: locale === "vi" ? "Tổng chi tiêu" : "Total Spending",
      dataIndex: "totalSpending",
      key: "totalSpending",
      render: (val: number) => (
        <Typography.Text strong className="text-[#a61d24]">
          {(val || 0).toLocaleString("vi-VN")} đ
        </Typography.Text>
      ),
    },

    {
      title: copy.userColumns.role,
      dataIndex: "role",
      key: "role",
      render: (value: UserRole) => (
        <Tag color={value === "admin" ? "red" : "blue"}>
          {copy.userRole[value]}
        </Tag>
      ),
    },
    {
      title: copy.userColumns.status,
      dataIndex: "status",
      key: "status",
      render: (value: UserStatus) => (
        <StatusTag
          color={value === "active" ? "green" : "red"}
          label={copy.userStatus[value]}
        />
      ),
    },
    {
      title: copy.actions,
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button size="small" onClick={() => openUserEditor("edit", record)}>
            {copy.edit}
          </Button>
          <Button size="small" onClick={() => toggleUserStatus(record.key)}>
            {record.status === "active" ? copy.block : copy.unblock}
          </Button>
          <Button danger size="small" onClick={() => removeUser(record.key)}>
            {copy.delete}
          </Button>
        </Space>
      ),
    },
  ];

  function openMovieEditor(mode: EditorMode, record?: any) {
    const currentId = record?.key || record?.id;
    setMovieModal({ open: true, mode, editingKey: currentId });
    movieForm.setFieldsValue({
      ...record,
      releaseDate: record?.releaseDate ? dayjs(record.releaseDate) : null,
      status: record?.status || "COMING_SOON",
      featured: record?.featured || false,
    });
    setPosterFile(null);
    setBannerFile(null);
  }

  function openShowtimeEditor(mode: EditorMode, record?: ShowtimeRecord) {
    setShowtimeModal({ open: true, mode, editingKey: record?.key });
    showtimeForm.setFieldsValue(
      record ?? {
        key: "",
        movieTitle: "",
        cinema: "",
        room: "",
        format: "2D",
        time: "",
        status: "open",
      },
    );
  }

  function openUserEditor(mode: EditorMode, record?: UserRecord) {
    setUserModal({ open: true, mode, editingKey: record?.key });
    userForm.setFieldsValue(
      record ?? {
        key: "",
        fullName: "",
        email: "",
        role: "user",
        status: "active",
        vouchers: 0,
        memberTier: "BASIC", // Đặt mặc định
        totalSpending: 0, // Đặt mặc định
      },
    );
  }

  async function saveMovie(values: any) {
    const isEditMode = movieModal.mode === "edit" && movieModal.editingKey;
    if (!isEditMode && (!posterFile || !bannerFile)) {
      message.error("Vui lòng tải lên đầy đủ Poster và Banner!");
      return;
    }
    setSubmittingMovie(true);
    try {
      const payload = {
        title: values.title,
        durationMin: values.durationMin,
        genre: values.genre,
        language: values.language,
        ageRestriction: values.ageRestriction,
        trailerUrl: values.trailerUrl,
        description: values.description,
        releaseDate: values.releaseDate
          ? values.releaseDate.format("YYYY-MM-DD")
          : null,
        directors: values.directors,
        actors: values.actors,
        status: values.status,
        featured: values.featured,
      };

      let currentMovieId = movieModal.editingKey;

      if (isEditMode) {
        await updateMovieApi(token!, currentMovieId!, payload);
        message.success(copy.movieUpdated);
      } else {
        const createRes = await createMovieApi(token!, payload);
        currentMovieId = createRes.result.id;
        message.success(copy.movieCreated);
      }

      if (posterFile || bannerFile) {
        await uploadMovieImagesApi(
          token!,
          currentMovieId!,
          posterFile as any,
          bannerFile as any,
        );
        if (isEditMode) message.success("Cập nhật ảnh thành công!");
      }

      const freshMoviesRes = await getMoviesApi();
      if (freshMoviesRes.result)
        setMovies(freshMoviesRes.result.map((m: any) => ({ ...m, key: m.id })));

      setMovieModal({ open: false, mode: "create" });
      movieForm.resetFields();
      setPosterFile(null);
      setBannerFile(null);
    } catch (error: any) {
      message.error(error.message || "Lỗi khi lưu phim!");
    } finally {
      setSubmittingMovie(false);
    }
  }

  function saveShowtime(values: ShowtimeRecord) {
    setShowtimeModal({ open: false, mode: "create" });
  }
  function saveUser(values: UserRecord) {
    setUserModal({ open: false, mode: "create" });
  }
  function toggleMovieFeatured(key: string) {
    setMovies((c) =>
      c.map((i) => (i.key === key ? { ...i, featured: !i.featured } : i)),
    );
  }
  function cycleShowtimeStatus(key: string) {}
  function toggleUserStatus(key: string) {}
  function removeMovie(key: string) {
    setMovies((c) => c.filter((i) => i.key !== key));
    message.success(copy.movieDeleted);
  }
  function removeShowtime(key: string) {
    setShowtimes((c) => c.filter((i) => i.key !== key));
    message.success(copy.showtimeDeleted);
  }
  function removeUser(key: string) {
    setUsers((c) => c.filter((i) => i.key !== key));
    message.success(copy.userDeleted);
  }

  const moduleCards = [
    {
      title: copy.moduleMoviesTitle,
      value: movies.length,
      desc: copy.moduleMoviesDesc,
      action: () => openMovieEditor("create"),
      actionLabel: copy.addMovie,
    },
    {
      title: copy.moduleShowtimesTitle,
      value: showtimes.filter((i) => i.status === "open").length,
      desc: copy.moduleShowtimesDesc,
      action: () => openShowtimeEditor("create"),
      actionLabel: copy.addShowtime,
    },
    {
      title: copy.moduleUsersTitle,
      value: users.filter((i) => i.status === "active").length,
      action: () => openUserEditor("create"),
      actionLabel: copy.addUser,
    },
    {
      title: locale === "vi" ? "Quản lý Bắp nước" : "Concessions",
      value: "Menu",
      desc:
        locale === "vi"
          ? "Thêm, sửa, xóa danh sách đồ ăn, thức uống."
          : "Manage food and drinks list.",
      action: () => setConcessionModalOpen(true),
      actionLabel: locale === "vi" ? "Mở quản lý" : "Manage Concessions",
    },
    {
      title: locale === "vi" ? "Quản lý Khuyến Mãi" : "Promotions",
      value: "Promo",
      desc:
        locale === "vi"
          ? "Cài đặt mã giảm giá và điều kiện áp dụng."
          : "Manage discount codes and conditions.",
      action: () => setPromoModalOpen(true),
      actionLabel: locale === "vi" ? "Mở quản lý" : "Manage Promotions",
    },
    {
      title: locale === "vi" ? "Thống Kê & Báo Cáo" : "Analytics & Reports",
      value: "Chart",
      desc:
        locale === "vi"
          ? "Xem biểu đồ doanh thu, vé bán và hiệu suất rạp."
          : "View revenue, tickets and theater performance.",
      action: () =>
        router.push(locale === "vi" ? "/admin/thong-ke" : "/en/admin/thong-ke"),
      actionLabel: locale === "vi" ? "Xem Biểu Đồ" : "View Analytics",
    },
  ];

  return (
    <div className="cinema-page">
      <SiteShell>
        <main className="cinema-shell px-4 py-8 sm:px-6">
          <DashboardHero
            eyebrow={dictionary.pages.admin.eyebrow}
            title={dictionary.pages.admin.title}
            description={dictionary.pages.admin.description}
            image="https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1200"
            stats={stats}
          />

          <Row gutter={[24, 24]} className="mt-8">
            {moduleCards.map((card) => (
              <Col xs={24} sm={12} lg={8} key={card.title}>
                <Card
                  bordered={false}
                  className="cinema-paper h-full rounded-[24px]"
                >
                  <Space direction="vertical" size={12} className="w-full">
                    <Typography.Title
                      level={4}
                      style={{ margin: 0, color: "#4a3426" }}
                    >
                      {card.title}
                    </Typography.Title>
                    <Typography.Text
                      style={{
                        fontSize: 28,
                        fontWeight: 800,
                        color: "#a61d24",
                      }}
                    >
                      {card.value}
                    </Typography.Text>
                    <Typography.Paragraph
                      style={{ color: "#6d5a46", marginBottom: 0 }}
                    >
                      {card.desc}
                    </Typography.Paragraph>
                    <Button type="primary" onClick={card.action}>
                      {card.actionLabel}
                    </Button>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={[24, 24]} className="mt-8">
            <Col span={24}>
              <Card bordered={false} className="cinema-paper rounded-[24px]">
                <Space direction="vertical" size={18} className="w-full">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Typography.Title
                        level={3}
                        style={{ margin: 0, color: "#4a3426" }}
                      >
                        {dictionary.pages.admin.sections[0].title}
                      </Typography.Title>
                      <Typography.Paragraph
                        style={{ color: "#6d5a46", margin: "8px 0 0" }}
                      >
                        {dictionary.pages.admin.sections[0].desc}
                      </Typography.Paragraph>
                    </div>
                    <Button
                      type="primary"
                      onClick={() => openMovieEditor("create")}
                    >
                      {copy.addMovie}
                    </Button>
                  </div>
                  <Table
                    rowKey="key"
                    columns={movieColumns}
                    dataSource={movies}
                    pagination={{ pageSize: 5 }}
                    loading={loadingMovies}
                    scroll={{ x: "max-content" }}
                  />
                </Space>
              </Card>
            </Col>

            <Col span={24}>
              <Card bordered={false} className="cinema-paper rounded-[24px]">
                <Space direction="vertical" size={18} className="w-full">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Typography.Title
                        level={3}
                        style={{ margin: 0, color: "#4a3426" }}
                      >
                        {dictionary.pages.admin.sections[1].title}
                      </Typography.Title>
                      <Typography.Paragraph
                        style={{ color: "#6d5a46", margin: "8px 0 0" }}
                      >
                        {dictionary.pages.admin.sections[1].desc}
                      </Typography.Paragraph>
                    </div>
                    <Button
                      type="primary"
                      onClick={() => openShowtimeEditor("create")}
                    >
                      {copy.addShowtime}
                    </Button>
                  </div>
                  <Table
                    rowKey="key"
                    columns={showtimeColumns}
                    dataSource={showtimes}
                    pagination={false}
                    scroll={{ x: "max-content" }}
                  />
                </Space>
              </Card>
            </Col>

            <Col span={24}>
              <Card bordered={false} className="cinema-paper rounded-[24px]">
                <Space direction="vertical" size={18} className="w-full">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <Typography.Title
                        level={3}
                        style={{ margin: 0, color: "#4a3426" }}
                      >
                        {dictionary.pages.admin.sections[2].title}
                      </Typography.Title>
                      <Typography.Paragraph
                        style={{ color: "#6d5a46", margin: "8px 0 0" }}
                      >
                        {dictionary.pages.admin.sections[2].desc}
                      </Typography.Paragraph>
                    </div>
                    <Button
                      type="primary"
                      onClick={() => openUserEditor("create")}
                    >
                      {copy.addUser}
                    </Button>
                  </div>
                  <Table
                    rowKey="key"
                    columns={userColumns}
                    dataSource={users}
                    pagination={false}
                    scroll={{ x: "max-content" }}
                  />
                </Space>
              </Card>
            </Col>
          </Row>

          <Modal
            open={movieModal.open}
            title={
              movieModal.mode === "edit"
                ? copy.editMovie
                : "Thêm phim chiếu rạp mới"
            }
            onCancel={() => setMovieModal({ open: false, mode: "create" })}
            onOk={() => movieForm.submit()}
            okText={copy.save}
            cancelText={copy.cancel}
            confirmLoading={submittingMovie}
            width={800}
            destroyOnClose
          >
            {/* Modal Movie form content... */}
          </Modal>

          <Modal
            open={showtimeModal.open}
            title={
              showtimeModal.mode === "edit"
                ? copy.editShowtime
                : copy.addShowtime
            }
            onCancel={() => setShowtimeModal({ open: false, mode: "create" })}
            onOk={() => showtimeForm.submit()}
            okText={copy.save}
            cancelText={copy.cancel}
          >
            {/* Modal Showtime form content... */}
          </Modal>

          <Modal
            open={userModal.open}
            title={userModal.mode === "edit" ? copy.editUser : copy.addUser}
            onCancel={() => setUserModal({ open: false, mode: "create" })}
            onOk={() => userForm.submit()}
            okText={copy.save}
            cancelText={copy.cancel}
          >
            {/* Modal User form content... */}
          </Modal>

          <AdminConcessionManager
            open={concessionModalOpen}
            onClose={() => setConcessionModalOpen(false)}
          />
          <AdminPromotionManager
            open={promoModalOpen}
            onClose={() => setPromoModalOpen(false)}
          />
        </main>
      </SiteShell>
    </div>
  );
}

export function UserDashboardPage() {
  const { message, notification } = App.useApp(); // Thêm notification để thông báo copy
  const dictionary = useDictionary();
  const locale = useLocale();
  const copy = locale === "en" ? userCopy.en : userCopy.vi;

  const router = useRouter();
  const { token, user, logout } = useAuthSession();

  const [profile, setProfile] = useState(initialProfile);
  const [upcomingTickets, setUpcomingTickets] = useState(
    initialUpcomingTickets,
  );
  const [bookingHistory, setBookingHistory] = useState(initialBookingHistory);

  // 🔥 Đổi state chứa voucher thành mảng rỗng ban đầu
  const [vouchers, setVouchers] = useState<any[]>([]);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm] = Form.useForm<UserProfile>();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm] = Form.useForm();

  // ========================================================
  // 🎨 CẤU HÌNH MÀU SẮC VÀ ĐỊNH DẠNG CHO TỪNG HẠNG THÀNH VIÊN
  // ========================================================
  const TIER_STYLES: Record<
    string,
    { color: string; gradient: string; label: string }
  > = {
    BASIC: {
      color: "#e5e7eb", // Màu xám sáng cho chữ Basic trên nền đỏ
      gradient: "from-gray-400 to-gray-600",
      label: "BASIC",
    },
    SILVER: {
      color: "#f1f5f9", // Màu bạc sáng
      gradient: "from-slate-300 to-slate-500",
      label: "SILVER",
    },
    GOLD: {
      color: "#fde047", // Màu vàng kim
      gradient: "from-yellow-300 to-yellow-600",
      label: "GOLD",
    },
    PLATINUM: {
      color: "#ffffff", // Trắng tinh khiết
      gradient: "from-red-400 to-red-700",
      label: "PLATINUM",
    },
  };

  const currentTier = profile.memberTier?.toUpperCase() || "BASIC";
  const tierStyle = TIER_STYLES[currentTier] || TIER_STYLES.BASIC;
  // ========================================================

  const handleChangePassword = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    try {
      if (token) {
        await changePasswordApi(token, {
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        });
        message.success("Đổi mật khẩu thành công!");
        setPasswordModalOpen(false);
        passwordForm.resetFields();
      }
    } catch (error: any) {
      message.error(error.message || "Đổi mật khẩu thất bại!");
    }
  };

  useEffect(() => {
    if (token) {
      // 🔥 1. Chạy song song cả lấy Profile, Vé và VOUCHER
      Promise.all([
        getMyProfile(token),
        getMyTicketsApi(token),
        getMyVouchersApi(token), // Gọi API lấy Ví Voucher
      ])
        .then(([profileData, ticketData, voucherData]) => {
          // --- XỬ LÝ PROFILE ---
          if (profileData) {
            const dobParts = profileData.dateOfBirth
              ? profileData.dateOfBirth.split("-")
              : ["", "", ""];
            const mappedData = {
              fullName: profileData.fullName || "",
              email: profileData.email || "",
              phone: profileData.phone || "",
              gender:
                profileData.gender === "Nam"
                  ? "male"
                  : profileData.gender === "Nữ"
                    ? "female"
                    : "other",
              birthYear: dobParts[0] || "",
              birthMonth: dobParts[1] || "",
              birthDay: dobParts[2] || "",
              province: profileData.area
                ? AREA_MAP[profileData.area] || profileData.area
                : "",
              citizenId: profileData.citizenIdNumber || "",
              memberTier: profileData.memberTier || "BASIC",

              // 🔥 SỬA DÒNG NÀY: Quét cả 2 trường hợp tên biến để không bị lọt
              points:
                profileData.totalRewardPoints || profileData.rewardPoints || 0,

              totalSpending: profileData.totalSpending || 0,
              avatarUrl:
                profileData.avatarUrl ||
                "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
            };
            setProfile(mappedData);
            profileForm.setFieldsValue(mappedData);
          }

          // --- XỬ LÝ VÉ THẬT ---
          if (ticketData && ticketData.result) {
            const fetchedTickets = ticketData.result;
            const upcoming: TicketRecord[] = [];
            const history: TicketRecord[] = [];

            fetchedTickets.forEach((t: any) => {
              const record: TicketRecord = {
                key: t.id,
                movie: t.movieTitle || "Phim chưa cập nhật",
                cinema: t.cinemaName || "Rạp chưa cập nhật",
                time: dayjs(t.showtimeTime).format("HH:mm DD/MM/YYYY"),
                seats: `${t.seatRowName}${t.seatNumber}`,
                status:
                  t.status === "VALID"
                    ? "paid"
                    : t.status === "PENDING"
                      ? "reserved"
                      : "used",
                total: `${t.price?.toLocaleString("vi-VN") || 0}đ`,
              };

              if (
                t.status === "SCANNED" ||
                dayjs(t.showtimeTime).isBefore(dayjs())
              ) {
                history.push(record);
              } else {
                upcoming.push(record);
              }
            });
            setUpcomingTickets(upcoming);
            setBookingHistory(history);
          }

          // --- XỬ LÝ VOUCHER THẬT ---
          if (voucherData && voucherData.result) {
            const fetchedVouchers = voucherData.result.map((v: any) => ({
              key: v.id,
              code: v.discountCode,
              title: v.title,
              discount: `${v.discountPercent}%`,
              expireAt: dayjs(v.validUntil).format("HH:mm DD/MM/YYYY"),
              isUsed: v.isUsed,
              validUntil: v.validUntil,
            }));
            setVouchers(fetchedVouchers);
          }
        })
        .catch((error: any) => {
          console.error("Lỗi khi tải dữ liệu dashboard:", error);
          if (
            error.message?.includes("Unauthenticated") ||
            error.message?.includes("Token Invalid")
          ) {
            message.warning(
              "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!",
            );
            if (logout) logout();
            router.push("/");
          } else {
            message.error("Không thể tải dữ liệu. Vui lòng thử lại sau.");
          }
        });
    }
  }, [token, message, logout, router, profileForm]);

  const upcomingColumns: ColumnsType<TicketRecord> = [
    { title: copy.ticketMovie, dataIndex: "movie", key: "movie" },
    { title: copy.ticketSeats, dataIndex: "seats", key: "seats" },
    { title: copy.ticketCinema, dataIndex: "cinema", key: "cinema" },
    { title: copy.ticketTime, dataIndex: "time", key: "time" },
    {
      title: copy.ticketStatus,
      dataIndex: "status",
      key: "status",
      render: (value: TicketRecord["status"]) => (
        <Tag
          color={
            value === "paid" ? "green" : value === "reserved" ? "gold" : "blue"
          }
        >
          {copy.ticketStatusMap[value]}
        </Tag>
      ),
    },
    { title: copy.ticketTotal, dataIndex: "total", key: "total" },
    {
      title: copy.actions,
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          {record.status === "reserved" ? (
            <Button size="small" onClick={() => markTicketPaid(record.key)}>
              {copy.payNow}
            </Button>
          ) : null}
          <Button size="small" onClick={() => moveTicketToHistory(record.key)}>
            {copy.completeTicket}
          </Button>
        </Space>
      ),
    },
  ];

  const historyColumns: ColumnsType<TicketRecord> = [
    { title: copy.ticketMovie, dataIndex: "movie", key: "movie" },
    { title: copy.ticketCinema, dataIndex: "cinema", key: "cinema" },
    { title: copy.ticketTime, dataIndex: "time", key: "time" },
    { title: copy.ticketSeats, dataIndex: "seats", key: "seats" },
    { title: copy.ticketTotal, dataIndex: "total", key: "total" },
  ];

  // 🔥 CẬP NHẬT CỘT VOUCHER CHUẨN THỰC TẾ
  const voucherColumns: ColumnsType<any> = [
    {
      title: copy.voucherCode,
      dataIndex: "code",
      key: "code",
      render: (text) => (
        <Typography.Text strong className="text-[#a61d24]">
          {text}
        </Typography.Text>
      ),
    },
    { title: copy.voucherTitle, dataIndex: "title", key: "title" },
    { title: copy.voucherDiscount, dataIndex: "discount", key: "discount" },
    { title: copy.voucherExpire, dataIndex: "expireAt", key: "expireAt" },
    {
      title: copy.voucherStatus,
      key: "status",
      render: (_, record) => {
        if (record.isUsed) {
          return <Tag color="default">Đã dùng</Tag>;
        }
        if (dayjs().isAfter(dayjs(record.validUntil))) {
          return <Tag color="red">Hết hạn</Tag>;
        }
        return <Tag color="green">Sẵn sàng</Tag>;
      },
    },
    {
      title: copy.actions,
      key: "actions",
      render: (_, record) =>
        !record.isUsed && !dayjs().isAfter(dayjs(record.validUntil)) ? (
          <Button
            size="small"
            onClick={() => {
              navigator.clipboard.writeText(record.code);
              notification.success({
                message: "Đã copy mã ưu đãi",
                description: `Mã ${record.code} đã được lưu vào khay nhớ tạm. Hãy dán ở bước thanh toán nhé!`,
                placement: "topRight",
              });
            }}
          >
            Copy mã
          </Button>
        ) : null,
    },
  ];

  const saveProfile = async (values: any) => {
    const REVERSE_AREA_MAP: Record<string, string> = Object.fromEntries(
      Object.entries(AREA_MAP).map(([key, value]) => [value, key]),
    );
    try {
      const payload = {
        fullName: values.fullName,
        email: profile.email,
        phone: values.phone,
        gender:
          values.gender === "male"
            ? "Nam"
            : values.gender === "female"
              ? "Nữ"
              : "khác",
        area: REVERSE_AREA_MAP[values.province] || values.province,
        citizenIdNumber: values.citizenId,
        dateOfBirth: `${values.birthYear}-${String(values.birthMonth).padStart(2, "0")}-${String(values.birthDay).padStart(2, "0")}`,
      };
      if (token) {
        await updateMyProfile(token, payload);
        setProfile((prev) => ({
          ...prev,
          fullName: values.fullName,
          phone: values.phone,
          gender: values.gender,
          province: values.province,
          citizenId: values.citizenId,
          birthDay: values.birthDay,
          birthMonth: values.birthMonth,
          birthYear: values.birthYear,
        }));
        setProfileModalOpen(false);
        message.success(
          copy.profileUpdated || "Cập nhật thông tin thành công!",
        );
      }
    } catch (error: any) {
      console.error("Lỗi cập nhật Profile:", error);
      message.error(
        error.message || "Cập nhật thất bại. Vui lòng kiểm tra lại thông tin!",
      );
    }
  };

  function markTicketPaid(key: string) {
    setUpcomingTickets((current) =>
      current.map((item) =>
        item.key === key ? { ...item, status: "paid" } : item,
      ),
    );
    setProfile((current) => ({ ...current, points: current.points + 30 }));
    message.success(copy.paymentDone);
  }

  function moveTicketToHistory(key: string) {
    const ticket = upcomingTickets.find((item) => item.key === key);
    if (!ticket) return;
    setUpcomingTickets((current) => current.filter((item) => item.key !== key));
    setBookingHistory((current) => [{ ...ticket, status: "used" }, ...current]);
    setProfile((current) => ({ ...current, points: current.points + 50 }));
    message.success(copy.ticketMoved);
  }

  const tabItems: TabsProps["items"] = [
    {
      key: "1",
      label: locale === "en" ? "Account Information" : "Thông tin tài khoản",
      children: (
        <div className="py-4">
          <Form form={profileForm} layout="vertical" onFinish={saveProfile}>
            <div className="grid gap-x-8 md:grid-cols-2">
              <Form.Item
                name="fullName"
                label={
                  <strong className="text-gray-600">{copy.profileName}</strong>
                }
                rules={[{ required: true }]}
              >
                <Input
                  size="large"
                  prefix={<UserOutlined className="text-gray-400 mr-2" />}
                  className="rounded-lg bg-gray-50/50"
                />
              </Form.Item>
              <Form.Item
                name="email"
                label={
                  <strong className="text-gray-600">{copy.profileEmail}</strong>
                }
              >
                <Input
                  size="large"
                  prefix={<MailOutlined className="text-gray-400 mr-2" />}
                  disabled
                  className="rounded-lg"
                />
              </Form.Item>
            </div>

            <div className="grid gap-x-8 md:grid-cols-2 mt-2">
              <Form.Item
                label={
                  <strong className="text-gray-600">{copy.profileDob}</strong>
                }
                required
                className="mb-6"
              >
                <div className="grid gap-3 grid-cols-3">
                  <Form.Item
                    name="birthDay"
                    noStyle
                    rules={[{ required: true }]}
                  >
                    <Select
                      size="large"
                      placeholder={copy.day}
                      options={days.map((day) => ({ label: day, value: day }))}
                    />
                  </Form.Item>
                  <Form.Item
                    name="birthMonth"
                    noStyle
                    rules={[{ required: true }]}
                  >
                    <Select
                      size="large"
                      placeholder={copy.month}
                      options={months.map((month) => ({
                        label: month,
                        value: month,
                      }))}
                    />
                  </Form.Item>
                  <Form.Item
                    name="birthYear"
                    noStyle
                    rules={[{ required: true }]}
                  >
                    <Select
                      size="large"
                      placeholder={copy.year}
                      options={years.map((year) => ({
                        label: year,
                        value: year,
                      }))}
                      showSearch
                    />
                  </Form.Item>
                </div>
              </Form.Item>
              <Form.Item
                name="phone"
                label={
                  <strong className="text-gray-600">{copy.profilePhone}</strong>
                }
                rules={[{ required: true }]}
              >
                <Input
                  size="large"
                  prefix={<PhoneOutlined className="text-gray-400 mr-2" />}
                  className="rounded-lg bg-gray-50/50"
                />
              </Form.Item>
            </div>

            <div className="grid gap-x-8 md:grid-cols-2 mt-2">
              <Form.Item
                name="citizenId"
                label={
                  <strong className="text-gray-600">
                    {copy.profileCitizenId}
                  </strong>
                }
                rules={[{ required: true }]}
              >
                <Input
                  size="large"
                  prefix={<IdcardOutlined className="text-gray-400 mr-2" />}
                  maxLength={12}
                  className="rounded-lg bg-gray-50/50"
                />
              </Form.Item>
              <Form.Item
                name="province"
                label={
                  <strong className="text-gray-600">
                    {copy.profileProvince}
                  </strong>
                }
                rules={[{ required: true }]}
              >
                <Select
                  size="large"
                  showSearch
                  options={VIETNAM_PROVINCES.map((p) => ({
                    label: p,
                    value: p,
                  }))}
                />
              </Form.Item>
            </div>

            <div className="grid gap-x-8 md:grid-cols-2 mt-2 items-end">
              <Form.Item
                name="gender"
                label={
                  <strong className="text-gray-600">
                    {copy.profileGender}
                  </strong>
                }
                rules={[{ required: true }]}
                className="mb-0"
              >
                <Select
                  size="large"
                  options={[
                    { label: copy.male, value: "male" },
                    { label: copy.female, value: "female" },
                    { label: copy.other, value: "other" },
                  ]}
                />
              </Form.Item>

              <div className="flex justify-end pt-6 md:pt-0 items-center">
                {/* 🔥 CHUYỂN MÀU HOVER CHỮ "ĐỔI MẬT KHẨU?" SANG MÀU ĐỎ KCT */}
                <span
                  className="cursor-pointer font-semibold text-[#6d5a46] hover:text-[#a61d24] mr-6 transition-colors"
                  onClick={() => setPasswordModalOpen(true)}
                >
                  {locale === "en" ? "Change password?" : "Đổi mật khẩu?"}
                </span>

                {/* 🔥 ĐỔI MÀU NÚT "CẬP NHẬT" SANG MÀU ĐỎ KCT CINEMA */}
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  style={{ backgroundColor: "#a61d24", borderColor: "#a61d24" }}
                  className="px-10 font-bold rounded-lg shadow-md hover:opacity-80 transition-opacity"
                >
                  {copy.save}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      ),
    },
    {
      key: "2",
      label: copy.ticketTitle,
      children: (
        <div className="py-2">
          <Typography.Paragraph
            style={{ color: "#6d5a46", margin: "8px 0 16px" }}
          ></Typography.Paragraph>
          <Table
            rowKey="key"
            // 🔥 THÊM PHÂN TRANG VÉ SẮP TỚI
            pagination={{
              pageSize: 5,
              showSizeChanger: false,
              position: ["bottomCenter"],
            }}
            dataSource={upcomingTickets}
            columns={upcomingColumns}
            scroll={{ x: "max-content" }}
          />
        </div>
      ),
    },
    {
      key: "3",
      label: copy.historyTitle,
      children: (
        <div className="py-2">
          <Typography.Paragraph
            style={{ color: "#6d5a46", margin: "8px 0 16px" }}
          ></Typography.Paragraph>

          <div className="rounded-[18px] border border-[#ead6bb] bg-[#fffaf4] p-4 text-[#6d5a46] mb-6 w-full shadow-sm">
            <div className="flex items-center justify-between">
              <span>{copy.totalOrders}</span>
              <strong style={{ color: "#4a3426", fontSize: "16px" }}>
                {upcomingTickets.length + bookingHistory.length}
              </strong>
            </div>
            {/* Thêm một đường gạch mờ để phân cách cho đẹp hơn */}
            <div className="border-b border-[#ead6bb] my-2 opacity-50"></div>
            <div className="flex items-center justify-between">
              <span>{copy.paidTickets}</span>
              <strong style={{ color: "#a61d24", fontSize: "16px" }}>
                {bookingHistory.length +
                  upcomingTickets.filter((item) => item.status === "paid")
                    .length}
              </strong>
            </div>
          </div>

          <Table
            rowKey="key"
            // 🔥 THÊM PHÂN TRANG LỊCH SỬ
            pagination={{
              pageSize: 5,
              showSizeChanger: false,
              position: ["bottomCenter"],
            }}
            dataSource={bookingHistory}
            columns={historyColumns}
            scroll={{ x: "max-content" }}
          />
        </div>
      ),
    },
    {
      key: "4",
      label: copy.voucherTitle,
      children: (
        <div className="py-2">
          <Table
            rowKey="key"
            // 🔥 THÊM PHÂN TRANG VOUCHER
            pagination={{
              pageSize: 5,
              showSizeChanger: false,
              position: ["bottomCenter"],
            }}
            dataSource={vouchers}
            columns={voucherColumns}
            size="small"
            scroll={{ x: "max-content" }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="cinema-page">
      <SiteShell>
        <main className="cinema-shell px-4 py-8 sm:px-6">
          <Row gutter={[24, 24]} className="mt-8">
            <Col xs={24} lg={7} xl={6}>
              <div className="relative bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-100 h-full flex flex-col">
                {/* --- PHẦN 1: NỬA TRÊN (NỀN THẺ & HUY CHƯƠNG) --- */}
                {/* 👇 Chỉnh màu viền dưới thẻ sang màu đỏ đậm border-red-700 */}
                <div className="h-40 member-card-bg relative p-5 flex justify-between items-start z-0 border-b border-red-700">
                  {/* Huy chương & Hạng */}
                  <div className="z-10 flex flex-col items-center">
                    {/* 👇 HUY CHƯƠNG ĐỔI MÀU VÀ HIỆU ỨNG THEO HẠNG */}
                    <div
                      className={`w-14 h-14 rounded-full bg-gradient-to-br ${tierStyle.gradient} shadow-lg flex items-center justify-center border-2 border-white mb-2 relative`}
                    >
                      {/* Vải ruy băng giả */}
                      <div className="absolute -top-6 w-3 h-6 bg-blue-500 -ml-4 z-[-1] border-r border-blue-600"></div>
                      <div className="absolute -top-6 w-3 h-6 bg-blue-500 ml-4 z-[-1] border-l border-blue-600"></div>

                      {/* Biểu tượng thay đổi theo hạng */}
                      <span className="text-white text-2xl font-bold">
                        {currentTier === "PLATINUM" ? "💎" : "★"}
                      </span>
                    </div>

                    {/* 👇 TÊN HẠNG ĐỔI MÀU (Nếu Platinum thì cho màu đỏ rực rỡ/trắng) */}
                    <Typography.Text
                      className="font-black text-lg tracking-wider"
                      style={{
                        color:
                          currentTier === "PLATINUM"
                            ? "#ffffff"
                            : tierStyle.color,
                      }}
                    >
                      {tierStyle.label}
                    </Typography.Text>

                    <Typography.Text className="text-xs text-white/80 uppercase font-semibold">
                      {profile.fullName}
                    </Typography.Text>
                  </div>

                  {/* Nút điểm số (Giống Metiz) */}
                  <Tag
                    color="default"
                    className="z-10 m-0 rounded-full px-3 py-1 font-bold text-[#a61d24] bg-white border-white shadow-sm"
                  >
                    ★ {profile.points} điểm
                  </Tag>
                </div>

                {/* --- PHẦN 2: AVATAR (Nằm đè lên ranh giới) --- */}
                <div className="flex justify-center -mt-8 relative z-10">
                  <Upload
                    name="avatar"
                    showUploadList={false}
                    // ... (hàm customRequest giữ nguyên như cũ) ...
                    customRequest={async (options) => {
                      const { file, onSuccess, onError } = options;
                      try {
                        if (!token || !user?.id) {
                          message.error(
                            "Lỗi xác thực. Vui lòng đăng nhập lại!",
                          );
                          onError?.(new Error("No user id"));
                          return;
                        }
                        const newAvatarUrl = await uploadAvatarApi(
                          token,
                          user.id,
                          file as File,
                        );
                        setProfile((prev) => ({
                          ...prev,
                          avatarUrl: newAvatarUrl,
                        }));
                        message.success("Cập nhật ảnh đại diện thành công!");
                        onSuccess?.("ok");
                      } catch (error) {
                        message.error(
                          "Cập nhật ảnh thất bại. Vui lòng thử lại!",
                        );
                        onError?.(error as Error);
                      }
                    }}
                  >
                    <div className="relative inline-block cursor-pointer group rounded-full overflow-hidden border-4 border-white shadow-md bg-white">
                      <Avatar size={96} src={profile.avatarUrl} />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <CameraOutlined
                          style={{ color: "white", fontSize: 24 }}
                        />
                      </div>
                    </div>
                  </Upload>
                </div>

                {/* --- PHẦN 3: MÃ VẠCH & TỔNG CHI TIÊU & TIẾN TRÌNH --- */}
                <div className="px-6 pb-6 pt-4 flex-1 flex flex-col items-center">
                  {/* Mã vạch */}
                  <div className="w-full text-center mb-6">
                    <Typography.Text className="text-xs font-bold text-gray-800 uppercase block mb-1">
                      Mã số thành viên
                    </Typography.Text>
                    <div className="fake-barcode mb-1"></div>
                    <Typography.Text className="text-xs text-gray-500">
                      {profile.email}
                    </Typography.Text>
                  </div>

                  {/* Tổng chi tiêu */}
                  <div className="w-full flex justify-between items-end border-b border-gray-100 pb-2 mb-4">
                    <Typography.Text className="font-bold text-gray-800 text-sm">
                      Tổng chi tiêu {new Date().getFullYear()}
                    </Typography.Text>
                    <Typography.Text className="font-black text-[#a61d24] text-lg">
                      {profile.totalSpending.toLocaleString("vi-VN")} đ
                    </Typography.Text>
                  </div>

                  {/* Thanh tiến trình hạng (Progress Bar) */}
                  <div className="w-full relative px-2">
                    {/* Đường gạch ngang nền */}
                    <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-gray-200 -translate-y-1/2 z-0"></div>

                    <div className="flex justify-between items-center relative z-10">
                      {["BASIC", "SILVER", "GOLD", "PLATINUM"].map(
                        (tier, index, arr) => {
                          // Tính toán logic Active
                          const currentTierIndex = arr.indexOf(
                            profile.memberTier?.toUpperCase() || "BASIC",
                          );
                          const isActive = index <= currentTierIndex;
                          const isCurrent = index === currentTierIndex;

                          return (
                            <div
                              key={tier}
                              className="flex flex-col items-center bg-white px-1 cursor-default"
                            >
                              {/* Chấm tròn */}
                              <div
                                className={`w-4 h-4 rounded-full border-[3px] transition-colors ${
                                  isActive
                                    ? "border-[#a61d24] bg-[#a61d24]"
                                    : "border-gray-300 bg-white"
                                } ${isCurrent ? "ring-2 ring-red-200 ring-offset-1" : ""}`}
                              />
                              {/* Tên hạng */}
                              <span
                                className={`text-[10px] mt-1 font-bold tracking-tighter ${
                                  isActive ? "text-[#a61d24]" : "text-gray-400"
                                }`}
                              >
                                {tier}
                              </span>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={24} lg={17} xl={18}>
              <Card
                bordered={false}
                className="cinema-paper rounded-[24px] min-h-[400px]"
              >
                {/* 🔥 GẮN CLASS .cinema-red-tabs ĐỂ KÍCH HOẠT MÀU ĐỎ KCT */}
                <Tabs
                  className="cinema-red-tabs"
                  defaultActiveKey="1"
                  items={tabItems}
                  type="card"
                  size="large"
                />
              </Card>
            </Col>
          </Row>

          <Modal
            open={passwordModalOpen}
            title={locale === "en" ? "Change Password" : "Đổi mật khẩu"}
            onCancel={() => {
              setPasswordModalOpen(false);
              passwordForm.resetFields();
            }}
            footer={null}
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
              className="mt-4"
            >
              <Form.Item
                name="oldPassword"
                label={
                  <strong className="text-gray-600">
                    {locale === "en" ? "Old Password" : "Mật khẩu cũ"}
                  </strong>
                }
                rules={[
                  {
                    required: true,
                    message:
                      locale === "en"
                        ? "Please input your old password"
                        : "Vui lòng nhập mật khẩu cũ",
                  },
                ]}
              >
                <Input.Password
                  size="large"
                  className="rounded-lg bg-gray-50/50"
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label={
                  <strong className="text-gray-600">
                    {locale === "en" ? "New Password" : "Mật khẩu mới"}
                  </strong>
                }
                rules={[
                  {
                    required: true,
                    message:
                      locale === "en"
                        ? "Please input your new password"
                        : "Vui lòng nhập mật khẩu mới",
                  },
                ]}
                extra={
                  locale === "en"
                    ? "Password must be at least 8 characters, including lowercase, uppercase, numbers, and special characters."
                    : "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ thường, chữ in hoa, số và ký tự đặc biệt."
                }
              >
                <Input.Password
                  size="large"
                  className="rounded-lg bg-gray-50/50"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label={
                  <strong className="text-gray-600">
                    {locale === "en"
                      ? "Confirm New Password"
                      : "Nhập lại mật khẩu mới"}
                  </strong>
                }
                rules={[
                  {
                    required: true,
                    message:
                      locale === "en"
                        ? "Please confirm your new password"
                        : "Vui lòng xác nhận mật khẩu mới",
                  },
                ]}
              >
                <Input.Password
                  size="large"
                  className="rounded-lg bg-gray-50/50"
                />
              </Form.Item>

              <div className="flex justify-end mt-6">
                {/* 🔥 ĐỔI MÀU NÚT "LƯU MẬT KHẨU" SANG MÀU ĐỎ KCT CINEMA */}
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  style={{ backgroundColor: "#a61d24", borderColor: "#a61d24" }}
                  className="px-8 font-bold rounded-lg shadow-md"
                >
                  {locale === "en" ? "Save Password" : "Lưu mật khẩu"}
                </Button>
              </div>
            </Form>
          </Modal>
        </main>
      </SiteShell>
    </div>
  );
}

const adminCopy = {
  vi: {
    actions: "Thao tác",
    edit: "Sửa",
    delete: "Xóa",
    save: "Lưu",
    cancel: "Hủy",
    feature: "Đưa nổi bật",
    unfeature: "Bỏ nổi bật",
    changeStatus: "Đổi trạng thái",
    block: "Khóa",
    unblock: "Mở khóa",
    addMovie: "Thêm phim",
    addShowtime: "Thêm lịch chiếu",
    addUser: "Thêm người dùng",
    editMovie: "Chỉnh sửa phim",
    editShowtime: "Chỉnh sửa lịch chiếu",
    editUser: "Chỉnh sửa người dùng",
    movieCreated: "Đã thêm phim mới.",
    movieUpdated: "Đã cập nhật phim.",
    movieDeleted: "Đã xóa phim.",
    showtimeCreated: "Đã thêm lịch chiếu.",
    showtimeUpdated: "Đã cập nhật lịch chiếu.",
    showtimeDeleted: "Đã xóa lịch chiếu.",
    userCreated: "Đã thêm người dùng.",
    userUpdated: "Đã cập nhật người dùng.",
    userDeleted: "Đã xóa người dùng.",
    featuredYes: "Có",
    featuredNo: "Không",
    moduleMoviesTitle: "Tổng phim đang quản lý",
    moduleMoviesDesc:
      "Thêm mới hoặc cập nhật trạng thái phim hiển thị trên hệ thống.",
    moduleShowtimesTitle: "Lịch chiếu đang mở bán",
    moduleShowtimesDesc:
      "Quản lý các suất chiếu đang mở, tạm dừng hoặc đã bán hết.",
    moduleUsersTitle: "Người dùng đang hoạt động",
    movieColumns: {
      title: "Tên phim",
      genre: "Thể loại",
      status: "Trạng thái",
      featured: "Nổi bật",
    },
    showtimeColumns: {
      movie: "Phim",
      cinema: "Rạp",
      room: "Phòng",
      format: "Format",
      time: "Thời gian",
      status: "Trạng thái",
    },
    userColumns: {
      name: "Họ tên",
      email: "Email",
      role: "Vai trò",
      status: "Trạng thái",
      vouchers: "Voucher",
    },
    movieStatus: { showing: "Đang chiếu", coming: "Sắp chiếu", hidden: "Ẩn" },
    showtimeStatus: { open: "Mở bán", paused: "Tạm dừng", soldout: "Hết vé" },
    userRole: { admin: "Admin", user: "User" },
    userStatus: { active: "Hoạt động", blocked: "Đã khóa" },
  },
  en: {
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    feature: "Feature",
    unfeature: "Unfeature",
    changeStatus: "Change status",
    block: "Block",
    unblock: "Unblock",
    addMovie: "Add movie",
    addShowtime: "Add showtime",
    addUser: "Add user",
    editMovie: "Edit movie",
    editShowtime: "Edit showtime",
    editUser: "Edit user",
    movieCreated: "Movie created.",
    movieUpdated: "Movie updated.",
    movieDeleted: "Movie deleted.",
    showtimeCreated: "Showtime created.",
    showtimeUpdated: "Showtime updated.",
    showtimeDeleted: "Showtime deleted.",
    userCreated: "User created.",
    userUpdated: "User updated.",
    userDeleted: "User deleted.",
    featuredYes: "Yes",
    featuredNo: "No",
    moduleMoviesTitle: "Managed movies",
    moduleMoviesDesc:
      "Create new movies or update their visibility across the system.",
    moduleShowtimesTitle: "Open showtimes",
    moduleShowtimesDesc:
      "Manage sessions that are on sale, paused, or sold out.",
    moduleUsersTitle: "Active users",
    moduleUsersDesc: "Track active accounts and create additional demo users.",
    movieColumns: {
      title: "Movie title",
      genre: "Genre",
      status: "Status",
      featured: "Featured",
    },
    showtimeColumns: {
      movie: "Movie",
      cinema: "Cinema",
      room: "Room",
      format: "Format",
      time: "Time",
      status: "Status",
    },
    userColumns: {
      name: "Full name",
      email: "Email",
      role: "Role",
      status: "Status",
      vouchers: "Vouchers",
    },
    movieStatus: {
      showing: "Now showing",
      coming: "Coming soon",
      hidden: "Hidden",
    },
    showtimeStatus: { open: "On sale", paused: "Paused", soldout: "Sold out" },
    userRole: { admin: "Admin", user: "User" },
    userStatus: { active: "Active", blocked: "Blocked" },
  },
} as const;

const userCopy = {
  vi: {
    actions: "Thao tác",
    save: "Cập nhật",
    cancel: "Hủy",
    ticketTitle: "Vé sắp tới của bạn",
    historyTitle: "Lịch sử đặt vé",
    ticketMovie: "Phim",
    ticketSeats: "Ghế",
    ticketCinema: "Rạp",
    ticketTime: "Suất chiếu",
    ticketStatus: "Trạng thái",
    ticketTotal: "Tổng tiền",
    ticketStatusMap: {
      paid: "Đã thanh toán",
      reserved: "Đã giữ chỗ",
      used: "Đã xem",
    },
    payNow: "Thanh toán ngay",
    completeTicket: "Đưa vào lịch sử",
    paymentDone: "Đã cập nhật vé sang trạng thái đã thanh toán.",
    ticketMoved: "Đã chuyển vé sang lịch sử đặt vé.",
    editProfile: "Chỉnh sửa hồ sơ",
    profileUpdated: "Đã cập nhật thông tin tài khoản.",
    profileName: "Họ tên",
    profileEmail: "Email",
    profilePhone: "Số điện thoại",
    profileTier: "Hạng thành viên",
    pointsLabel: "Điểm",
    profileGender: "Giới tính",
    profileDob: "Ngày sinh",
    profileProvince: "Tỉnh/Thành phố",
    profileCitizenId: "CCCD",
    male: "Nam",
    female: "Nữ",
    other: "Khác",
    day: "Ngày",
    month: "Tháng",
    year: "Năm",
    totalOrders: "Tổng đơn hàng",
    paidTickets: "Vé đã thanh toán",
    voucherCode: "Mã",
    voucherTitle: "Voucher & Điểm thưởng",
    voucherDiscount: "Giảm",
    voucherExpire: "Hết hạn",
    voucherStatus: "Trạng thái",
    voucherStatusMap: { available: "Khả dụng", used: "Đã dùng" },
    useVoucher: "Dùng voucher",
    voucherApplied: "Đã đánh dấu voucher là đã dùng.",
  },
  en: {
    actions: "Actions",
    save: "Update",
    cancel: "Cancel",
    ticketTitle: "Your upcoming tickets",
    ticketDesc:
      "This area lets you quickly review reserved seats and the latest payment state.",
    historyTitle: "Booking history",
    historyDesc:
      "Track watched sessions, visited cinemas, and recent order totals.",
    ticketMovie: "Movie",
    ticketSeats: "Seats",
    ticketCinema: "Cinema",
    ticketTime: "Showtime",
    ticketStatus: "Status",
    ticketTotal: "Total",
    ticketStatusMap: { paid: "Paid", reserved: "Reserved", used: "Watched" },
    payNow: "Pay now",
    completeTicket: "Move to history",
    paymentDone: "Ticket status has been updated to paid.",
    ticketMoved: "Ticket moved to booking history.",
    editProfile: "Edit profile",
    profileUpdated: "Account profile updated.",
    profileName: "Full name",
    profileEmail: "Email",
    profilePhone: "Phone number",
    profileTier: "Member tier",
    pointsLabel: "Points",
    profileGender: "Gender",
    profileDob: "Date of Birth",
    profileProvince: "Province/City",
    profileCitizenId: "Citizen ID",
    male: "Male",
    female: "Female",
    other: "Other",
    day: "Day",
    month: "Month",
    year: "Year",
    totalOrders: "Total orders",
    paidTickets: "Paid tickets",
    voucherCode: "Code",
    voucherTitle: "Vouchers & Points",
    voucherDiscount: "Discount",
    voucherExpire: "Expires",
    voucherStatus: "Status",
    voucherStatusMap: { available: "Available", used: "Used" },
    useVoucher: "Use voucher",
    voucherApplied: "Voucher marked as used.",
  },
} as const;

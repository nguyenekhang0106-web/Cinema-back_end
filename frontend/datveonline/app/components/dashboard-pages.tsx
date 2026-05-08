"use client";
import {
  getMyProfile,
  updateMyProfile,
  uploadAvatarApi,
} from "../lib/cinema-api";
import { useAuthSession } from "./auth-session-provider";
import {
  CameraOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import {
  App,
  Avatar, // <-- Bổ sung Avatar
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  Upload, // <-- Bổ sung Upload
  Tabs,
  type TabsProps
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Image from "next/image";
import { useState, useEffect } from "react";
import { SiteShell } from "./site-shell";
import { useDictionary, useLocale } from "./locale-provider";

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
};

const initialMovies: MovieRecord[] = [
  {
    key: "mv-01",
    title: "Dia Dao: Mat Troi Trong Bong Toi",
    genre: "Drama",
    status: "showing",
    featured: true,
  },
  {
    key: "mv-02",
    title: "Lat Mat 8",
    genre: "Action",
    status: "coming",
    featured: false,
  },
  {
    key: "mv-03",
    title: "Tham Tu Kien",
    genre: "Mystery",
    status: "hidden",
    featured: false,
  },
];

const initialShowtimes: ShowtimeRecord[] = [
  {
    key: "st-01",
    movieTitle: "Dia Dao: Mat Troi Trong Bong Toi",
    cinema: "KCT Vincom",
    room: "P01",
    format: "2D",
    time: "20:30 21/04/2026",
    status: "open",
  },
  {
    key: "st-02",
    movieTitle: "Lat Mat 8",
    cinema: "KCT Landmark",
    room: "P04",
    format: "IMAX",
    time: "18:45 22/04/2026",
    status: "paused",
  },
  {
    key: "st-03",
    movieTitle: "Tham Tu Kien",
    cinema: "KCT Go Vap",
    room: "P02",
    format: "2D",
    time: "16:15 23/04/2026",
    status: "soldout",
  },
];

const initialUsers: UserRecord[] = [
  {
    key: "us-01",
    fullName: "Nguyen Quan Tri",
    email: "admin@kctcinema.vn",
    role: "admin",
    status: "active",
    vouchers: 8,
  },
  {
    key: "us-02",
    fullName: "Tran Khach Hang",
    email: "user@kctcinema.vn",
    role: "user",
    status: "active",
    vouchers: 3,
  },
  {
    key: "us-03",
    fullName: "Le Thanh Vien",
    email: "member@kctcinema.vn",
    role: "user",
    status: "blocked",
    vouchers: 0,
  },
];

const initialProfile: UserProfile = {
  fullName: "Tran Khach Hang",
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
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
};

// Bổ sung các hằng số cần thiết cho Form (đặt ngay dưới initialProfile)
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
    movie: "Dia Dao: Mat Troi Trong Bong Toi",
    seats: "B5, B6",
    cinema: "KCT Vincom",
    time: "20:30 21/04/2026",
    status: "paid",
    total: "220.000d",
  },
  {
    key: "t-2",
    movie: "Lat Mat 8",
    seats: "C7",
    cinema: "KCT Landmark",
    time: "18:45 22/04/2026",
    status: "reserved",
    total: "110.000d",
  },
];

const initialBookingHistory: TicketRecord[] = [
  {
    key: "h-1",
    movie: "Nha Ba Nu",
    seats: "D4, D5",
    cinema: "KCT Go Vap",
    time: "19:15 03/04/2026",
    status: "used",
    total: "210.000d",
  },
  {
    key: "h-2",
    movie: "Mai",
    seats: "E8",
    cinema: "KCT Thu Duc",
    time: "21:00 28/03/2026",
    status: "used",
    total: "105.000d",
  },
];

const initialVouchers: VoucherRecord[] = [
  {
    key: "v-1",
    code: "KCTGOLD50",
    title: "Giam 50.000d cho hoa don tu 2 ve",
    discount: "50.000d",
    expireAt: "30/04/2026",
    status: "available",
  },
  {
    key: "v-2",
    code: "COMBO20",
    title: "Giam 20% combo bap nuoc",
    discount: "20%",
    expireAt: "10/05/2026",
    status: "available",
  },
  {
    key: "v-3",
    code: "WELCOME10",
    title: "Uu dai thanh vien moi",
    discount: "10%",
    expireAt: "15/03/2026",
    status: "used",
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

  const [movies, setMovies] = useState(initialMovies);
  const [showtimes, setShowtimes] = useState(initialShowtimes);
  const [users, setUsers] = useState(initialUsers);

  const [movieForm] = Form.useForm<MovieRecord>();
  const [showtimeForm] = Form.useForm<ShowtimeRecord>();
  const [userForm] = Form.useForm<UserRecord>();

  const [movieModal, setMovieModal] = useState<{
    open: boolean;
    mode: EditorMode;
    editingKey?: string;
  }>({
    open: false,
    mode: "create",
  });
  const [showtimeModal, setShowtimeModal] = useState<{
    open: boolean;
    mode: EditorMode;
    editingKey?: string;
  }>({
    open: false,
    mode: "create",
  });
  const [userModal, setUserModal] = useState<{
    open: boolean;
    mode: EditorMode;
    editingKey?: string;
  }>({
    open: false,
    mode: "create",
  });

  const stats = [
    { label: dictionary.pages.admin.stats[0].label, value: movies.length },
    { label: dictionary.pages.admin.stats[1].label, value: showtimes.length },
    {
      label: dictionary.pages.admin.stats[2].label,
      value: users.filter((item) => item.role === "admin").length,
    },
  ];

  const movieColumns: ColumnsType<MovieRecord> = [
    { title: copy.movieColumns.title, dataIndex: "title", key: "title" },
    { title: copy.movieColumns.genre, dataIndex: "genre", key: "genre" },
    {
      title: copy.movieColumns.status,
      dataIndex: "status",
      key: "status",
      render: (value: MovieStatus) => (
        <StatusTag
          color={
            value === "showing"
              ? "green"
              : value === "coming"
                ? "gold"
                : "default"
          }
          label={copy.movieStatus[value]}
        />
      ),
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
    {
      title: copy.actions,
      key: "actions",
      render: (_, record) => (
        <Space wrap>
          <Button size="small" onClick={() => openMovieEditor("edit", record)}>
            {copy.edit}
          </Button>
          <Button size="small" onClick={() => toggleMovieFeatured(record.key)}>
            {record.featured ? copy.unfeature : copy.feature}
          </Button>
          <Button danger size="small" onClick={() => removeMovie(record.key)}>
            {copy.delete}
          </Button>
        </Space>
      ),
    },
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
      title: copy.userColumns.vouchers,
      dataIndex: "vouchers",
      key: "vouchers",
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

  function openMovieEditor(mode: EditorMode, record?: MovieRecord) {
    setMovieModal({ open: true, mode, editingKey: record?.key });
    movieForm.setFieldsValue(
      record ?? {
        key: "",
        title: "",
        genre: "",
        status: "coming",
        featured: false,
      },
    );
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
      },
    );
  }

  function saveMovie(values: MovieRecord) {
    if (movieModal.mode === "edit" && movieModal.editingKey) {
      setMovies((current) =>
        current.map((item) =>
          item.key === movieModal.editingKey ? { ...item, ...values } : item,
        ),
      );
      message.success(copy.movieUpdated);
    } else {
      setMovies((current) => [
        ...current,
        { ...values, key: `mv-${Date.now()}` },
      ]);
      message.success(copy.movieCreated);
    }
    setMovieModal({ open: false, mode: "create" });
    movieForm.resetFields();
  }

  function saveShowtime(values: ShowtimeRecord) {
    if (showtimeModal.mode === "edit" && showtimeModal.editingKey) {
      setShowtimes((current) =>
        current.map((item) =>
          item.key === showtimeModal.editingKey ? { ...item, ...values } : item,
        ),
      );
      message.success(copy.showtimeUpdated);
    } else {
      setShowtimes((current) => [
        ...current,
        { ...values, key: `st-${Date.now()}` },
      ]);
      message.success(copy.showtimeCreated);
    }
    setShowtimeModal({ open: false, mode: "create" });
    showtimeForm.resetFields();
  }

  function saveUser(values: UserRecord) {
    if (userModal.mode === "edit" && userModal.editingKey) {
      setUsers((current) =>
        current.map((item) =>
          item.key === userModal.editingKey ? { ...item, ...values } : item,
        ),
      );
      message.success(copy.userUpdated);
    } else {
      setUsers((current) => [
        ...current,
        { ...values, key: `us-${Date.now()}` },
      ]);
      message.success(copy.userCreated);
    }
    setUserModal({ open: false, mode: "create" });
    userForm.resetFields();
  }

  function toggleMovieFeatured(key: string) {
    setMovies((current) =>
      current.map((item) =>
        item.key === key ? { ...item, featured: !item.featured } : item,
      ),
    );
  }

  function cycleShowtimeStatus(key: string) {
    const order: ShowtimeStatus[] = ["open", "paused", "soldout"];
    setShowtimes((current) =>
      current.map((item) => {
        if (item.key !== key) return item;
        const nextStatus =
          order[(order.indexOf(item.status) + 1) % order.length];
        return { ...item, status: nextStatus };
      }),
    );
  }

  function toggleUserStatus(key: string) {
    setUsers((current) =>
      current.map((item) =>
        item.key === key
          ? { ...item, status: item.status === "active" ? "blocked" : "active" }
          : item,
      ),
    );
  }

  function removeMovie(key: string) {
    setMovies((current) => current.filter((item) => item.key !== key));
    message.success(copy.movieDeleted);
  }

  function removeShowtime(key: string) {
    setShowtimes((current) => current.filter((item) => item.key !== key));
    message.success(copy.showtimeDeleted);
  }

  function removeUser(key: string) {
    setUsers((current) => current.filter((item) => item.key !== key));
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
      value: showtimes.filter((item) => item.status === "open").length,
      desc: copy.moduleShowtimesDesc,
      action: () => openShowtimeEditor("create"),
      actionLabel: copy.addShowtime,
    },
    {
      title: copy.moduleUsersTitle,
      value: users.filter((item) => item.status === "active").length,
      desc: copy.moduleUsersDesc,
      action: () => openUserEditor("create"),
      actionLabel: copy.addUser,
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
              <Col xs={24} md={8} key={card.title}>
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
                    pagination={false}
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
                  />
                </Space>
              </Card>
            </Col>
          </Row>

          <Modal
            open={movieModal.open}
            title={movieModal.mode === "edit" ? copy.editMovie : copy.addMovie}
            onCancel={() => setMovieModal({ open: false, mode: "create" })}
            onOk={() => movieForm.submit()}
            okText={copy.save}
            cancelText={copy.cancel}
          >
            <Form form={movieForm} layout="vertical" onFinish={saveMovie}>
              <Form.Item
                name="title"
                label={copy.movieColumns.title}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="genre"
                label={copy.movieColumns.genre}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="status"
                label={copy.movieColumns.status}
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: "showing", label: copy.movieStatus.showing },
                    { value: "coming", label: copy.movieStatus.coming },
                    { value: "hidden", label: copy.movieStatus.hidden },
                  ]}
                />
              </Form.Item>
              <Form.Item
                name="featured"
                label={copy.movieColumns.featured}
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: true, label: copy.featuredYes },
                    { value: false, label: copy.featuredNo },
                  ]}
                />
              </Form.Item>
            </Form>
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
            <Form form={showtimeForm} layout="vertical" onFinish={saveShowtime}>
              <Form.Item
                name="movieTitle"
                label={copy.showtimeColumns.movie}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="cinema"
                label={copy.showtimeColumns.cinema}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <div className="grid gap-4 md:grid-cols-2">
                <Form.Item
                  name="room"
                  label={copy.showtimeColumns.room}
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="format"
                  label={copy.showtimeColumns.format}
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </div>
              <Form.Item
                name="time"
                label={copy.showtimeColumns.time}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="status"
                label={copy.showtimeColumns.status}
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: "open", label: copy.showtimeStatus.open },
                    { value: "paused", label: copy.showtimeStatus.paused },
                    { value: "soldout", label: copy.showtimeStatus.soldout },
                  ]}
                />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            open={userModal.open}
            title={userModal.mode === "edit" ? copy.editUser : copy.addUser}
            onCancel={() => setUserModal({ open: false, mode: "create" })}
            onOk={() => userForm.submit()}
            okText={copy.save}
            cancelText={copy.cancel}
          >
            <Form form={userForm} layout="vertical" onFinish={saveUser}>
              <Form.Item
                name="fullName"
                label={copy.userColumns.name}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="email"
                label={copy.userColumns.email}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <div className="grid gap-4 md:grid-cols-2">
                <Form.Item
                  name="role"
                  label={copy.userColumns.role}
                  rules={[{ required: true }]}
                >
                  <Select
                    options={[
                      { value: "admin", label: copy.userRole.admin },
                      { value: "user", label: copy.userRole.user },
                    ]}
                  />
                </Form.Item>
                <Form.Item
                  name="status"
                  label={copy.userColumns.status}
                  rules={[{ required: true }]}
                >
                  <Select
                    options={[
                      { value: "active", label: copy.userStatus.active },
                      { value: "blocked", label: copy.userStatus.blocked },
                    ]}
                  />
                </Form.Item>
              </div>
              <Form.Item
                name="vouchers"
                label={copy.userColumns.vouchers}
                rules={[{ required: true }]}
              >
                <Input type="number" />
              </Form.Item>
            </Form>
          </Modal>
        </main>
      </SiteShell>
    </div>
  );
}

export function UserDashboardPage() {
  const { message } = App.useApp();
  const dictionary = useDictionary();
  const locale = useLocale();
  const copy = locale === "en" ? userCopy.en : userCopy.vi;

  const router = useRouter();
  const { token, user, logout } = useAuthSession();

  const [profile, setProfile] = useState(initialProfile);
  const [upcomingTickets, setUpcomingTickets] = useState(initialUpcomingTickets);
  const [bookingHistory, setBookingHistory] = useState(initialBookingHistory);
  const [vouchers, setVouchers] = useState(initialVouchers);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm] = Form.useForm<UserProfile>();

  useEffect(() => {
    if (token) {
      getMyProfile(token)
        .then((data) => {
          if (data) {
            const dobParts = data.dateOfBirth ? data.dateOfBirth.split("-") : ["", "", ""];

            const mappedData = {
              fullName: data.fullName || "",
              email: data.email || "",
              phone: data.phone || "",
              gender: data.gender === "Nam" ? "male" : data.gender === "Nữ" ? "female" : "other",
              birthYear: dobParts[0] || "",
              birthMonth: dobParts[1] || "",
              birthDay: dobParts[2] || "",
              province: data.area ? AREA_MAP[data.area] || data.area : "",
              citizenId: data.citizenIdNumber || "",
              memberTier: data.memberTier || "Gold",
              points: data.points || 0,
              avatarUrl: data.avatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
            };

            setProfile(mappedData);
            
            // 🔥 THÊM DÒNG NÀY: Điền dữ liệu vào form trực tiếp
            profileForm.setFieldsValue(mappedData); 
          }
        })
        .catch((error: any) => {
          console.error("Lỗi khi tải thông tin user:", error);
          if (error.message?.includes("Unauthenticated") || error.message?.includes("Token Invalid")) {
            message.warning("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
            if (logout) logout();
            router.push("/");
          } else {
            message.error("Không thể tải thông tin cá nhân. Vui lòng thử lại sau.");
          }
        });
    }
  }, [token, message, logout, router]);


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
        <Tag color={value === "paid" ? "green" : value === "reserved" ? "gold" : "blue"}>
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

  const voucherColumns: ColumnsType<VoucherRecord> = [
    { title: copy.voucherCode, dataIndex: "code", key: "code" },
    { title: copy.voucherTitle, dataIndex: "title", key: "title" },
    { title: copy.voucherDiscount, dataIndex: "discount", key: "discount" },
    { title: copy.voucherExpire, dataIndex: "expireAt", key: "expireAt" },
    {
      title: copy.voucherStatus,
      dataIndex: "status",
      key: "status",
      render: (value: VoucherRecord["status"]) => (
        <Tag color={value === "available" ? "green" : "default"}>
          {copy.voucherStatusMap[value]}
        </Tag>
      ),
    },
    {
      title: copy.actions,
      key: "actions",
      render: (_, record) =>
        record.status === "available" ? (
          <Button size="small" onClick={() => applyVoucher(record.key)}>
            {copy.useVoucher}
          </Button>
        ) : null,
    },
  ];

  function openProfileEditor() {
    profileForm.setFieldsValue(profile);
    setProfileModalOpen(true);
  }

  const saveProfile = async (values: any) => {
    const REVERSE_AREA_MAP: Record<string, string> = Object.fromEntries(
      Object.entries(AREA_MAP).map(([key, value]) => [value, key])
    );

    try {
      const payload = {
        fullName: values.fullName,
        email: profile.email,
        phone: values.phone,
        gender: values.gender === "male" ? "Nam" : values.gender === "female" ? "Nữ" : "khác",
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
        message.success(copy.profileUpdated || "Cập nhật thông tin thành công!");
      }
    } catch (error: any) {
      console.error("Lỗi cập nhật Profile:", error);
      message.error(error.message || "Cập nhật thất bại. Vui lòng kiểm tra lại thông tin!");
    }
  };

  function markTicketPaid(key: string) {
    setUpcomingTickets((current) =>
      current.map((item) => (item.key === key ? { ...item, status: "paid" } : item))
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

  function applyVoucher(key: string) {
    setVouchers((current) =>
      current.map((item) => (item.key === key ? { ...item, status: "used" } : item))
    );
    message.success(copy.voucherApplied);
  }

  // ==========================================
  // CẤU HÌNH CÁC TABS GIAO DIỆN CHÍNH
  // ==========================================
  const tabItems: TabsProps["items"] = [
    {
      key: "1",
      label: dictionary.pages.user.sections[0].title || "Thông tin tài khoản",
      children: (
        <div className="py-4">
          <Form form={profileForm} layout="vertical" onFinish={saveProfile}>
            
            {/* HÀNG 1: Họ tên & Email */}
            <div className="grid gap-x-8 md:grid-cols-2">
              <Form.Item name="fullName" label={<strong className="text-gray-600">{copy.profileName}</strong>} rules={[{ required: true }]}>
                <Input size="large" prefix={<UserOutlined className="text-gray-400 mr-2" />} className="rounded-lg bg-gray-50/50" />
              </Form.Item>
              <Form.Item name="email" label={<strong className="text-gray-600">{copy.profileEmail}</strong>}>
                {/* Email không cho sửa */}
                <Input size="large" prefix={<MailOutlined className="text-gray-400 mr-2" />} disabled className="rounded-lg" />
              </Form.Item>
            </div>

            {/* HÀNG 2: Ngày sinh & Số điện thoại */}
            <div className="grid gap-x-8 md:grid-cols-2 mt-2">
              <Form.Item label={<strong className="text-gray-600">{copy.profileDob}</strong>} required className="mb-6">
                <div className="grid gap-3 grid-cols-3">
                  <Form.Item name="birthDay" noStyle rules={[{ required: true }]}>
                    <Select size="large" placeholder={copy.day} options={days.map((day) => ({ label: day, value: day }))} />
                  </Form.Item>
                  <Form.Item name="birthMonth" noStyle rules={[{ required: true }]}>
                    <Select size="large" placeholder={copy.month} options={months.map((month) => ({ label: month, value: month }))} />
                  </Form.Item>
                  <Form.Item name="birthYear" noStyle rules={[{ required: true }]}>
                    <Select size="large" placeholder={copy.year} options={years.map((year) => ({ label: year, value: year }))} showSearch />
                  </Form.Item>
                </div>
              </Form.Item>
              <Form.Item name="phone" label={<strong className="text-gray-600">{copy.profilePhone}</strong>} rules={[{ required: true }]}>
                <Input size="large" prefix={<PhoneOutlined className="text-gray-400 mr-2" />} className="rounded-lg bg-gray-50/50" />
              </Form.Item>
            </div>

            {/* HÀNG 3: CCCD & Địa chỉ (Tỉnh/Thành) - ĐÃ TÁCH RIÊNG */}
            <div className="grid gap-x-8 md:grid-cols-2 mt-2">
              <Form.Item name="citizenId" label={<strong className="text-gray-600">{copy.profileCitizenId}</strong>} rules={[{ required: true }]}>
                <Input size="large" prefix={<IdcardOutlined className="text-gray-400 mr-2" />} maxLength={12} className="rounded-lg bg-gray-50/50" />
              </Form.Item>
              <Form.Item name="province" label={<strong className="text-gray-600">{copy.profileProvince}</strong>} rules={[{ required: true }]}>
                <Select size="large" showSearch options={VIETNAM_PROVINCES.map((p) => ({ label: p, value: p }))} />
              </Form.Item>
            </div>

            {/* HÀNG 4: Giới tính & Nút Cập Nhật */}
            <div className="grid gap-x-8 md:grid-cols-2 mt-2 items-end">
              <Form.Item name="gender" label={<strong className="text-gray-600">{copy.profileGender}</strong>} rules={[{ required: true }]} className="mb-0">
                <Select
                  size="large"
                  options={[
                    { label: copy.male, value: "male" },
                    { label: copy.female, value: "female" },
                    { label: copy.other, value: "other" },
                  ]}
                />
              </Form.Item>
              
              <div className="flex justify-end pt-6 md:pt-0">
                {/* Nút màu xanh lơ giống Metiz */}
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large" 
                  style={{ backgroundColor: '#14b8a6', borderColor: '#14b8a6' }} 
                  className="px-10 font-bold rounded-lg shadow-md hover:opacity-80 transition-opacity"
                >
                  Cập nhật
                </Button>
              </div>
            </div>
            
          </Form>
        </div>
      ),
    },
    {
      key: "2",
      label: copy.ticketTitle || "Vé sắp tới của bạn",
      children: (
        <div className="py-2">
          <Typography.Title level={4} style={{ margin: 0, color: "#4a3426" }}>
            {copy.ticketTitle}
          </Typography.Title>
          <Typography.Paragraph style={{ color: "#6d5a46", margin: "8px 0 16px" }}>
            {copy.ticketDesc}
          </Typography.Paragraph>
          <Table
            rowKey="key"
            pagination={false}
            dataSource={upcomingTickets}
            columns={upcomingColumns}
            scroll={{ x: "max-content" }}
          />
        </div>
      ),
    },
    {
      key: "3",
      label: copy.historyTitle || "Lịch sử đặt vé",
      children: (
        <div className="py-2">
          <Typography.Title level={4} style={{ margin: 0, color: "#4a3426" }}>
            {copy.historyTitle}
          </Typography.Title>
          <Typography.Paragraph style={{ color: "#6d5a46", margin: "8px 0 16px" }}>
            {copy.historyDesc}
          </Typography.Paragraph>

          {/* Khối thống kê đơn hàng gom vào Lịch sử */}
          <div className="rounded-[18px] border border-[#ead6bb] bg-[#fffaf4] p-4 text-[#6d5a46] mb-6 max-w-sm">
            <div className="flex items-center justify-between">
              <span>{copy.totalOrders}</span>
              <strong style={{ color: "#4a3426" }}>
                {upcomingTickets.length + bookingHistory.length}
              </strong>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span>{copy.paidTickets}</span>
              <strong style={{ color: "#4a3426" }}>
                {bookingHistory.length + upcomingTickets.filter((item) => item.status === "paid").length}
              </strong>
            </div>
          </div>

          <Table
            rowKey="key"
            pagination={false}
            dataSource={bookingHistory}
            columns={historyColumns}
            scroll={{ x: "max-content" }}
          />
        </div>
      ),
    },
    {
      key: "4",
      label: dictionary.pages.user.sections[2].title || "Voucher & Điểm thưởng",
      children: (
        <div className="py-2">
          <Typography.Title level={4} style={{ margin: 0, color: "#4a3426" }}>
            {dictionary.pages.user.sections[2].title}
          </Typography.Title>
          <Typography.Paragraph style={{ color: "#6d5a46", margin: "8px 0 16px" }}>
            {dictionary.pages.user.sections[2].desc}
          </Typography.Paragraph>
          <Table
            rowKey="key"
            pagination={false}
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
          {/* LAYOUT CHIA 2 CỘT MỚI */}
          <Row gutter={[24, 24]} className="mt-8">
            
            {/* CỘT TRÁI: SIDEBAR (Avatar, Điểm) */}
            <Col xs={24} lg={7} xl={6}>
              <Card bordered={false} className="cinema-paper rounded-[24px] h-full">
                <div className="flex flex-col items-center text-center">
                  <Upload
                    name="avatar"
                    showUploadList={false}
                    customRequest={async (options) => {
                      const { file, onSuccess, onError } = options;
                      try {
                        if (!token || !user?.id) {
                          message.error("Lỗi xác thực. Vui lòng đăng nhập lại!");
                          onError?.(new Error("No user id"));
                          return;
                        }
                        const newAvatarUrl = await uploadAvatarApi(token, user.id, file as File);
                        setProfile((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
                        message.success("Cập nhật ảnh đại diện thành công!");
                        onSuccess?.("ok");
                      } catch (error) {
                        console.error("Lỗi upload ảnh:", error);
                        message.error("Cập nhật ảnh thất bại. Vui lòng thử lại!");
                        onError?.(error as Error);
                      }
                    }}
                  >
                    <div className="relative inline-block cursor-pointer group rounded-full overflow-hidden border-4 border-white shadow-md">
                      <Avatar size={140} src={profile.avatarUrl} />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <CameraOutlined style={{ color: "white", fontSize: 28 }} />
                      </div>
                    </div>
                  </Upload>
                  
                  <Typography.Title level={4} style={{ marginTop: 16, marginBottom: 4, color: "#4a3426" }}>
                    {profile.fullName}
                  </Typography.Title>
                  <Tag color="gold" style={{ fontSize: 14, padding: "4px 12px", borderRadius: 16 }}>
                    {profile.memberTier}
                  </Tag>
                  <Typography.Text style={{ color: "#a61d24", fontWeight: "bold", marginTop: 12, display: 'block' }}>
                    {copy.pointsLabel}: {profile.points}
                  </Typography.Text>
                </div>
              </Card>
            </Col>

            {/* CỘT PHẢI: TABS NỘI DUNG CHÍNH */}
            <Col xs={24} lg={17} xl={18}>
              <Card bordered={false} className="cinema-paper rounded-[24px] min-h-[400px]">
                <Tabs 
                  defaultActiveKey="1" 
                  items={tabItems} 
                  type="card" 
                  size="large"
                />
              </Card>
            </Col>

          </Row>

        </main>
      </SiteShell>
    </div>
  );
}

const adminCopy = {
  vi: {
    actions: "Thao tac",
    edit: "Sua",
    delete: "Xoa",
    save: "Luu",
    cancel: "Huy",
    feature: "Dua noi bat",
    unfeature: "Bo noi bat",
    changeStatus: "Doi trang thai",
    block: "Khoa",
    unblock: "Mo khoa",
    addMovie: "Them phim",
    addShowtime: "Them lich chieu",
    addUser: "Them nguoi dung",
    editMovie: "Chinh sua phim",
    editShowtime: "Chinh sua lich chieu",
    editUser: "Chinh sua nguoi dung",
    movieCreated: "Da them phim moi.",
    movieUpdated: "Da cap nhat phim.",
    movieDeleted: "Da xoa phim.",
    showtimeCreated: "Da them lich chieu.",
    showtimeUpdated: "Da cap nhat lich chieu.",
    showtimeDeleted: "Da xoa lich chieu.",
    userCreated: "Da them nguoi dung.",
    userUpdated: "Da cap nhat nguoi dung.",
    userDeleted: "Da xoa nguoi dung.",
    featuredYes: "Co",
    featuredNo: "Khong",
    moduleMoviesTitle: "Tong phim dang quan ly",
    moduleMoviesDesc:
      "Them moi hoac cap nhat trang thai phim hien thi tren he thong.",
    moduleShowtimesTitle: "Lich chieu dang mo ban",
    moduleShowtimesDesc:
      "Quan ly cac suat chieu dang mo, tam dung hoac da ban het.",
    moduleUsersTitle: "Nguoi dung dang hoat dong",
    moduleUsersDesc:
      "Theo doi so tai khoan con hoat dong va tao them nguoi dung demo.",
    movieColumns: {
      title: "Ten phim",
      genre: "The loai",
      status: "Trang thai",
      featured: "Noi bat",
    },
    showtimeColumns: {
      movie: "Phim",
      cinema: "Rap",
      room: "Phong",
      format: "Format",
      time: "Thoi gian",
      status: "Trang thai",
    },
    userColumns: {
      name: "Ho ten",
      email: "Email",
      role: "Vai tro",
      status: "Trang thai",
      vouchers: "Voucher",
    },
    movieStatus: {
      showing: "Dang chieu",
      coming: "Sap chieu",
      hidden: "An",
    },
    showtimeStatus: {
      open: "Mo ban",
      paused: "Tam dung",
      soldout: "Het ve",
    },
    userRole: {
      admin: "Admin",
      user: "User",
    },
    userStatus: {
      active: "Hoat dong",
      blocked: "Da khoa",
    },
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
    showtimeStatus: {
      open: "On sale",
      paused: "Paused",
      soldout: "Sold out",
    },
    userRole: {
      admin: "Admin",
      user: "User",
    },
    userStatus: {
      active: "Active",
      blocked: "Blocked",
    },
  },
} as const;

const userCopy = {
  vi: {
    actions: "Thao tac",
    save: "Luu",
    cancel: "Huy",
    ticketTitle: "Ve sap toi cua ban",
    ticketDesc:
      "Khu vuc nay cho phep ban xem nhanh cac ve da giu cho va trang thai thanh toan gan nhat.",
    historyTitle: "Lich su dat ve",
    historyDesc:
      "Theo doi cac ve da dung, rap da xem va tong tien tung don hang gan day.",
    ticketMovie: "Phim",
    ticketSeats: "Ghe",
    ticketCinema: "Rap",
    ticketTime: "Suat chieu",
    ticketStatus: "Trang thai",
    ticketTotal: "Tong tien",
    ticketStatusMap: {
      paid: "Da thanh toan",
      reserved: "Da giu cho",
      used: "Da xem",
    },
    payNow: "Thanh toan ngay",
    completeTicket: "Dua vao lich su",
    paymentDone: "Da cap nhat ve sang trang thai da thanh toan.",
    ticketMoved: "Da chuyen ve sang lich su dat ve.",
    editProfile: "Chinh sua ho so",
    profileUpdated: "Da cap nhat thong tin tai khoan.",
    profileName: "Ho ten",
    profileEmail: "Email",
    profilePhone: "So dien thoai",
    profileTier: "Hang thanh vien",
    pointsLabel: "Diem",
    // === CÁC TỪ VỰNG MỚI ĐƯỢC BỔ SUNG CHO FORM ===
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
    // ===========================================
    totalOrders: "Tong don hang",
    paidTickets: "Ve da thanh toan",
    voucherCode: "Ma",
    voucherTitle: "Uu dai",
    voucherDiscount: "Giam",
    voucherExpire: "Het han",
    voucherStatus: "Trang thai",
    voucherStatusMap: {
      available: "Kha dung",
      used: "Da dung",
    },
    useVoucher: "Dung voucher",
    voucherApplied: "Da danh dau voucher la da dung.",
  },
  en: {
    actions: "Actions",
    save: "Save",
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
    ticketStatusMap: {
      paid: "Paid",
      reserved: "Reserved",
      used: "Watched",
    },
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
    // === CÁC TỪ VỰNG MỚI ĐƯỢC BỔ SUNG CHO FORM ===
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
    // ===========================================
    totalOrders: "Total orders",
    paidTickets: "Paid tickets",
    voucherCode: "Code",
    voucherTitle: "Offer",
    voucherDiscount: "Discount",
    voucherExpire: "Expires",
    voucherStatus: "Status",
    voucherStatusMap: {
      available: "Available",
      used: "Used",
    },
    useVoucher: "Use voucher",
    voucherApplied: "Voucher marked as used.",
  },
} as const;

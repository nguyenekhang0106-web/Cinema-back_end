"use client";

import {
  App,
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
} from "antd";
import type { ColumnsType } from "antd/es/table";
import Image from "next/image";
import { useState } from "react";
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

  const [profile, setProfile] = useState(initialProfile);
  const [upcomingTickets, setUpcomingTickets] = useState(
    initialUpcomingTickets,
  );
  const [bookingHistory, setBookingHistory] = useState(initialBookingHistory);
  const [vouchers, setVouchers] = useState(initialVouchers);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm] = Form.useForm<UserProfile>();

  const stats = [
    {
      label: dictionary.pages.user.stats[0].label,
      value: upcomingTickets.length + bookingHistory.length,
    },
    {
      label: dictionary.pages.user.stats[1].label,
      value: vouchers.filter((item) => item.status === "available").length,
    },
    { label: dictionary.pages.user.stats[2].label, value: profile.points },
  ];

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

  function saveProfile(values: UserProfile) {
    setProfile(values);
    setProfileModalOpen(false);
    message.success(copy.profileUpdated);
  }

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

  function applyVoucher(key: string) {
    setVouchers((current) =>
      current.map((item) =>
        item.key === key ? { ...item, status: "used" } : item,
      ),
    );
    message.success(copy.voucherApplied);
  }

  return (
    <div className="cinema-page">
      <SiteShell>
        <main className="cinema-shell px-4 py-8 sm:px-6">
          <DashboardHero
            eyebrow={dictionary.pages.user.eyebrow}
            title={dictionary.pages.user.title}
            description={dictionary.pages.user.description}
            image="https://images.pexels.com/photos/7234256/pexels-photo-7234256.jpeg?auto=compress&cs=tinysrgb&w=1200"
            stats={stats}
          />

          <Row gutter={[24, 24]} className="mt-8">
            <Col xs={24} lg={15}>
              <Space direction="vertical" size={24} className="w-full">
                <Card bordered={false} className="cinema-paper rounded-[24px]">
                  <Space direction="vertical" size={18} className="w-full">
                    <div>
                      <Typography.Title
                        level={3}
                        style={{ margin: 0, color: "#4a3426" }}
                      >
                        {copy.ticketTitle}
                      </Typography.Title>
                      <Typography.Paragraph
                        style={{ color: "#6d5a46", margin: "8px 0 0" }}
                      >
                        {copy.ticketDesc}
                      </Typography.Paragraph>
                    </div>
                    <Table
                      rowKey="key"
                      pagination={false}
                      dataSource={upcomingTickets}
                      columns={upcomingColumns}
                    />
                  </Space>
                </Card>

                <Card bordered={false} className="cinema-paper rounded-[24px]">
                  <Space direction="vertical" size={18} className="w-full">
                    <div>
                      <Typography.Title
                        level={3}
                        style={{ margin: 0, color: "#4a3426" }}
                      >
                        {copy.historyTitle}
                      </Typography.Title>
                      <Typography.Paragraph
                        style={{ color: "#6d5a46", margin: "8px 0 0" }}
                      >
                        {copy.historyDesc}
                      </Typography.Paragraph>
                    </div>
                    <Table
                      rowKey="key"
                      pagination={false}
                      dataSource={bookingHistory}
                      columns={historyColumns}
                    />
                  </Space>
                </Card>
              </Space>
            </Col>

            <Col xs={24} lg={9}>
              <Space direction="vertical" size={24} className="w-full">
                <Card bordered={false} className="cinema-paper rounded-[24px]">
                  <Space direction="vertical" size={14} className="w-full">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Typography.Title
                        level={4}
                        style={{ margin: 0, color: "#4a3426" }}
                      >
                        {dictionary.pages.user.sections[0].title}
                      </Typography.Title>
                      <Button size="small" onClick={openProfileEditor}>
                        {copy.editProfile}
                      </Button>
                    </div>
                    <Typography.Paragraph
                      style={{ marginBottom: 0, color: "#6d5a46" }}
                    >
                      {dictionary.pages.user.sections[0].desc}
                    </Typography.Paragraph>
                    <div className="space-y-2 rounded-[18px] border border-[#ead6bb] bg-[#fffaf4] p-4">
                      <Typography.Text strong style={{ fontSize: 16 }}>
                        {profile.fullName}
                      </Typography.Text>
                      <Typography.Text
                        style={{ display: "block", color: "#6d5a46" }}
                      >
                        {profile.email} • {profile.phone}
                      </Typography.Text>
                      <Typography.Text
                        style={{ display: "block", color: "#6d5a46" }}
                      >
                        {copy.profileDob}: {profile.birthDay}/
                        {profile.birthMonth}/{profile.birthYear}
                      </Typography.Text>
                      <Typography.Text
                        style={{ display: "block", color: "#6d5a46" }}
                      >
                        {copy.profileCitizenId}: {profile.citizenId} •{" "}
                        {profile.province}
                      </Typography.Text>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {/* Hạng thành viên và Điểm hiển thị ở đây dưới dạng Tag (Không cho sửa) */}
                        <Tag color="gold">{profile.memberTier}</Tag>
                        <Tag color="red">
                          {copy.pointsLabel}: {profile.points}
                        </Tag>
                      </div>
                    </div>
                  </Space>
                </Card>

                <Card bordered={false} className="cinema-paper rounded-[24px]">
                  <Space direction="vertical" size={14} className="w-full">
                    <Typography.Title
                      level={4}
                      style={{ margin: 0, color: "#4a3426" }}
                    >
                      {dictionary.pages.user.sections[1].title}
                    </Typography.Title>
                    <Typography.Paragraph
                      style={{ marginBottom: 0, color: "#6d5a46" }}
                    >
                      {dictionary.pages.user.sections[1].desc}
                    </Typography.Paragraph>
                    <div className="rounded-[18px] border border-[#ead6bb] bg-[#fffaf4] p-4 text-[#6d5a46]">
                      <div className="flex items-center justify-between">
                        <span>{copy.totalOrders}</span>
                        <strong style={{ color: "#4a3426" }}>
                          {upcomingTickets.length + bookingHistory.length}
                        </strong>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span>{copy.paidTickets}</span>
                        <strong style={{ color: "#4a3426" }}>
                          {bookingHistory.length +
                            upcomingTickets.filter(
                              (item) => item.status === "paid",
                            ).length}
                        </strong>
                      </div>
                    </div>
                  </Space>
                </Card>

                <Card bordered={false} className="cinema-paper rounded-[24px]">
                  <Space direction="vertical" size={14} className="w-full">
                    <Typography.Title
                      level={4}
                      style={{ margin: 0, color: "#4a3426" }}
                    >
                      {dictionary.pages.user.sections[2].title}
                    </Typography.Title>
                    <Typography.Paragraph
                      style={{ marginBottom: 0, color: "#6d5a46" }}
                    >
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
                  </Space>
                </Card>
              </Space>
            </Col>
          </Row>

          <Modal
            open={profileModalOpen}
            title={copy.editProfile}
            onCancel={() => setProfileModalOpen(false)}
            onOk={() => profileForm.submit()}
            okText={copy.save}
            cancelText={copy.cancel}
          >
            <Form form={profileForm} layout="vertical" onFinish={saveProfile}>
              <div className="grid gap-4 md:grid-cols-2">
                <Form.Item
                  name="fullName"
                  label={copy.profileName}
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  name="gender"
                  label={copy.profileGender}
                  rules={[{ required: true }]}
                >
                  <Select
                    options={[
                      { label: copy.male, value: "male" },
                      { label: copy.female, value: "female" },
                      { label: copy.other, value: "other" },
                    ]}
                  />
                </Form.Item>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Form.Item
                  name="email"
                  label={copy.profileEmail}
                  rules={[{ required: true }]}
                >
                  {/* Disable email vì đây là tài khoản đăng nhập chính */}
                  <Input disabled />
                </Form.Item>
                <Form.Item
                  name="phone"
                  label={copy.profilePhone}
                  rules={[{ required: true }]}
                >
                  <Input />
                </Form.Item>
              </div>

              <Form.Item
                label={copy.profileDob}
                required
                style={{ marginBottom: 16 }}
              >
                <div className="grid gap-4 grid-cols-3">
                  <Form.Item
                    name="birthDay"
                    noStyle
                    rules={[{ required: true }]}
                  >
                    <Select
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

              <div className="grid gap-4 md:grid-cols-2">
                <Form.Item
                  name="province"
                  label={copy.profileProvince}
                  rules={[{ required: true }]}
                >
                  <Select
                    showSearch
                    options={VIETNAM_PROVINCES.map((p) => ({
                      label: p,
                      value: p,
                    }))}
                  />
                </Form.Item>
                <Form.Item
                  name="citizenId"
                  label={copy.profileCitizenId}
                  rules={[{ required: true }]}
                >
                  <Input maxLength={12} />
                </Form.Item>
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

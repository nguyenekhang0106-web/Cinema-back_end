"use client";

import {
  EnvironmentOutlined,
  PhoneOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  VideoCameraOutlined,
  LayoutOutlined,
  WarningOutlined,
  ReloadOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  List,
  Space,
  Tag,
  Typography,
  Spin,
  message,
  Popconfirm,
  Modal,
  Form,
  Input,
  Select,
  Table,
  InputNumber,
  Divider,
  DatePicker,
  Carousel,
  Switch,
  Image as AntImage,
} from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { SiteShell } from "../components/site-shell";
import { getCinemas, CinemaItem } from "../lib/cinema-api";
import Link from "next/link";
import { localizeHref } from "../lib/i18n";
import { useLocale } from "../components/locale-provider";

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

export default function CinemaPricingPage() {
  const locale = useLocale();
  const [isAdmin, setIsAdmin] = useState(false);

  // --- STATE: RẠP & PHÒNG CHIẾU ---
  const [cinemas, setCinemas] = useState<CinemaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCinemaModalOpen, setIsCinemaModalOpen] = useState(false);
  const [editingCinema, setEditingCinema] = useState<CinemaItem | null>(null);
  const [cinemaForm] = Form.useForm();

  const [isHallsModalOpen, setIsHallsModalOpen] = useState(false);
  const [selectedCinemaForHalls, setSelectedCinemaForHalls] =
    useState<CinemaItem | null>(null);
  const [halls, setHalls] = useState<any[]>([]);
  const [isHallsLoading, setIsHallsLoading] = useState(false);
  const [isHallFormOpen, setIsHallFormOpen] = useState(false);
  const [editingHall, setEditingHall] = useState<any | null>(null);
  const [hallForm] = Form.useForm();

  // --- STATE: GHẾ ---
  const [modalView, setModalView] = useState<"halls" | "seats">("halls");
  const [selectedHallForSeats, setSelectedHallForSeats] = useState<any | null>(
    null,
  );
  const [seats, setSeats] = useState<any[]>([]);
  const [isSeatsLoading, setIsSeatsLoading] = useState(false);
  const [seatBatchForm] = Form.useForm();
  const [isSeatEditModalOpen, setIsSeatEditModalOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<any | null>(null);
  const [seatForm] = Form.useForm();

  // --- STATE: LỊCH CHIẾU VÀ MOVIES ---
  const [expandedCinemaId, setExpandedCinemaId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    generateDates()[0].iso,
  );
  const [cinemaShowtimes, setCinemaShowtimes] = useState<any[]>([]);
  const [cinemaHallsForShowtimes, setCinemaHallsForShowtimes] = useState<any[]>(
    [],
  );
  const [isFetchingShowtimes, setIsFetchingShowtimes] = useState(false);

  const [moviesList, setMoviesList] = useState<any[]>([]);
  const [isFetchingMovies, setIsFetchingMovies] = useState(false);

  const [isShowtimeModalOpen, setIsShowtimeModalOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState<any | null>(null);
  const [showtimeForm] = Form.useForm();

  // 🔥 STATE: QUẢN LÝ BANNERS CỦA TỪNG RẠP (THEATER IMAGES) 🔥
  const [theaterBanners, setTheaterBanners] = useState<any[]>([]);
  const [isTheaterBannerManagerOpen, setIsTheaterBannerManagerOpen] =
    useState(false);
  const [isTheaterBannerFormOpen, setIsTheaterBannerFormOpen] = useState(false);
  const [editingTheaterBanner, setEditingTheaterBanner] = useState<any | null>(
    null,
  );
  const [theaterBannerForm] = Form.useForm();

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
    return token;
  };

  const checkAdminStatus = () => {
    const token = getAuthToken();
    if (token) {
      try {
        const payloadBase64 = token.split(".")[1];
        if (atob(payloadBase64).includes("ADMIN")) setIsAdmin(true);
      } catch (e) {}
    }
  };

  const fetchCinemasList = async () => {
    setLoading(true);
    try {
      const data = await getCinemas();
      if (Array.isArray(data)) setCinemas(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchMoviesList = async () => {
    setIsFetchingMovies(true);
    try {
      const res = await fetch(`http://localhost:9090/cinema/movies`);
      if (res.ok) {
        const data = await res.json();
        setMoviesList(data.result || []);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách phim", error);
    } finally {
      setIsFetchingMovies(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
    fetchCinemasList();
    fetchMoviesList();
  }, [locale]);

  // 🔥 TÍCH HỢP TẢI BANNERS RẠP VÀO CHUNG HÀM EXPAND
  const loadCinemaDetails = async (cinemaId: string) => {
    setIsFetchingShowtimes(true);
    try {
      // 1. Load Halls
      const hallsRes = await fetch(
        `http://localhost:9090/cinema/halls/cinema/${cinemaId}`,
      );
      const hallsData = await hallsRes.json();
      const fetchedHalls = hallsData.result || [];
      setCinemaHallsForShowtimes(fetchedHalls);
      const hallIds = fetchedHalls.map((h: any) => h.id);

      // 2. Load Showtimes
      const stRes = await fetch(`http://localhost:9090/cinema/showtimes`);
      if (stRes.ok) {
        const stData = await stRes.json();
        const allShowtimes = stData.result || [];
        const filtered = allShowtimes.filter(
          (st: any) => hallIds.includes(st.hallId) && st.status === "SCHEDULED",
        );
        setCinemaShowtimes(filtered);
      }

      // 3. Load Theater Banners
      await fetchTheaterBanners(cinemaId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingShowtimes(false);
    }
  };

  // 🔥 HÀM TẢI ẢNH RẠP TỪ BACKEND
  const fetchTheaterBanners = async (cinemaId: string) => {
    try {
      const token = getAuthToken();
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // SỬA Ở ĐÂY: Admin sẽ lấy link /all để thấy cả banner bị tắt
      const url = isAdmin
        ? `http://localhost:9090/cinema/banners/cinema/${cinemaId}/all`
        : `http://localhost:9090/cinema/banners/cinema/${cinemaId}`;

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setTheaterBanners(data.result || []);
      } else {
        setTheaterBanners([]);
      }
    } catch (error) {
      console.error("Lỗi lấy ảnh rạp", error);
      setTheaterBanners([]);
    }
  };

  const handleViewShowtimes = async (cinema: CinemaItem) => {
    if (expandedCinemaId === cinema.id) {
      setExpandedCinemaId(null);
      return;
    }
    setExpandedCinemaId(cinema.id);
    loadCinemaDetails(cinema.id);
  };

  // ===================== CRUD ẢNH RẠP CHIẾU (THEATER BANNERS) =====================
  const handleOpenTheaterBannerManager = () => {
    setIsTheaterBannerManagerOpen(true);
  };

  const handleAddTheaterBanner = () => {
    setEditingTheaterBanner(null);
    theaterBannerForm.resetFields();
    theaterBannerForm.setFieldsValue({ active: true, displayOrder: 0 });
    setIsTheaterBannerFormOpen(true);
  };

  const handleEditTheaterBanner = (record: any) => {
    setEditingTheaterBanner(record);
    theaterBannerForm.setFieldsValue(record);
    setIsTheaterBannerFormOpen(true);
  };

  const handleDeleteTheaterBanner = async (id: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch(`http://localhost:9090/cinema/banners/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        message.success("Đã xóa ảnh rạp!");
        fetchTheaterBanners(expandedCinemaId!);
      } else {
        message.error("Xóa thất bại");
      }
    } catch (error) {
      message.error("Lỗi mạng khi xóa!");
    }
  };

  const handleSaveTheaterBanner = async (values: any) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const isUpdate = !!editingTheaterBanner;
      const url = isUpdate
        ? `http://localhost:9090/cinema/banners/${editingTheaterBanner.id}`
        : "http://localhost:9090/cinema/banners";

      // Đẩy cinemaId vào payload để Backend map vào đúng rạp
      const payload = {
        ...values,
        cinemaId: expandedCinemaId,
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
          isUpdate ? "Cập nhật thành công!" : "Thêm mới ảnh rạp thành công!",
        );
        setIsTheaterBannerFormOpen(false);
        fetchTheaterBanners(expandedCinemaId!);
      } else {
        const errorData = await res.json();
        message.error(errorData.message || "Lỗi khi lưu ảnh");
      }
    } catch (error) {
      message.error("Lỗi mạng!");
    }
  };

  const theaterBannerColumns = [
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
    { title: "Tiêu đề ảnh", dataIndex: "title", key: "title" },
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
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditTheaterBanner(record)}
          />
          <Popconfirm
            title="Xóa ảnh này?"
            onConfirm={() => handleDeleteTheaterBanner(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ===================== CRUD LỊCH CHIẾU =====================
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
        const err = await res.json();
        message.error(err.message);
      }
    } catch (error) {
      message.error("Lỗi mạng khi xóa");
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
          isUpdate
            ? "Cập nhật suất chiếu thành công!"
            : "Tạo suất chiếu thành công!",
        );
        setIsShowtimeModalOpen(false);
        loadCinemaDetails(expandedCinemaId!);
      } else {
        const err = await res.json();
        message.error(err.message || "Lỗi lưu suất chiếu");
      }
    } catch (error) {
      message.error("Lỗi kết nối máy chủ");
    }
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
      title: "Phim không tồn tại hoặc đã bị xóa",
      poster: "https://www.cgv.vn/default-poster.jpg",
      genre: "N/A",
      duration: "N/A",
    };
  };

  const getGroupedShowtimes = () => {
    const now = dayjs();
    const thresholdTime = now.subtract(20, 'minute'); // Mốc thời gian: Hiện tại trừ 20 phút

    const dateShowtimes = cinemaShowtimes.filter(st => {
        // 1. Phải thuộc ngày đang chọn trên Tabs
        if (!st.startTime.startsWith(selectedDate)) return false;

        // 2. Kiểm tra quá giờ chiếu 20 phút
        const showtimeTime = dayjs(st.startTime);
        if (showtimeTime.isBefore(thresholdTime)) {
            // Nếu là Admin -> Cho phép hiển thị (để còn xóa/sửa)
            // Nếu là Khách -> Ẩn hoàn toàn
            if (!isAdmin) return false;
        }
        
        return true;
    });

    const groups: Record<string, any[]> = {};
    
    dateShowtimes.forEach(st => {
        if (!groups[st.movieId]) groups[st.movieId] = [];
        groups[st.movieId].push(st);
    });

    return Object.keys(groups).map(movieId => ({
        movieId,
        showtimes: groups[movieId].sort((a, b) => a.startTime.localeCompare(b.startTime))
    }));
  };

  // --- HANDLERS: RẠP, PHÒNG, GHẾ ---
  const handleAddCinema = () => {
    setEditingCinema(null);
    cinemaForm.resetFields();
    setIsCinemaModalOpen(true);
  };
  const handleEditCinema = (cinema: CinemaItem) => {
    setEditingCinema(cinema);
    cinemaForm.setFieldsValue(cinema);
    setIsCinemaModalOpen(true);
  };
  const handleDeleteCinema = async (id: string) => {
    const token = getAuthToken();
    try {
      await fetch(`http://localhost:9090/cinema/cinemas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCinemasList();
    } catch (error) {}
  };
  const handleSaveCinema = async (values: any) => {
    const token = getAuthToken();
    const isUpdate = !!editingCinema;
    const url = isUpdate
      ? `http://localhost:9090/cinema/cinemas/${editingCinema.id}`
      : `http://localhost:9090/cinema/cinemas`;
    try {
      await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      setIsCinemaModalOpen(false);
      fetchCinemasList();
    } catch (error) {}
  };

  const fetchHallsByCinema = async (cinemaId: string) => {
    setIsHallsLoading(true);
    try {
      const res = await fetch(
        `http://localhost:9090/cinema/halls/cinema/${cinemaId}`,
      );
      const data = await res.json();
      setHalls(data.result || []);
    } catch (error) {
    } finally {
      setIsHallsLoading(false);
    }
  };
  const handleOpenHallsModal = (cinema: CinemaItem) => {
    setSelectedCinemaForHalls(cinema);
    setModalView("halls");
    setIsHallsModalOpen(true);
    fetchHallsByCinema(cinema.id);
  };
  const handleAddHall = () => {
    setEditingHall(null);
    hallForm.resetFields();
    setIsHallFormOpen(true);
  };
  const handleEditHall = (hall: any) => {
    setEditingHall(hall);
    hallForm.setFieldsValue(hall);
    setIsHallFormOpen(true);
  };
  const handleDeleteHall = async (hallId: string) => {
    const token = getAuthToken();
    try {
      await fetch(`http://localhost:9090/cinema/halls/${hallId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchHallsByCinema(selectedCinemaForHalls!.id);
    } catch (error) {}
  };
  const handleSaveHall = async (values: any) => {
    const token = getAuthToken();
    const isUpdate = !!editingHall;
    const url = isUpdate
      ? `http://localhost:9090/cinema/halls/${editingHall.id}`
      : `http://localhost:9090/cinema/halls`;
    try {
      await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...values,
          cinemaId: selectedCinemaForHalls!.id,
        }),
      });
      setIsHallFormOpen(false);
      fetchHallsByCinema(selectedCinemaForHalls!.id);
    } catch (error) {}
  };

  const fetchSeatsForHall = async (hallId: string) => {
    setIsSeatsLoading(true);
    try {
      const res = await fetch(
        `http://localhost:9090/cinema/seats/hall/${hallId}`,
      );
      const data = await res.json();
      setSeats(data.result || []);
    } catch (error) {
    } finally {
      setIsSeatsLoading(false);
    }
  };
  const handleManageSeats = (hall: any) => {
    setSelectedHallForSeats(hall);
    setModalView("seats");
    fetchSeatsForHall(hall.id);
  };
  const handleGenerateSeats = async (values: any) => {
    const token = getAuthToken();
    try {
      await fetch(`http://localhost:9090/cinema/seats/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hallId: selectedHallForSeats!.id, ...values }),
      });
      fetchSeatsForHall(selectedHallForSeats!.id);
      fetchHallsByCinema(selectedCinemaForHalls!.id);
    } catch (error) {}
  };
  const handleSeatClick = (seat: any) => {
    if (!isAdmin) return;
    setSelectedSeat(seat);
    seatForm.setFieldsValue({
      type: seat.type,
      status: seat.status || "AVAILABLE",
    });
    setIsSeatEditModalOpen(true);
  };
  const handleSaveSeat = async (values: any) => {
    const token = getAuthToken();
    try {
      await fetch(`http://localhost:9090/cinema/seats/${selectedSeat.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          hallId: selectedHallForSeats.id,
          rowName: selectedSeat.rowName,
          number: selectedSeat.number,
          ...values,
        }),
      });
      setIsSeatEditModalOpen(false);
      fetchSeatsForHall(selectedHallForSeats.id);
      fetchHallsByCinema(selectedCinemaForHalls!.id);
    } catch (error) {}
  };
  const handleDeleteSeat = async () => {
    const token = getAuthToken();
    try {
      await fetch(`http://localhost:9090/cinema/seats/${selectedSeat.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsSeatEditModalOpen(false);
      fetchSeatsForHall(selectedHallForSeats.id);
      fetchHallsByCinema(selectedCinemaForHalls!.id);
    } catch (error) {}
  };
  const handleDeleteAllSeats = async () => {
    const token = getAuthToken();
    try {
      await fetch(
        `http://localhost:9090/cinema/seats/hall/${selectedHallForSeats.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      fetchSeatsForHall(selectedHallForSeats.id);
      fetchHallsByCinema(selectedCinemaForHalls!.id);
    } catch (error) {}
  };

  const hallColumns = [
    {
      title: locale === "vi" ? "Tên phòng" : "Hall Name",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: locale === "vi" ? "Tổng số ghế" : "Total Seats",
      dataIndex: "totalSeats",
      key: "totalSeats",
      render: (seats: number) => (
        <Tag color="blue">
          {seats || 0} {locale === "vi" ? "ghế" : "seats"}
        </Tag>
      ),
    },
    {
      title: locale === "vi" ? "Hành động" : "Actions",
      key: "action",
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            size="small"
            icon={<LayoutOutlined />}
            onClick={() => handleManageSeats(record)}
            title="Quản lý sơ đồ ghế"
          />
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditHall(record)}
          />
          <Popconfirm
            title="Xóa phòng chiếu này?"
            onConfirm={() => handleDeleteHall(record.id)}
            okText="Có"
            cancelText="Không"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const regularSeats = seats.filter((s: any) => s.type !== "SWEETBOX");
  const coupleSeats = seats.filter((s: any) => s.type === "SWEETBOX");
  const groupedSeats = regularSeats.reduce((acc: any, seat: any) => {
    if (!acc[seat.rowName]) acc[seat.rowName] = [];
    acc[seat.rowName].push(seat);
    return acc;
  }, {});
  const rowNames = Object.keys(groupedSeats).sort();

  return (
    <div className="cinema-page">
      <SiteShell>
        <main className="cinema-shell px-4 py-8 sm:px-6 max-w-7xl mx-auto">
          {/* HEADER RẠP */}
          <div className="flex justify-between items-end mb-10 mt-4">
            <div style={{ borderLeft: "5px solid #a61d24", paddingLeft: "18px" }}>
              <Typography.Title level={1} style={{ margin: 0, color: "#4a3426", textTransform: "uppercase", fontSize: "2.5rem", fontWeight: 800 }}>
                {/* 🔥 LOGIC PHÂN QUYỀN TIÊU ĐỀ 🔥 */}
                {isAdmin 
                  ? (locale === "vi" ? "RẠP & PHÒNG CHIẾU" : "CINEMAS & HALLS") 
                  : (locale === "vi" ? "RẠP & LỊCH CHIẾU" : "CINEMAS & SHOWTIMES")}
              </Typography.Title>
              <div style={{ height: "4px", width: "150px", background: "linear-gradient(90deg, #a61d24 0%, rgba(166, 29, 36, 0) 100%)", marginTop: "4px" }}></div>
            </div>
            
            {isAdmin && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCinema} className="bg-[#a61d24] border-none font-semibold">
                Thêm Rạp Mới
              </Button>
            )}
          </div>

          {/* DANH SÁCH RẠP */}
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
                    bordered={false}
                    className="cinema-paper rounded-[24px]"
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
                            ? locale === "vi"
                              ? "Đóng Lịch Chiếu"
                              : "Close Showtimes"
                            : locale === "vi"
                              ? "Xem Lịch Chiếu"
                              : "View Showtimes"}
                        </Button>
                      </Space>

                      {isAdmin && (
                        <Space direction="vertical" style={{ width: "120px" }}>
                          <Button
                            icon={<VideoCameraOutlined />}
                            onClick={() => handleOpenHallsModal(cinema)}
                            className="border-[#a61d24] text-[#a61d24] w-full font-semibold"
                          >
                            Phòng chiếu
                          </Button>
                          <Button
                            icon={<EditOutlined />}
                            onClick={() => handleEditCinema(cinema)}
                            type="dashed"
                            className="w-full"
                          >
                            Sửa Rạp
                          </Button>
                          <Popconfirm
                            title="Xóa rạp?"
                            onConfirm={() => handleDeleteCinema(cinema.id)}
                          >
                            <Button
                              danger
                              icon={<DeleteOutlined />}
                              className="w-full"
                            >
                              Xóa Rạp
                            </Button>
                          </Popconfirm>
                        </Space>
                      )}
                    </div>

                    {/* KHU VỰC LỊCH CHIẾU VÀ THEATER */}
                    {expandedCinemaId === cinema.id && (
                      <div className="mt-8 pt-8 border-t-2 border-dashed border-gray-200 animate-fade-in transition-all">
                        <div className="text-center mb-12">
                          <div className="flex flex-col items-center justify-center mb-4">
                            <div className="flex items-center justify-center gap-4 w-full">
                              <div className="h-[2px] bg-[#4a3426] w-12 md:w-32"></div>
                              <h2 className="text-3xl font-serif tracking-[0.3em] uppercase font-bold text-[#4a3426]">
                                Theater
                              </h2>
                              <div className="h-[2px] bg-[#4a3426] w-12 md:w-32"></div>
                            </div>

                            {/* 🔥 NÚT QUẢN LÝ ẢNH RẠP CHO ADMIN 🔥 */}
                            {isAdmin && (
                              <Button
                                type="dashed"
                                icon={<PictureOutlined />}
                                onClick={handleOpenTheaterBannerManager}
                                className="mt-4 border-[#a61d24] text-[#a61d24] hover:bg-red-50"
                              >
                                Quản lý ảnh Rạp
                              </Button>
                            )}
                          </div>

                          <h3 className="text-2xl text-gray-500 mb-6">
                            {cinema.name}
                          </h3>

                          <div className="max-w-4xl mx-auto rounded-lg overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.15)] bg-white relative">
                            {/* 🔥 CAROUSEL HIỂN THỊ THEATER BANNERS 🔥 */}
                            {theaterBanners.filter((b) => b.active || isAdmin)
                              .length > 0 ? (
                              <Carousel
                                autoplay
                                autoplaySpeed={4000}
                                effect="fade"
                                dotPosition="bottom"
                                className="theater-carousel"
                              >
                                {theaterBanners
                                  .filter((b) => b.active || isAdmin) // Admin thấy tất cả, Khách chỉ thấy active
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
                                      {/* CHỈ HIỂN THỊ THẺ "ĐANG ẨN" CHO ADMIN Ở GÓC TRÊN CÙNG (ĐÃ XÓA TIÊU ĐỀ) */}
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
                              <div className="w-full h-[300px] md:h-[450px] bg-gray-100 flex flex-col items-center justify-center text-gray-400">
                                <PictureOutlined className="text-5xl mb-3 opacity-30" />
                                <p>Rạp chưa có ảnh nội thất nào</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                          <div className="text-center mb-8 relative flex flex-col items-center">
                            <div className="absolute inset-0 flex items-center justify-center z-0 opacity-20 pointer-events-none">
                              <div className="w-full h-16 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] bg-repeat"></div>
                            </div>
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
                                              const hall = cinemaHallsForShowtimes.find((h: any) => h.id === st.hallId);
                                              const hallName = hall ? hall.name : 'Phòng chiếu';
                                              
                                              const now = dayjs();
                                              const startTime = dayjs(st.startTime);
                                              const endTime = dayjs(st.endTime); 
                                              const timeStr = startTime.format('HH:mm'); 
                                              
                                              // 1. Phân tích trạng thái dựa trên dữ liệu DB và Thời gian thực
                                              let displayTag = null;
                                              let buttonStyle = "bg-gray-50 border-gray-300 hover:border-[#1eb3a6] hover:bg-white cursor-pointer";
                                              let textStyle = "text-gray-800 group-hover:text-[#1eb3a6]";
                                              let isLockedForUser = false;

                                              if (st.status === 'CANCELLED') {
                                                  displayTag = <span className="text-[9px] text-red-600 bg-red-100 px-2 py-0.5 rounded mt-1 font-bold">ĐÃ HỦY</span>;
                                                  buttonStyle = "bg-red-50 border-red-200 opacity-70 cursor-not-allowed";
                                                  textStyle = "text-red-400 line-through";
                                                  isLockedForUser = true;
                                              } 
                                              else if (st.status === 'COMPLETED' || now.isAfter(endTime)) {
                                                  displayTag = <span className="text-[9px] text-gray-500 bg-gray-200 px-2 py-0.5 rounded mt-1 font-bold">ĐÃ CHIẾU</span>;
                                                  buttonStyle = "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed";
                                                  textStyle = "text-gray-400";
                                                  isLockedForUser = true;
                                              }
                                              else if (st.status === 'SCHEDULED') {
                                                  if (now.isAfter(startTime) && now.isBefore(endTime)) {
                                                      displayTag = <span className="text-[9px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded mt-1 font-bold animate-pulse">ĐANG CHIẾU</span>;
                                                      buttonStyle = "bg-blue-50 border-blue-200 cursor-not-allowed";
                                                      textStyle = "text-blue-500";
                                                      isLockedForUser = true; 
                                                  } 
                                                  else if (now.isAfter(startTime.add(20, 'minute'))) {
                                                      displayTag = <span className="text-[9px] text-orange-600 bg-orange-100 px-2 py-0.5 rounded mt-1 font-bold">ĐÓNG BÁN VÉ</span>;
                                                      buttonStyle = "bg-gray-50 border-gray-200 opacity-80 cursor-not-allowed";
                                                      textStyle = "text-gray-500";
                                                      isLockedForUser = true;
                                                  }
                                              }

                                              if (!isAdmin && isLockedForUser) {
                                                  return null; 
                                              }
                                              
                                              // Tách nội dung bên trong ra một biến để tái sử dụng
                                              const innerContent = (
                                                <>
                                                  <span className={`font-bold text-lg ${textStyle}`}>
                                                    {timeStr}
                                                  </span>
                                                  <span className={`text-xs mt-1 ${isLockedForUser ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {hallName}
                                                  </span>
                                                  {st.format && (
                                                    <span className={`text-[10px] font-bold mt-1 px-2 rounded-full ${isLockedForUser ? 'bg-gray-200 text-gray-400' : 'bg-yellow-100 text-yellow-800'}`}>
                                                      {formatDisplayMap[st.format] || st.format}
                                                    </span>
                                                  )}
                                                  {isAdmin && displayTag}
                                                </>
                                              );

                                              return (
                                                <div key={st.id} className="relative group inline-block">
                                                  
                                                  {/* 🔥 Dùng điều kiện rõ ràng để TypeScript hiểu */}
                                                  {isLockedForUser && !isAdmin ? (
                                                    <div className={`w-full border rounded-lg px-5 py-2 flex flex-col items-center transition-all ${buttonStyle}`}>
                                                      {innerContent}
                                                    </div>
                                                  ) : (
                                                    <Link 
                                                      href={localizeHref(`/dat-ve/${st.id}`, locale)} 
                                                      className={`w-full border rounded-lg px-5 py-2 flex flex-col items-center transition-all ${buttonStyle}`}
                                                    >
                                                      {innerContent}
                                                    </Link>
                                                  )}
                                                  
                                                  {isAdmin && (
                                                    <div className="absolute -top-3 -right-3 hidden group-hover:flex gap-1 z-10 bg-white p-1 rounded-full shadow-md border border-gray-200">
                                                      <Button size="small" shape="circle" icon={<EditOutlined className="text-blue-500"/>} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditShowtime(st); }} className="border-none shadow-none" />
                                                      <Popconfirm title="Xóa (Hủy) suất chiếu này?" onConfirm={(e) => { e?.stopPropagation(); handleDeleteShowtime(st.id); }} onCancel={(e) => e?.stopPropagation()}>
                                                        <Button size="small" shape="circle" danger icon={<DeleteOutlined />} onClick={(e) => e.preventDefault()} className="border-none shadow-none" />
                                                      </Popconfirm>
                                                    </div>
                                                  )}
                                                </div>
                                              )
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

          {/* ===================== MODAL QUẢN LÝ ẢNH RẠP CHIẾU (ADMIN) ===================== */}
          <Modal
            title={
              <Typography.Title level={4}>
                Quản lý Hình Ảnh Rạp -{" "}
                {cinemas.find((c) => c.id === expandedCinemaId)?.name}
              </Typography.Title>
            }
            open={isTheaterBannerManagerOpen}
            onCancel={() => setIsTheaterBannerManagerOpen(false)}
            width={900}
            footer={null}
            destroyOnClose
          >
            <div className="mb-4 flex justify-end">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddTheaterBanner}
                className="bg-[#a61d24]"
              >
                Thêm Ảnh Rạp Mới
              </Button>
            </div>
            <Table
              dataSource={theaterBanners}
              columns={theaterBannerColumns}
              rowKey="id"
              pagination={false}
            />
          </Modal>

          <Modal
            title={
              editingTheaterBanner ? "Cập nhật Ảnh Rạp" : "Thêm Ảnh Rạp Mới"
            }
            open={isTheaterBannerFormOpen}
            onCancel={() => setIsTheaterBannerFormOpen(false)}
            onOk={() => theaterBannerForm.submit()}
            okText="Lưu lại"
            cancelText="Hủy"
            okButtonProps={{ className: "bg-[#a61d24] border-none" }}
            zIndex={1060}
          >
            <Form
              form={theaterBannerForm}
              layout="vertical"
              onFinish={handleSaveTheaterBanner}
            >
              <Form.Item name="title" label="Tiêu đề (Mô tả ảnh)">
                <Input placeholder="VD: Góc nhìn từ sảnh vào" />
              </Form.Item>
              <Form.Item
                name="imageUrl"
                label="URL Hình ảnh"
                rules={[{ required: true, message: "URL không được để trống" }]}
              >
                <Input placeholder="https://..." />
              </Form.Item>
              <Form.Item
                name="displayOrder"
                label="Thứ tự ưu tiên (Nhỏ xếp trước)"
                rules={[{ required: true }]}
              >
                <InputNumber min={0 as number} className="w-full" />
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

          {/* ===================== MODAL THÊM/SỬA LỊCH CHIẾU CÓ RÀNG BUỘC ===================== */}
          <Modal
            title={
              <div className="border-l-[4px] border-[#a61d24] pl-3">
                <Typography.Title
                  level={4}
                  style={{ margin: 0, color: "#4a3426" }}
                >
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
                    <Select
                      placeholder="-- Chọn một bộ phim --"
                      loading={isFetchingMovies}
                      notFoundContent="Chưa có dữ liệu phim"
                      className="flex-1"
                    >
                      {moviesList.map((m) => (
                        <Select.Option key={m.id} value={m.id}>
                          {m.title || m.name || "Phim chưa có tên"}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchMoviesList}
                    loading={isFetchingMovies}
                    title="Tải lại danh sách phim"
                  />
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
                rules={[
                  { required: true, message: "Vui lòng chọn thời gian!" },
                  () => ({
                    validator(_, value) {
                      if (!value || value.isAfter(dayjs())) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error(
                          "Thời gian chiếu phải lớn hơn thời điểm hiện tại!",
                        ),
                      );
                    },
                  }),
                ]}
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
                    {
                      type: "number",
                      min: 1000,
                      message: "Giá vé tối thiểu 1.000 VNĐ!",
                    },
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

          {/* === CÁC MODAL ADMIN KHÁC (Rạp, Phòng, Ghế) GIỮ NGUYÊN === */}
          <Modal
            title={editingCinema ? "CẬP NHẬT RẠP" : "THÊM RẠP MỚI"}
            open={isCinemaModalOpen}
            onCancel={() => setIsCinemaModalOpen(false)}
            onOk={() => cinemaForm.submit()}
            okButtonProps={{ className: "bg-[#a61d24] border-none" }}
          >
            <Form
              form={cinemaForm}
              layout="vertical"
              onFinish={handleSaveCinema}
            >
              <Form.Item
                name="name"
                label="Tên Rạp"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="address"
                label="Địa Chỉ"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="hotline"
                label="Hotline"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="city"
                label="Khu Vực"
                rules={[{ required: true }]}
              >
                <Select
                  options={Object.keys(cityMapVi).map((key) => ({
                    value: key,
                    label: cityMapVi[key],
                  }))}
                />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title={
              <div className="border-l-[4px] border-[#a61d24] pl-3">
                <Typography.Title
                  level={4}
                  style={{ margin: 0, color: "#4a3426" }}
                >
                  Quản lý - {selectedCinemaForHalls?.name}
                </Typography.Title>
              </div>
            }
            open={isHallsModalOpen}
            onCancel={() => setIsHallsModalOpen(false)}
            footer={null}
            width={1000}
            zIndex={1050}
          >
            <div className="flex gap-6 mb-6 mt-4 border-b border-gray-200">
              <span
                onClick={() => setModalView("halls")}
                className={`cursor-pointer pb-2 text-lg transition-colors ${modalView === "halls" ? "text-black font-bold border-b-2 border-black" : "text-gray-400 font-medium hover:text-gray-600"}`}
              >
                Chọn phòng chiếu
              </span>
              <span
                className={`pb-2 text-lg transition-colors ${modalView === "seats" ? "text-black font-bold border-b-2 border-black" : "text-gray-400 font-medium"}`}
              >
                Sơ đồ ghế{" "}
                {modalView === "seats" && selectedHallForSeats
                  ? `(${selectedHallForSeats.name})`
                  : ""}
              </span>
            </div>

            {modalView === "halls" && (
              <div>
                <div className="flex justify-end mb-4">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddHall}
                    className="bg-[#a61d24] border-none"
                  >
                    Thêm Phòng Chiếu
                  </Button>
                </div>
                <Table
                  dataSource={halls}
                  columns={hallColumns}
                  rowKey="id"
                  loading={isHallsLoading}
                  pagination={{ pageSize: 5 }}
                  bordered
                />
              </div>
            )}

            {modalView === "seats" && selectedHallForSeats && (
              <div className="py-4">
                {isSeatsLoading ? (
                  <div className="flex justify-center">
                    <Spin />
                  </div>
                ) : seats.length === 0 ? (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-[#a61d24]">
                        Phòng chiếu này chưa có sơ đồ ghế
                      </h3>
                      <p className="text-gray-500">
                        Hãy tạo sơ đồ ghế tự động bằng cách nhập thông số bên
                        dưới.
                      </p>
                    </div>
                    <Form
                      form={seatBatchForm}
                      layout="vertical"
                      onFinish={handleGenerateSeats}
                      className="max-w-md mx-auto"
                    >
                      <Form.Item
                        name="rowCount"
                        label="Số hàng ngang Thường/VIP (Min 5)"
                        rules={[{ required: true }, { type: "number", min: 5 }]}
                      >
                        <InputNumber className="w-full" placeholder="VD: 10" />
                      </Form.Item>
                      <Form.Item
                        name="seatsPerRow"
                        label="Số ghế mỗi hàng Thường/VIP (Min 5)"
                        rules={[{ required: true }, { type: "number", min: 5 }]}
                      >
                        <InputNumber className="w-full" placeholder="VD: 12" />
                      </Form.Item>
                      <Form.Item
                        name="coupleSeatCount"
                        label="Số lượng ghế Đôi - Sweetbox (Min 1)"
                        rules={[{ required: true }, { type: "number", min: 1 }]}
                      >
                        <InputNumber className="w-full" placeholder="VD: 4" />
                      </Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        className="w-full bg-[#a61d24] border-none mt-2"
                        size="large"
                      >
                        Phát Sinh Tự Động Sơ Đồ Ghế
                      </Button>
                    </Form>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-6 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                      {isAdmin ? (
                        <p className="text-gray-500 text-sm m-0">
                          💡 <strong>Mẹo:</strong> Bấm vào ghế bất kỳ để sửa
                          loại ghế hoặc xóa.
                        </p>
                      ) : (
                        <div />
                      )}
                      {isAdmin && (
                        <Popconfirm
                          title="Xóa toàn bộ sơ đồ ghế?"
                          description="Bạn sẽ phải nhập lại Form để tạo sơ đồ mới."
                          onConfirm={handleDeleteAllSeats}
                          okText="Xóa sạch"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                        >
                          <Button danger icon={<DeleteOutlined />}>
                            Xóa toàn bộ sơ đồ
                          </Button>
                        </Popconfirm>
                      )}
                    </div>
                    <div className="w-full overflow-x-auto pb-6">
                      <div className="min-w-max flex flex-col items-center px-4">
                        <div className="text-center mb-10 w-full">
                          <div className="w-[80%] mx-auto h-3 bg-gray-300 rounded-t-full shadow-[0_15px_15px_rgba(0,0,0,0.1)]"></div>
                          <p className="text-gray-400 mt-3 text-sm tracking-[0.4em] uppercase font-semibold">
                            Màn hình chiếu
                          </p>
                        </div>
                        <div className="flex flex-col gap-3">
                          {rowNames.map((rowKey) => {
                            const rowSeats = groupedSeats[rowKey].sort(
                              (a: any, b: any) => a.number - b.number,
                            );
                            return (
                              <div
                                key={rowKey}
                                className="flex justify-center items-center gap-4"
                              >
                                <div className="flex gap-2">
                                  {rowSeats.map((seat: any) => {
                                    let isBroken = seat.status === "BROKEN";
                                    let seatStyle =
                                      "bg-white border-gray-300 text-gray-600";
                                    if (isBroken)
                                      seatStyle =
                                        "bg-gray-200 border-gray-400 text-gray-400 opacity-60";
                                    else if (seat.type === "VIP")
                                      seatStyle =
                                        "bg-white border-[#a61d24] text-[#a61d24] font-semibold";

                                    return (
                                      <div
                                        key={seat.id}
                                        onClick={() => handleSeatClick(seat)}
                                        className={`w-8 h-8 shrink-0 border-2 rounded-t-lg flex items-center justify-center text-[10px] relative ${isAdmin ? "cursor-pointer hover:shadow-md" : "cursor-default"} transition-all ${seatStyle}`}
                                        title={`${seat.rowName}${seat.number} - ${seat.type} ${isBroken ? "(Bảo trì)" : ""}`}
                                      >
                                        <span
                                          className={
                                            isBroken ? "line-through" : ""
                                          }
                                        >
                                          {seat.rowName}
                                          {seat.number}
                                        </span>
                                        {isBroken && (
                                          <div className="absolute inset-0 flex items-center justify-center text-red-500 text-lg opacity-80">
                                            <WarningOutlined />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="w-6 text-center font-bold text-gray-600 text-sm">
                                  {rowKey}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {coupleSeats.length > 0 && (
                          <div className="mt-8 pt-8 border-t border-gray-200 w-full max-w-[800px] mx-auto">
                            <div className="flex flex-wrap justify-center gap-4">
                              {coupleSeats
                                .sort((a: any, b: any) => a.number - b.number)
                                .map((seat: any) => {
                                  let isBroken = seat.status === "BROKEN";
                                  let seatStyle =
                                    "bg-pink-100 border-pink-400 text-pink-600 font-semibold";
                                  if (isBroken)
                                    seatStyle =
                                      "bg-gray-200 border-gray-400 text-gray-400 opacity-60";
                                  return (
                                    <div
                                      key={seat.id}
                                      onClick={() => handleSeatClick(seat)}
                                      className={`w-16 h-8 shrink-0 border-2 rounded-t-lg flex items-center justify-center text-[10px] relative ${isAdmin ? "cursor-pointer hover:shadow-md" : "cursor-default"} transition-all ${seatStyle}`}
                                      title={`Ghế đôi - ${seat.rowName}${seat.number} ${isBroken ? "(Bảo trì)" : ""}`}
                                    >
                                      <span
                                        className={
                                          isBroken ? "line-through" : ""
                                        }
                                      >
                                        {seat.rowName}
                                        {seat.number}
                                      </span>
                                      {isBroken && (
                                        <div className="absolute inset-0 flex items-center justify-center text-red-500 text-lg opacity-80">
                                          <WarningOutlined />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-center gap-6 mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-t-md border-2 border-gray-300 bg-white"></div>
                        <span className="text-sm">Ghế Thường</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-t-md border-2 border-[#a61d24] bg-white"></div>
                        <span className="text-sm">Ghế VIP</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-5 rounded-t-md border-2 border-pink-400 bg-pink-100"></div>
                        <span className="text-sm">Ghế Couple</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-t-md border-2 border-gray-400 bg-gray-200 flex items-center justify-center text-red-500 text-[10px]">
                          <WarningOutlined />
                        </div>
                        <span className="text-sm">Đang Bảo Trì</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Modal>

          <Modal
            title={
              <div className="border-l-[4px] border-[#a61d24] pl-3">
                <Typography.Title
                  level={4}
                  style={{ margin: 0, color: "#4a3426" }}
                >
                  Thiết lập ghế: {selectedSeat?.rowName}
                  {selectedSeat?.number}
                </Typography.Title>
              </div>
            }
            open={isSeatEditModalOpen}
            onCancel={() => setIsSeatEditModalOpen(false)}
            footer={null}
            zIndex={1100}
            width={400}
          >
            <Form
              form={seatForm}
              layout="vertical"
              onFinish={handleSaveSeat}
              className="mt-4"
            >
              <Form.Item
                name="type"
                label="Loại ghế"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="STANDARD">
                    Ghế Thường (Standard)
                  </Select.Option>
                  <Select.Option value="VIP">Ghế VIP</Select.Option>
                  <Select.Option value="SWEETBOX">
                    Ghế Đôi (Sweetbox)
                  </Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="status"
                label="Tình trạng hiện tại"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="AVAILABLE">
                    <Tag color="green">Đang hoạt động tốt</Tag>
                  </Select.Option>
                  <Select.Option value="BROKEN">
                    <Tag color="red">Bị hỏng / Bảo trì</Tag>
                  </Select.Option>
                </Select>
              </Form.Item>
              <Divider />
              <div className="flex justify-between items-center">
                <Popconfirm
                  title="Xóa ghế này khỏi sơ đồ?"
                  onConfirm={handleDeleteSeat}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<DeleteOutlined />}>
                    Xóa ghế
                  </Button>
                </Popconfirm>
                <Space>
                  <Button onClick={() => setIsSeatEditModalOpen(false)}>
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="bg-[#a61d24] border-none"
                  >
                    Lưu lại
                  </Button>
                </Space>
              </div>
            </Form>
          </Modal>

          <Modal
            title={
              editingHall ? "CẬP NHẬT PHÒNG CHIẾU" : "THÊM PHÒNG CHIẾU MỚI"
            }
            open={isHallFormOpen}
            onCancel={() => setIsHallFormOpen(false)}
            onOk={() => hallForm.submit()}
            okButtonProps={{ className: "bg-[#a61d24] border-none" }}
            zIndex={1060}
          >
            <Form form={hallForm} layout="vertical" onFinish={handleSaveHall}>
              <Form.Item
                name="name"
                label="Tên phòng chiếu"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Form>
          </Modal>
        </main>
      </SiteShell>
    </div>
  );
}

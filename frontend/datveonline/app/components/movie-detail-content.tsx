"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  App,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Upload,
  Row,
  Col,
  Popconfirm,
  Spin,
  Typography,
} from "antd";
import {
  UploadOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { MovieItem } from "../data/cgv-template";
import { localizeHref } from "../lib/i18n";
import { useDictionary, useLocale } from "./locale-provider";
import { useAuthSession } from "./auth-session-provider";
import {
  getMovieByIdApi,
  deleteMovieApi,
  updateMovieApi,
  uploadMovieImagesApi,
} from "../lib/cinema-api";

// --- HÀM TẠO 7 NGÀY (Dùng chung cho Modal Lịch Chiếu) ---
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
    const d = dayjs().add(i, "day");
    const iso = d.format("YYYY-MM-DD");
    const dateLabel = d.format("DD/MM");
    let dayLabel = days[d.day()];
    if (i === 0) dayLabel = "Hôm nay";
    dates.push({ iso, dateLabel, dayLabel });
  }
  return dates;
};

const formatDisplayMap: Record<string, string> = {
  TWO_D: "2D",
  THREE_D: "3D",
  IMAX: "IMAX",
  FOUR_DX: "4DX",
};

export function MovieDetailContent({ movie }: { movie: MovieItem }) {
  const locale = useLocale();
  const dictionary = useDictionary();
  const router = useRouter();
  const { message } = App.useApp();

  // 1. Kiểm tra quyền Admin
  const { token, user } = useAuthSession();
  const ageLabels: Record<string, string> = {
    P: "P (Mọi lứa tuổi)",
    C13: "C13 (Từ 13 tuổi)",
    C16: "C16 (Từ 16 tuổi)",
    C18: "C18 (Từ 18 tuổi)",
  };
  const isAdmin = String(user?.role).toUpperCase().includes("ADMIN");

  // 2. State cho Sửa Phim Inline & Trailer
  const [rawMovie, setRawMovie] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);

  // 3. State cho Modal Đặt Vé (Lịch chiếu)
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    dayjs().format("YYYY-MM-DD"),
  );
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [halls, setHalls] = useState<any[]>([]);
  const [showtimes, setShowtimes] = useState<any[]>([]);

  // Hàm chuyển đổi link YouTube
  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return "";
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
    }
    return url;
  };

  useEffect(() => {
    if (isAdmin && movie.id) {
      getMovieByIdApi(movie.id)
        .then((data) => setRawMovie(data))
        .catch((err) => console.error("Lỗi lấy thông tin phim:", err));
    }
    fetchBookingData();
  }, [isAdmin, movie.id]);

  // ==========================
  // HÀM XỬ LÝ LẤY DỮ LIỆU ĐẶT VÉ
  // ==========================
  const fetchBookingData = async () => {
    setIsLoadingData(true);
    try {
      const [cinemasRes, hallsRes, showtimesRes] = await Promise.all([
        fetch("http://localhost:9090/cinema/cinemas"),
        fetch("http://localhost:9090/cinema/halls"),
        fetch("http://localhost:9090/cinema/showtimes"),
      ]);

      if (cinemasRes.ok && hallsRes.ok && showtimesRes.ok) {
        const cinemasData = await cinemasRes.json();
        const hallsData = await hallsRes.json();
        const showtimesData = await showtimesRes.json();

        setCinemas(cinemasData.result || []);
        setHalls(hallsData.result || []);
        setShowtimes(showtimesData.result || []);
      } else {
        message.error("Không thể tải dữ liệu lịch chiếu.");
      }
    } catch (error) {
      console.error(error);
      message.error("Lỗi kết nối máy chủ.");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleOpenBookingModal = () => {
    setSelectedDate(dayjs().format("YYYY-MM-DD"));
    setIsBookingModalVisible(true);
    if (cinemas.length === 0) {
      fetchBookingData();
    }
  };

  // Gom nhóm lịch chiếu
  const getGroupedShowtimes = () => {
    if (!movie || !movie.id) return [];

    const now = dayjs();
    const thresholdTime = now.subtract(20, "minute");

    const activeShowtimes = showtimes.filter((st) => {
      const showtimeTime = dayjs(st.startTime);
      return (
        st.movieId === movie.id &&
        st.startTime.startsWith(selectedDate) &&
        st.status === "SCHEDULED" &&
        showtimeTime.isAfter(thresholdTime)
      );
    });

    const groupedByCinema: Record<string, { cinema: any; showtimes: any[] }> =
      {};

    activeShowtimes.forEach((st) => {
      const hall = halls.find((h) => h.id === st.hallId);
      if (hall) {
        const cinemaId = hall.cinemaId || hall.cinema?.id;
        const cinema = cinemas.find((c) => c.id === cinemaId);

        if (cinema) {
          if (!groupedByCinema[cinema.id]) {
            groupedByCinema[cinema.id] = { cinema, showtimes: [] };
          }
          groupedByCinema[cinema.id].showtimes.push({
            ...st,
            hallName: hall.name,
          });
        }
      }
    });

    return Object.values(groupedByCinema).map((group) => ({
      ...group,
      showtimes: group.showtimes.sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      ),
    }));
  };

  const groupedData = getGroupedShowtimes();

  // ==========================
  // CÁC HÀM XỬ LÝ CỦA ADMIN
  // ==========================
  const openEditModal = () => {
    form.setFieldsValue({
      ...rawMovie,
      releaseDate: rawMovie?.releaseDate ? dayjs(rawMovie.releaseDate) : null,
    });
    setPosterFile(null);
    setBannerFile(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (values: any) => {
    setSubmitting(true);
    try {
      const payload = {
        title: values.title,
        durationMin: values.durationMin,
        genre: values.genre,
        language: values.language,
        ageRestriction: values.ageRestriction,
        trailerUrl: values.trailerUrl || "",
        description: values.description || "",
        releaseDate: values.releaseDate
          ? values.releaseDate.format("YYYY-MM-DD")
          : null,
        directors: values.directors || [],
        actors: values.actors || [],
        status: values.status,
        featured: values.featured,
      };

      await updateMovieApi(token!, movie.id, payload);

      if (posterFile || bannerFile) {
        await uploadMovieImagesApi(
          token!,
          movie.id,
          posterFile as any,
          bannerFile as any,
        );
      }

      message.success("Đã cập nhật phim thành công!");
      setIsEditModalOpen(false);

      // 🔥 ĐÃ SỬA: Xóa window.location.reload()
      // Dùng router.refresh() để ép Next.js gọi lại Server Component lấy dữ liệu mới nhất
      router.refresh();
    } catch (err: any) {
      message.error(err.message || "Lỗi khi lưu phim");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFeatured = async () => {
    if (!rawMovie) return;
    try {
      const payload = { ...rawMovie, featured: !rawMovie.featured };
      await updateMovieApi(token!, movie.id, payload);
      setRawMovie(payload);
      message.success(
        payload.featured
          ? "Đã đưa phim lên Nổi bật!"
          : "Đã gỡ phim khỏi Nổi bật!",
      );

      // 🔥 CŨNG THÊM router.refresh() VÀO ĐÂY ĐỂ ĐỒNG BỘ GIAO DIỆN
      router.refresh();
    } catch (err: any) {
      message.error("Lỗi: " + err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMovieApi(token!, movie.id);
      message.success("Đã xóa phim vĩnh viễn!");
      router.push(locale === "vi" ? "/phim" : "/en/phim");
    } catch (err: any) {
      message.error("Lỗi khi xóa phim: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* PHẦN 1: THÔNG TIN CHI TIẾT PHIM */}
      <section className="cinema-paper overflow-hidden rounded-[28px] p-6 md:p-8 relative">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-[300px] shrink-0">
            <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-4 border-white bg-gray-100">
              {movie.posterUrl && (
                <Image
                  src={movie.posterUrl}
                  alt={movie.title}
                  fill
                  priority={true}
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-cover"
                />
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="rounded-md bg-[#a61d24] px-3 py-1 text-sm font-bold text-white uppercase">
                {movie.rating}
              </span>
              <span className="rounded-md bg-[#f0dfb1] px-3 py-1 text-sm font-semibold text-[#4a3426]">
                {movie.bookingLabel}
              </span>
              {movie.formats.map((format) => (
                <span
                  key={format}
                  className="rounded-md border border-[#e4d1b4] px-3 py-1 text-sm font-medium text-[#4a3426]"
                >
                  {format}
                </span>
              ))}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-[#4a3426] uppercase">
              {movie.title} {movie.rating && `(${movie.rating})`}
            </h1>
            <p className="mt-3 leading-7 text-[#6d5a46] italic">
              "{movie.synopsis}"
            </p>

            <div className="mt-6 space-y-3 text-[15px] text-[#4a3426]">
              <p>
                <strong className="inline-block w-28">
                  {dictionary.movieDetail.director}:
                </strong>{" "}
                {movie.director}
              </p>
              <p>
                <strong className="inline-block w-28">
                  {dictionary.movieDetail.cast}:
                </strong>{" "}
                {movie.cast.join(", ")}
              </p>
              <p>
                <strong className="inline-block w-28">Thể loại:</strong>{" "}
                {movie.genre}
              </p>
              <p>
                <strong className="inline-block w-28">Khởi chiếu:</strong>{" "}
                {movie.release}
              </p>
              <p>
                <strong className="inline-block w-28">Thời lượng:</strong>{" "}
                {movie.duration}
              </p>
              <p>
                <strong className="inline-block w-28">Ngôn ngữ:</strong>{" "}
                {movie.language}
              </p>
              <p>
                <strong className="inline-block w-28">Rated:</strong>
                <span className="font-bold text-[#a61d24]">
                  {ageLabels[movie.rating] || movie.rating}
                </span>
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 items-center">
              {movie.trailerUrl ? (
                <button
                  onClick={() => setIsTrailerModalOpen(true)}
                  className="inline-block rounded-xl border-2 border-[#c89a2b] px-8 py-2.5 font-semibold text-[#4a3426] cursor-pointer hover:bg-[#fbf6ed] transition duration-200"
                >
                  Xem Trailer
                </button>
              ) : (
                <span className="inline-block rounded-xl border-2 border-gray-300 px-8 py-2.5 font-semibold text-gray-400 cursor-not-allowed">
                  Chưa có Trailer
                </span>
              )}

              {/* 🔥 ĐÃ ĐIỀU CHỈNH: GỌI MODAL THAY VÌ CHUYỂN TRANG */}
              <button
                onClick={() => {
                  document
                    .getElementById("showtimes-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-xl bg-[#a61d24] px-8 py-2.5 font-bold text-white hover:bg-[#8a181e] transition duration-200 shadow-md cursor-pointer"
              >
                {dictionary.movieDetail.bookNow}
              </button>

              {isAdmin && rawMovie && (
                <div className="flex flex-wrap gap-2 items-center p-2 sm:ml-auto bg-[#fffaf4] rounded-xl border-2 border-dashed border-[#e4d1b4]">
                  <span className="text-sm font-bold text-[#a61d24] ml-2 mr-1">
                    Tác vụ Admin:
                  </span>
                  <Button
                    type="primary"
                    onClick={openEditModal}
                    className="bg-gray-800 hover:bg-black"
                  >
                    Sửa
                  </Button>
                  <Button onClick={toggleFeatured}>
                    {rawMovie.featured ? "Bỏ nổi bật" : "Đưa nổi bật"}
                  </Button>
                  <Popconfirm
                    title="Xóa vĩnh viễn phim này?"
                    description="Bạn có chắc chắn muốn xóa không?"
                    onConfirm={handleDelete}
                    okText="Xóa ngay"
                    cancelText="Hủy"
                  >
                    <Button danger>Xóa</Button>
                  </Popconfirm>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PHẦN 2: LỊCH CHIẾU VÀ ĐIỂM NHẤN */}
      {/* PHẦN 2: LỊCH CHIẾU TỪ DATABASE (FULL WIDTH) */}
      <div className="mt-8" id="showtimes-section">
        <section className="cinema-paper rounded-[28px] p-6 md:p-8">
          <h2 className="cinema-section-title text-3xl text-[#4a3426] mb-8 uppercase">
            {dictionary.movieDetail.showtimes}
          </h2>

          {isLoadingData ? (
            <div className="flex justify-center py-10">
              <Spin size="large" />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
              {/* Thanh chọn ngày (7 ngày gần nhất) */}
              <div className="flex overflow-x-auto gap-3 justify-start mb-6 pb-2 scrollbar-hide">
                {generateDates().map((dateObj) => {
                  const isActive = selectedDate === dateObj.iso;
                  return (
                    <button
                      key={dateObj.iso}
                      onClick={() => setSelectedDate(dateObj.iso)}
                      className={`shrink-0 min-w-[100px] px-3 py-2 border rounded-lg flex flex-col items-center justify-center transition-all ${
                        isActive
                          ? "bg-[#a61d24] text-white border-[#a61d24] shadow-md transform -translate-y-1"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      <span className="font-semibold text-sm">
                        {dateObj.dayLabel}
                      </span>
                      <span className="text-xs mt-1">{dateObj.dateLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* Danh sách rạp và suất chiếu thực tế từ Database */}
              {groupedData.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500 text-lg">
                    Không có suất chiếu nào được lên lịch vào ngày này.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {groupedData.map((group) => (
                    <div
                      key={group.cinema.id}
                      className="bg-white p-5 rounded-xl shadow-sm border border-gray-100"
                    >
                      <div className="flex items-center gap-2 mb-4 border-b pb-3 border-gray-100">
                        <EnvironmentOutlined className="text-[#a61d24] text-xl" />
                        <h4 className="font-bold text-lg text-gray-800 m-0">
                          {group.cinema.name}
                        </h4>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {group.showtimes.map((st: any) => {
                          const timeStr = dayjs(st.startTime).format("HH:mm");

                          // Lọc trạng thái suất chiếu
                          const now = dayjs();
                          const startTime = dayjs(st.startTime);
                          const endTime = dayjs(st.endTime);
                          let isLockedForUser = false;

                          if (
                            st.status === "CANCELLED" ||
                            st.status === "COMPLETED" ||
                            now.isAfter(endTime) ||
                            now.isAfter(startTime.add(20, "minute"))
                          ) {
                            isLockedForUser = true;
                          }

                          // Nếu bị khóa (đã chiếu/hủy) và là User bình thường thì không render
                          if (!isAdmin && isLockedForUser) return null;

                          return (
                            <Link
                              href={localizeHref(`/dat-ve/${st.id}`, locale)}
                              key={st.id}
                            >
                              <button
                                className={`border rounded-lg px-5 py-2 flex flex-col items-center group transition-colors ${isLockedForUser ? "bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed" : "border-gray-300 hover:border-[#a61d24] hover:bg-red-50 cursor-pointer"}`}
                              >
                                <span
                                  className={`font-bold text-lg ${isLockedForUser ? "text-gray-400" : "text-gray-800 group-hover:text-[#a61d24]"}`}
                                >
                                  {timeStr}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {st.hallName}
                                </span>
                                {st.format && (
                                  <span className="text-[10px] font-bold mt-1 bg-yellow-100 text-yellow-800 px-2 rounded-full">
                                    {formatDisplayMap[st.format] || st.format}
                                  </span>
                                )}
                              </button>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* 🔥 MODAL SỬA PHIM TRỰC TIẾP TRÊN TRANG CHI TIẾT 🔥 */}
      <Modal
        open={isEditModalOpen}
        title="Chỉnh sửa thông tin phim"
        onCancel={() => setIsEditModalOpen(false)}
        onOk={() => form.submit()}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        confirmLoading={submitting}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveEdit}
          className="mt-4"
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="title"
                label="Tên phim"
                rules={[{ required: true }]}
              >
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="durationMin"
                label="Thời lượng (Phút)"
                rules={[{ required: true }]}
              >
                <InputNumber size="large" min={30} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="genre"
                label="Thể loại"
                rules={[{ required: true }]}
              >
                <Select
                  size="large"
                  options={[
                    { label: "Hành động", value: "ACTION" },
                    { label: "Hài hước", value: "COMEDY" },
                    { label: "Khoa học viễn tưởng", value: "SCI_FI" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="language"
                label="Ngôn ngữ"
                rules={[{ required: true }]}
              >
                <Select
                  size="large"
                  options={[
                    { label: "Tiếng Anh", value: "ENGLISH" },
                    { label: "Tiếng Việt", value: "VIETNAMESE" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="ageRestriction"
                label="Giới hạn tuổi"
                rules={[{ required: true }]}
              >
                <Select
                  size="large"
                  options={[
                    { label: "P", value: "P" },
                    { label: "C13", value: "C13" },
                    { label: "C16", value: "C16" },
                    { label: "C18", value: "C18" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="releaseDate"
                label="Ngày khởi chiếu"
                rules={[{ required: true }]}
              >
                <DatePicker
                  size="large"
                  className="w-full"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="trailerUrl" label="Link Trailer">
                <Input size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="directors"
                label="Đạo diễn"
                rules={[{ required: true }]}
              >
                <Select mode="tags" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="actors"
                label="Diễn viên"
                rules={[{ required: true }]}
              >
                <Select mode="tags" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Đổi Poster (Ảnh dọc)">
                <Upload
                  beforeUpload={(f) => {
                    setPosterFile(f);
                    return false;
                  }}
                  maxCount={1}
                  accept="image/*"
                  listType="picture"
                >
                  <Button icon={<UploadOutlined />}>Chọn ảnh mới</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Đổi Banner (Ảnh ngang)">
                <Upload
                  beforeUpload={(f) => {
                    setBannerFile(f);
                    return false;
                  }}
                  maxCount={1}
                  accept="image/*"
                  listType="picture"
                >
                  <Button icon={<UploadOutlined />}>Chọn ảnh mới</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[{ required: true }]}
              >
                <Select
                  size="large"
                  options={[
                    { value: "NOW_SHOWING", label: "Đang chiếu" },
                    { value: "COMING_SOON", label: "Sắp chiếu" },
                    { value: "STOPPED", label: "Ngừng chiếu" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="featured"
                label="Nổi bật"
                rules={[{ required: true }]}
              >
                <Select
                  size="large"
                  options={[
                    { value: true, label: "Có" },
                    { value: false, label: "Không" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 🔥 MODAL PHÁT TRAILER YOUTUBE 🔥 */}
      <Modal
        title={movie.title}
        open={isTrailerModalOpen}
        onCancel={() => setIsTrailerModalOpen(false)}
        footer={null}
        width={850}
        centered
        destroyOnClose
      >
        <div className="relative w-full pt-[56.25%] rounded-lg overflow-hidden bg-black">
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={getYouTubeEmbedUrl(movie.trailerUrl)}
            title="Trailer"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      </Modal>
    </div>
  );
}

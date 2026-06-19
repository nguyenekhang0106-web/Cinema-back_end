"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  Col,
  Modal,
  Row,
  Space,
  Tag,
  Typography,
  Spin,
  message,
} from "antd";
import { ClockCircleOutlined, EnvironmentOutlined } from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import dayjs from "dayjs";
import { MovieItem } from "../data/cgv-template";
import { localizeHref } from "../lib/i18n";
import { useDictionary, useLocale } from "./locale-provider";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_CINEMA_API_URL ?? "http://localhost:9090/cinema"
).replace(/\/$/, "");

// --- HÀM TẠO 7 NGÀY ---
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

export function MovieGrid({
  movies,
  showBooking = true,
}: {
  movies: any[]; // Dùng any hoặc MovieItem mở rộng để hỗ trợ id từ Backend
  showBooking?: boolean;
}) {
  const locale = useLocale();
  const dictionary = useDictionary();

  // --- STATE TRAILER ---
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);
  const [currentTrailerUrl, setCurrentTrailerUrl] = useState("");

  // --- STATE MODAL LỊCH CHIẾU ---
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [selectedMovieForBooking, setSelectedMovieForBooking] = useState<
    any | null
  >(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    dayjs().format("YYYY-MM-DD"),
  );

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [halls, setHalls] = useState<any[]>([]);
  const [showtimes, setShowtimes] = useState<any[]>([]);

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

  // --- HÀM LOAD DỮ LIỆU ĐẶT VÉ TỪ BACKEND ---
  const fetchBookingData = async () => {
    setIsLoadingData(true);
    try {
      const [cinemasRes, hallsRes, showtimesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/cinemas`),
        fetch(`${API_BASE_URL}/halls`),
        fetch(`${API_BASE_URL}/showtimes`),
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

  const handleOpenBookingModal = (movie: any) => {
    setSelectedMovieForBooking(movie);
    setSelectedDate(dayjs().format("YYYY-MM-DD")); // Trả về ngày hiện tại khi mở
    setIsBookingModalVisible(true);
    if (cinemas.length === 0) {
      fetchBookingData(); // Gọi API nếu chưa có data
    }
  };

  // --- LOGIC LỌC VÀ GOM NHÓM LỊCH CHIẾU ---
  const getGroupedShowtimes = () => {
    if (!selectedMovieForBooking) return [];

    const now = dayjs();
    const thresholdTime = now.subtract(20, "minute");

    // 1. Lọc lịch chiếu: Cùng phim, cùng ngày, đang lên lịch, chưa qua 20p
    const activeShowtimes = showtimes.filter((st) => {
      const showtimeTime = dayjs(st.startTime);
      return (
        st.movieId === selectedMovieForBooking.id &&
        st.startTime.startsWith(selectedDate) &&
        st.status === "SCHEDULED" &&
        showtimeTime.isAfter(thresholdTime)
      );
    });

    // 2. Gom nhóm theo Rạp
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

    // Sort thời gian chiếu
    return Object.values(groupedByCinema).map((group) => ({
      ...group,
      showtimes: group.showtimes.sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      ),
    }));
  };

  const groupedData = getGroupedShowtimes();

  return (
    <>
      {/* GRID PHIM */}
      <Row gutter={[20, 20]}>
        {movies.map((movie) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={movie.id}>
            <Card
              hoverable
              bordered={false}
              className="cinema-paper overflow-hidden rounded-[22px] h-full"
              styles={{ body: { padding: "16px" } }}
              cover={
                <div className="relative aspect-[3/4] overflow-hidden group">
                  {/* LỚP 1: ẢNH VÀ LINK CHI TIẾT PHIM */}
                  <Link
                    href={localizeHref(
                      `/phim/${movie.slug || movie.id}`,
                      locale,
                    )}
                    className="absolute inset-0 z-10 block"
                  >
                    {movie.posterUrl && (
                      <Image
                        src={movie.posterUrl}
                        alt={movie.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={true}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </Link>

                  {/* LỚP GRADIANT GỐC */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent p-4 z-20 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none">
                    <div className="flex items-start justify-between gap-3">
                      {movie.bookingLabel && (
                        <Tag color="red">{movie.bookingLabel}</Tag>
                      )}
                      {movie.rating && <Tag color="gold">{movie.rating}</Tag>}
                    </div>
                    <div className="absolute inset-x-4 bottom-5">
                      <Typography.Text
                        style={{ color: "rgba(255,255,255,0.74)" }}
                      >
                        {movie.genre}
                      </Typography.Text>
                      <Typography.Title
                        level={4}
                        style={{
                          color: "#fff",
                          margin: "8px 0 0",
                          lineHeight: 1.18,
                        }}
                      >
                        {movie.title}
                      </Typography.Title>
                    </div>
                  </div>

                  {/* LỚP PHỦ HOVER */}
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 p-4 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none">
                    {/* NÚT TRAILER */}
                    <div className="w-full px-2 pointer-events-auto">
                      <Button
                        block
                        size="large"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (movie.trailerUrl) {
                            setCurrentTrailerUrl(movie.trailerUrl);
                            setIsTrailerModalOpen(true);
                          } else {
                            Modal.warning({
                              title: "Thông báo",
                              content: "Trailer phim đang được cập nhật!",
                            });
                          }
                        }}
                        className="cinema-hover-btn border-white text-white hover:border-[#f0dfb1] hover:text-[#f0dfb1]"
                      >
                        Trailer
                      </Button>
                    </div>

                    {/* NÚT ĐẶT VÉ (GỌI MODAL) */}
                    {showBooking && (
                      <div className="w-full px-2 pointer-events-auto">
                        <Button
                          block
                          size="large"
                          type="primary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOpenBookingModal(movie);
                          }}
                        >
                          {dictionary.home.book}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              }
            >
              {/* PHẦN TEXT BÊN DƯỚI CARD */}
              <Space direction="vertical" size={10} className="w-full">
                <Typography.Text style={{ color: "#7b6a58", fontSize: "13px" }}>
                  {movie.release ||
                    dayjs(movie.releaseDate).format("DD-MM-YYYY")}{" "}
                  | {movie.duration || `${movie.durationMin} phút`}
                </Typography.Text>

                {movie.formats && movie.formats.length > 0 && (
                  <Space wrap size={6}>
                    {movie.formats.map((format: string) => (
                      <Tag
                        key={format}
                        color="gold"
                        style={{ fontSize: "11px", padding: "0 5px" }}
                      >
                        {format}
                      </Tag>
                    ))}
                  </Space>
                )}

                <Space direction="vertical" size={8} className="w-full mt-1">
                  <Link
                    href={localizeHref(
                      `/phim/${movie.slug || movie.id}`,
                      locale,
                    )}
                  >
                    <Button block>{dictionary.home.detail}</Button>
                  </Link>
                  {showBooking && (
                    <Button
                      block
                      type="primary"
                      onClick={() => handleOpenBookingModal(movie)}
                    >
                      {dictionary.home.book}
                    </Button>
                  )}
                </Space>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ================= MODAL TRAILER ================= */}
      <Modal
        title="Xem Trailer"
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
            src={getYouTubeEmbedUrl(currentTrailerUrl)}
            title="Trailer"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      </Modal>

      {/* ================= MODAL CHỌN LỊCH CHIẾU ĐẶT VÉ ================= */}
      <Modal
        open={isBookingModalVisible}
        onCancel={() => setIsBookingModalVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
        closeIcon={
          <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors">
            ✕
          </div>
        }
        className="booking-modal"
      >
        {selectedMovieForBooking && (
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <img
              src={selectedMovieForBooking.posterUrl}
              alt="Poster"
              className="w-32 rounded-lg shadow-md hidden md:block object-cover aspect-[2/3]"
            />
            <div>
              <Typography.Title
                level={3}
                style={{
                  color: "#a61d24",
                  margin: 0,
                  textTransform: "uppercase",
                }}
              >
                {selectedMovieForBooking.title}
              </Typography.Title>
              <p className="text-gray-500 mt-2 text-sm">
                <ClockCircleOutlined className="mr-1" />{" "}
                {selectedMovieForBooking.duration ||
                  `${selectedMovieForBooking.durationMin} phút`}{" "}
                | Thể loại: {selectedMovieForBooking.genre}
              </p>
            </div>
          </div>
        )}

        {isLoadingData ? (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            {/* Thanh chọn ngày */}
            <div className="flex overflow-x-auto gap-3 justify-start mb-6 pb-2 scrollbar-hide">
              {generateDates().map((dateObj) => {
                const isActive = selectedDate === dateObj.iso;
                return (
                  <button
                    key={dateObj.iso}
                    onClick={() => setSelectedDate(dateObj.iso)}
                    className={`shrink-0 min-w-[100px] px-3 py-2 border rounded-lg flex flex-col items-center justify-center transition-all ${isActive ? "bg-[#a61d24] text-white border-[#a61d24] shadow-md transform -translate-y-1" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
                  >
                    <span className="font-semibold text-sm">
                      {dateObj.dayLabel}
                    </span>
                    <span className="text-xs mt-1">{dateObj.dateLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Danh sách rạp và suất chiếu */}
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
                      <div>
                        <h4 className="font-bold text-lg text-gray-800 m-0">
                          {group.cinema.name}
                        </h4>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {group.showtimes.map((st: any) => {
                        const timeStr = dayjs(st.startTime).format("HH:mm");
                        return (
                          <Link
                            href={localizeHref(`/dat-ve/${st.id}`, locale)}
                            key={st.id}
                          >
                            <button className="border border-gray-300 rounded-lg px-5 py-2 hover:border-[#a61d24] hover:bg-red-50 transition-colors flex flex-col items-center group">
                              <span className="font-bold text-lg text-gray-800 group-hover:text-[#a61d24]">
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
      </Modal>
    </>
  );
}

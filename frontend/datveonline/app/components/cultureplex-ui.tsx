"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { localizeHref } from "../lib/i18n";
import {
  Row,
  Col,
  Card,
  Typography,
  Rate,
  Button,
  Avatar,
  List,
  Tag,
  Space,
  Skeleton,
  App,
  Input,
  Modal,
  Form,
  Select,
  Popconfirm,
  Spin,
  Tabs,
} from "antd";
import {
  LikeOutlined,
  LikeFilled,
  DislikeOutlined,
  DislikeFilled,
  MessageOutlined,
  ClockCircleOutlined,
  FireOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";

// Bắt buộc import cả 2 locale của dayjs để nó có thể tự switch qua lại
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import "dayjs/locale/en";

dayjs.extend(relativeTime);

import { useAuthSession } from "./auth-session-provider";
import { SiteShell } from "./site-shell";
import { useLocale } from "./locale-provider"; // 🔥 Dùng hook để lấy ngôn ngữ hiện tại

export function CultureplexUI() {
  const { token, role } = useAuthSession();
  const { message } = App.useApp();
  const locale = useLocale(); // "vi" hoặc "en"

  // Tự động đổi ngôn ngữ hiển thị thời gian ("2 giờ trước" <-> "2 hours ago")
  dayjs.locale(locale);

  const [movies, setMovies] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 STATE MỚI: Quản lý Tab loại bài viết đang chọn (Mặc định là Tin tức)
  const [activeArticleTab, setActiveArticleTab] = useState<string>("NEWS");

  const [expandedMovieId, setExpandedMovieId] = useState<string | null>(null);
  const [movieReviews, setMovieReviews] = useState<Record<string, any[]>>({});
  const [movieStats, setMovieStats] = useState<Record<string, any>>({});
  const [movieReactions, setMovieReactions] = useState<Record<string, any>>({});
  const [reviewDrafts, setReviewDrafts] = useState<
    Record<string, { ratingScore: number; comment: string }>
  >({});
  const [loadingReviews, setLoadingReviews] = useState(false);

  const { Title, Text, Paragraph } = Typography;
  const [articleForm] = Form.useForm();
  const [articleModal, setArticleModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    editingId?: string;
  }>({ open: false, mode: "create" });
  const [submittingArticle, setSubmittingArticle] = useState(false);

  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);
  const [currentTrailerUrl, setCurrentTrailerUrl] = useState("");

  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [selectedMovieForBooking, setSelectedMovieForBooking] = useState<
    any | null
  >(null);
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD"),
  );

  const [isLoadingBookingData, setIsLoadingBookingData] = useState(false);
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

  const generateDates = () => {
    const days = [
      "Chủ Nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];

    return Array.from({ length: 7 }).map((_, index) => {
      const d = dayjs().add(index, "day");
      return {
        iso: d.format("YYYY-MM-DD"),
        dateLabel: d.format("DD/MM"),
        dayLabel: index === 0 ? "Hôm nay" : days[d.day()],
      };
    });
  };

  const formatDisplayMap: Record<string, string> = {
    TWO_D: "2D",
    THREE_D: "3D",
    IMAX: "IMAX",
    FOUR_DX: "4DX",
  };

  const fetchBookingData = async () => {
    setIsLoadingBookingData(true);

    try {
      const [cinemasRes, hallsRes, showtimesRes] = await Promise.all([
        fetch("http://localhost:9090/cinema/cinemas"),
        fetch("http://localhost:9090/cinema/halls"),
        fetch("http://localhost:9090/cinema/showtimes"),
      ]);

      const cinemasData = await cinemasRes.json();
      const hallsData = await hallsRes.json();
      const showtimesData = await showtimesRes.json();

      setCinemas(cinemasData.result || []);
      setHalls(hallsData.result || []);
      setShowtimes(showtimesData.result || []);
    } catch (error) {
      message.error("Không thể tải lịch chiếu!");
    } finally {
      setIsLoadingBookingData(false);
    }
  };

  const handleOpenBookingModal = (movie: any) => {
    setSelectedMovieForBooking(movie);
    setSelectedDate(dayjs().format("YYYY-MM-DD"));
    setIsBookingModalVisible(true);

    if (cinemas.length === 0) {
      fetchBookingData();
    }
  };

  const getGroupedShowtimes = () => {
    if (!selectedMovieForBooking) return [];

    const now = dayjs();
    const thresholdTime = now.subtract(20, "minute");

    const activeShowtimes = showtimes.filter((st) => {
      const showtimeTime = dayjs(st.startTime);

      return (
        st.movieId === selectedMovieForBooking.id &&
        st.startTime.startsWith(selectedDate) &&
        st.status === "SCHEDULED" &&
        showtimeTime.isAfter(thresholdTime)
      );
    });

    const groupedByCinema: Record<string, { cinema: any; showtimes: any[] }> =
      {};

    activeShowtimes.forEach((st) => {
      const hall = halls.find((h) => h.id === st.hallId);
      if (!hall) return;

      const cinemaId = hall.cinemaId || hall.cinema?.id;
      const cinema = cinemas.find((c) => c.id === cinemaId);
      if (!cinema) return;

      if (!groupedByCinema[cinema.id]) {
        groupedByCinema[cinema.id] = { cinema, showtimes: [] };
      }

      groupedByCinema[cinema.id].showtimes.push({
        ...st,
        hallName: hall.name,
      });
    });

    return Object.values(groupedByCinema).map((group) => ({
      ...group,
      showtimes: group.showtimes.sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      ),
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const movieRes = await fetch("http://localhost:9090/cinema/movies");
        const movieData = await movieRes.json();

        // Đã xóa phần ?type=NEWS để lấy tất cả bài xuất bản
        const articleRes = await fetch("http://localhost:9090/cinema/articles");
        const articleData = await articleRes.json();

        if (movieData.code === 1000) {
          const visibleMovies = movieData.result.filter(
            (movie: any) =>
              movie.status === "NOW_SHOWING" || movie.status === "COMING_SOON",
          );

          setMovies(visibleMovies);

          const statsResult: Record<string, any> = {};
          const reactionResult: Record<string, any> = {};

          await Promise.all(
            visibleMovies.map(async (movie: any) => {
              try {
                const statRes = await fetch(
                  `http://localhost:9090/cinema/reviews/movie/${movie.id}/stats`,
                );

                const statData = await statRes.json();

                if (statData.code === 1000) {
                  statsResult[movie.id] = statData.result;
                }

                const reactionRes = await fetch(
                  `http://localhost:9090/cinema/movies/${movie.id}/reaction-stats`,
                  token
                    ? { headers: { Authorization: `Bearer ${token}` } }
                    : undefined,
                );

                const reactionData = await reactionRes.json();

                if (reactionData.code === 1000) {
                  reactionResult[movie.id] = reactionData.result;
                }
              } catch (err) {
                console.error(err);
              }
            }),
          );

          setMovieStats(statsResult);
          setMovieReactions(reactionResult);
        }
        if (articleData.code === 1000) {
          const articleList = articleData.result || [];
          setArticles(articleList);

          const params = new URLSearchParams(window.location.search);
          const articleId = params.get("article");

          if (articleId) {
            const foundArticle = articleList.find(
              (item: any) => item.id === articleId,
            );
            if (foundArticle) {
              setSelectedArticle(foundArticle);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching Cultureplex data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggleComments = async (movieId: string) => {
    if (expandedMovieId === movieId) {
      setExpandedMovieId(null);
      return;
    }

    setExpandedMovieId(movieId);
    if (movieReviews[movieId]) return;

    setLoadingReviews(true);
    try {
      const res = await fetch(
        `http://localhost:9090/cinema/reviews/movie/${movieId}`,
      );
      const data = await res.json();
      if (data.code === 1000) {
        setMovieReviews((prev) => ({ ...prev, [movieId]: data.result }));
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const refreshMovieStats = async (movieId: string) => {
    try {
      const res = await fetch(
        `http://localhost:9090/cinema/reviews/movie/${movieId}/stats`,
      );
      const data = await res.json();

      if (data.code === 1000) {
        setMovieStats((prev) => ({
          ...prev,
          [movieId]: data.result,
        }));
      }
    } catch (error) {
      console.error("Error refreshing movie stats:", error);
    }
  };

  const handleSubmitReview = async (movieId: string) => {
    if (!token) {
      message.warning(
        locale === "vi"
          ? "Vui lòng đăng nhập để đánh giá phim!"
          : "Please sign in to review!",
      );
      return;
    }

    const draft = reviewDrafts[movieId];

    if (!draft?.ratingScore) {
      message.warning(
        locale === "vi" ? "Vui lòng chọn số sao!" : "Please choose rating!",
      );
      return;
    }

    try {
      const res = await fetch("http://localhost:9090/cinema/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          movieId,
          ratingScore: draft.ratingScore,
          comment: draft.comment || "",
        }),
      });

      if (res.status === 401) return;

      const data = await res.json();

      if (data.code !== 1000) {
        throw new Error(data.message || "Không thể gửi đánh giá");
      }

      message.success(
        locale === "vi" ? "Đã gửi đánh giá!" : "Review submitted!",
      );

      setReviewDrafts((prev) => ({
        ...prev,
        [movieId]: { ratingScore: 0, comment: "" },
      }));

      const reviewRes = await fetch(
        `http://localhost:9090/cinema/reviews/movie/${movieId}`,
      );
      const reviewData = await reviewRes.json();

      if (reviewData.code === 1000) {
        setMovieReviews((prev) => ({
          ...prev,
          [movieId]: reviewData.result,
        }));
      }

      refreshMovieStats(movieId);
    } catch (error: any) {
      message.error(error.message || "Gửi đánh giá thất bại!");
    }
  };

  const handleReaction = async (
    reviewId: string,
    movieId: string,
    isLike: boolean,
  ) => {
    if (!token) {
      message.warning(
        locale === "vi"
          ? "Vui lòng đăng nhập để tương tác!"
          : "Please sign in to react!",
      );
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:9090/cinema/reviews/${reviewId}/react?isLike=${isLike}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.status === 401) return;

      const data = await res.json();

      if (data.code !== 1000) {
        throw new Error(data.message || "Tương tác thất bại");
      }

      setMovieReviews((prev) => {
        const list = prev[movieId] || [];

        return {
          ...prev,
          [movieId]: list.map((review) =>
            review.id === reviewId ? data.result : review,
          ),
        };
      });
    } catch (error: any) {
      message.error(error.message || "Không thể tương tác!");
    }
  };

  const handleMovieReaction = async (movieId: string, isLike: boolean) => {
    if (!token) {
      message.warning(
        locale === "vi"
          ? "Vui lòng đăng nhập để tương tác!"
          : "Please sign in to react!",
      );
      return;
    }

    const res = await fetch(
      `http://localhost:9090/cinema/movies/${movieId}/react?isLike=${isLike}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (res.status === 401) return;

    const data = await res.json();

    if (data.code === 1000) {
      setMovieReactions((prev) => ({
        ...prev,
        [movieId]: data.result,
      }));
    }
  };

  const openArticleEditor = (mode: "create" | "edit", article?: any) => {
    setArticleModal({ open: true, mode, editingId: article?.id });

    articleForm.setFieldsValue({
      title: article?.title || "",
      thumbnailUrl: article?.thumbnailUrl || "",
      summary: article?.summary || "",
      content: article?.content || "",
      type: article?.type || "NEWS",
      status: article?.status || "PUBLISHED",
      featured:
        article?.featured === true ||
        article?.featured === 1 ||
        article?.featured === "1",
      authorName: article?.authorName || "",
      movieId: article?.movieId || "",
    });
  };

  const saveArticle = async () => {
    if (!token) return;

    const values = await articleForm.validateFields();
    setSubmittingArticle(true);

    try {
      const url =
        articleModal.mode === "edit"
          ? `http://localhost:9090/cinema/articles/${articleModal.editingId}`
          : "http://localhost:9090/cinema/articles";

      const res = await fetch(url, {
        method: articleModal.mode === "edit" ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (data.code && data.code !== 1000) {
        throw new Error(data.message || "Lưu bài viết thất bại");
      }

      message.success("Lưu bài viết thành công");

      setArticleModal({ open: false, mode: "create" });
      articleForm.resetFields();

      // Gọi lại API để làm mới toàn bộ bài viết
      const reload = await fetch("http://localhost:9090/cinema/articles");
      const reloadData = await reload.json();
      setArticles(reloadData.result || []);
    } catch (error: any) {
      message.error(error.message || "Lưu bài viết thất bại");
    } finally {
      setSubmittingArticle(false);
    }
  };

  const deleteArticle = async (id: string) => {
    if (!token) return;

    await fetch(`http://localhost:9090/cinema/articles/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    message.success("Đã xóa bài viết");
    setArticles((prev) => prev.filter((item) => item.id !== id));
  };

  const featuredMovies = movies.filter((movie) => movie.featured === true);

  // 🔥 LỌC BÀI VIẾT THEO TAB ĐANG CHỌN
  const filteredArticles = articles.filter(
    (article) => article.type === activeArticleTab,
  );

  return (
    <div className="cinema-page bg-[#f5efe5] min-h-screen">
      <SiteShell>
        <main className="cinema-shell px-4 py-8 sm:px-6 max-w-[1400px] mx-auto">
          {selectedArticle ? (
            <div>
              <div className="-mt-4 mb-8">
                <Button
                  className="rounded-full font-semibold"
                  onClick={() => setSelectedArticle(null)}
                >
                  ← {locale === "vi" ? "Quay lại" : "Back"}
                </Button>
              </div>

              <Row gutter={[32, 24]}>
                <Col xs={24} lg={14}>
                  <Title level={2} className="!text-[#111] uppercase">
                    {selectedArticle.title}
                  </Title>

                  <img
                    src={
                      selectedArticle.thumbnailUrl ||
                      "https://via.placeholder.com/900x450?text=News"
                    }
                    alt={selectedArticle.title}
                    className="w-full max-h-[520px] object-cover rounded-xl shadow mb-8"
                  />

                  <div
                    className="text-base leading-8 whitespace-pre-line text-[#222]"
                    dangerouslySetInnerHTML={{
                      __html: selectedArticle.content,
                    }}
                  />

                  <div className="mt-12">
                    <Title level={3} className="!text-[#111] uppercase !mb-6">
                      {locale === "vi" ? "Tin khác" : "Other News"}
                    </Title>

                    <List
                      // 🔥 Ép chia chính xác 2 cột trên mọi màn hình (trừ mobile nhỏ)
                      grid={{
                        gutter: 24,
                        xs: 1,
                        sm: 2,
                        md: 2,
                        lg: 2,
                        xl: 2,
                        xxl: 2,
                      }}
                      dataSource={articles.filter((item) => {
                        const isFeatured =
                          item.featured === true ||
                          item.featured === 1 ||
                          item.featured === "1";

                        const isPublished =
                          !item.status || item.status === "PUBLISHED";

                        return (
                          item.id !== selectedArticle.id &&
                          isFeatured &&
                          isPublished
                        );
                      })}
                      pagination={{
                        pageSize: 4,
                        align: "center",
                        showSizeChanger: false,
                      }}
                      renderItem={(item) => (
                        // 🔥 Bắt buộc thêm style 100% cho List.Item để các thẻ giãn đều nhau
                        <List.Item style={{ height: "100%", width: "100%" }}>
                          <Card
                            hoverable
                            onClick={() => {
                              setSelectedArticle(item);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            // 🔥 Đảm bảo Card chiếm toàn bộ không gian của List.Item
                            className="rounded-xl border-none shadow-sm overflow-hidden group cursor-pointer w-full h-full flex flex-col"
                            bodyStyle={{
                              padding: 0,
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            <div className="flex flex-col h-full w-full">
                              {/* Thu nhỏ chiều cao ảnh một chút (200px) để cân đối hơn */}
                              <div className="relative h-[200px] overflow-hidden bg-gray-100 shrink-0">
                                <img
                                  src={
                                    item.thumbnailUrl ||
                                    "https://via.placeholder.com/400x200?text=News"
                                  }
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />

                                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs">
                                  {dayjs(item.publishDate).format("DD/MM/YYYY")}
                                </div>
                              </div>

                              <div className="p-4 bg-white flex-1 flex flex-col">
                                <Text
                                  strong
                                  className="text-base line-clamp-2 mb-2 block group-hover:text-[#a61d24] transition-colors"
                                >
                                  {item.title}
                                </Text>

                                {/* Dồn phần tóm tắt xuống cuối để các thẻ có chữ ngắn/dài vẫn bằng nhau */}
                                <Paragraph
                                  type="secondary"
                                  className="text-sm line-clamp-2 !m-0 mt-auto"
                                >
                                  {item.summary}
                                </Paragraph>
                              </div>
                            </div>
                          </Card>
                        </List.Item>
                      )}
                    />
                  </div>
                </Col>

                <Col xs={24} lg={8}>
                  <div className="sticky top-24">
                    <Title level={3} className="!text-[#111] uppercase !mb-6">
                      {locale === "vi" ? "Phim nổi bật" : "Featured Movies"}
                    </Title>

                    <List
                      // Vẫn chia thành 2 cột như Metiz
                      grid={{
                        gutter: 16,
                        xs: 2,
                        sm: 2,
                        md: 4,
                        lg: 2,
                        xl: 2,
                        xxl: 2,
                      }}
                      dataSource={featuredMovies}
                      pagination={{
                        pageSize: 4,
                        align: "center",
                        showSizeChanger: false,
                        size: "small",
                      }}
                      renderItem={(movie) => (
                        <List.Item style={{ width: "100%", height: "100%" }}>
                          <div className="group bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden flex flex-col h-full w-full hover:shadow-md transition-shadow">
                            {/* KHU VỰC POSTER (Chứa các hiệu ứng Hover) */}
                            <div className="relative aspect-[2/3] overflow-hidden bg-gray-100">
                              <img
                                src={
                                  movie.posterUrl ||
                                  "https://via.placeholder.com/240x360"
                                }
                                alt={movie.title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />

                              {/* Nhãn giới hạn độ tuổi ở góc trái Poster */}
                              <div className="absolute top-2 left-2 z-40">
                                <Tag
                                  color={
                                    movie.ageRestriction === "P"
                                      ? "green"
                                      : "orange"
                                  }
                                  className="!m-0 font-bold border-none px-1.5 min-w-[24px] text-center shadow-sm"
                                >
                                  {movie.ageRestriction || "P"}
                                </Tag>
                              </div>

                              {/* Lớp phủ Gradient gốc (hiện khi KHÔNG hover) */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-3 z-20 transition-opacity duration-300 group-hover:opacity-0 pointer-events-none flex flex-col justify-end">
                                <div className="text-white font-bold text-sm uppercase line-clamp-2 leading-tight">
                                  {movie.title}
                                </div>
                                <div className="text-white/80 text-[10px] mt-1">
                                  {movie.genre}
                                </div>
                              </div>

                              {/* 🔥 LỚP PHỦ HOVER (Chứa nút bấm, hiện ra khi ĐƯA CHUỘT VÀO) */}
                              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 p-4 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                {/* NÚT TRAILER */}
                                <div className="w-full pointer-events-auto">
                                  <Button
                                    block
                                    size="small"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (movie.trailerUrl) {
                                        setCurrentTrailerUrl(movie.trailerUrl);
                                        setIsTrailerModalOpen(true);
                                      } else {
                                        Modal.warning({
                                          title: "Thông báo",
                                          content:
                                            "Trailer phim đang được cập nhật!",
                                        });
                                      }
                                    }}
                                    className="border-white text-white hover:border-[#f0dfb1] hover:text-[#f0dfb1] rounded-full bg-transparent"
                                  >
                                    Trailer
                                  </Button>
                                </div>

                                {/* NÚT ĐẶT VÉ TRÊN ẢNH */}
                                <div className="w-full pointer-events-auto">
                                  <Button
                                    block
                                    size="small"
                                    type="primary"
                                    danger
                                    className="rounded-full font-bold !bg-[#a61d24] !border-[#a61d24]"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleOpenBookingModal(movie);
                                    }}
                                  >
                                    {locale === "vi" ? "Đặt vé" : "Book"}
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {/* KHU VỰC TEXT BÊN DƯỚI */}
                            <div className="p-3 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="text-[11px] text-gray-500 mb-1">
                                  {dayjs(movie.releaseDate).format(
                                    "YYYY-MM-DD",
                                  )}{" "}
                                  | {movie.durationMin}{" "}
                                  {locale === "vi" ? "phút" : "mins"}
                                </div>

                                <div className="mt-1 mb-3 flex flex-wrap gap-1">
                                  <span className="text-[10px] text-yellow-600 font-bold border border-yellow-500 rounded px-1">
                                    2D
                                  </span>
                                  {movie.format &&
                                    movie.format.includes("IMAX") && (
                                      <span className="text-[10px] text-yellow-600 font-bold border border-yellow-500 rounded px-1">
                                        IMAX
                                      </span>
                                    )}
                                </div>
                              </div>

                              <div className="mt-auto">
                                <Link
                                  href={localizeHref(
                                    `/phim/${movie.slug || movie.id}`,
                                    locale,
                                  )}
                                  className="w-full block"
                                >
                                  <Button
                                    block
                                    className="rounded-full text-xs font-semibold h-[32px] border-gray-300 text-gray-700 hover:text-black hover:border-black"
                                  >
                                    {locale === "vi"
                                      ? "Chi tiết phim"
                                      : "Details"}
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>
                </Col>
              </Row>
            </div>
          ) : (
            <Row gutter={[32, 24]}>
              {/* CỘT TRÁI: PHIM & REVIEW */}
              <Col xs={24} lg={16}>
                <Title
                  level={3}
                  className="!text-[#a61d24] mb-6 border-b-2 border-[#a61d24] pb-2 inline-block"
                >
                  <FireOutlined className="mr-2" />{" "}
                  {locale === "vi" ? "Đánh Giá Phim (Review)" : "Movie Reviews"}
                </Title>

                {loading ? (
                  <Skeleton active avatar paragraph={{ rows: 4 }} />
                ) : (
                  <List
                    itemLayout="vertical"
                    size="large"
                    dataSource={movies}
                    renderItem={(movie) => (
                      <Card className="mb-6 rounded-[20px] shadow-sm border border-[#e4d1b4] overflow-hidden">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="w-full md:w-[220px] shrink-0">
                            <img
                              src={
                                movie.posterUrl ||
                                "https://via.placeholder.com/220x330"
                              }
                              alt={movie.title}
                              className="w-full h-[330px] object-cover rounded-xl shadow-md"
                            />
                          </div>

                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <Title
                                  level={4}
                                  className="!m-0 !text-[#4a3426]"
                                >
                                  {movie.title}
                                </Title>
                                <Tag
                                  color={
                                    movie.status === "NOW_SHOWING"
                                      ? "green"
                                      : "gold"
                                  }
                                >
                                  {movie.status === "NOW_SHOWING"
                                    ? locale === "vi"
                                      ? "Đang chiếu"
                                      : "Now Showing"
                                    : locale === "vi"
                                      ? "Sắp chiếu"
                                      : "Coming Soon"}
                                </Tag>
                              </div>

                              <Space wrap className="mb-3">
                                <Tag color="red">
                                  {movie.ageRestriction || "C13"}
                                </Tag>
                                <Tag>{movie.genre}</Tag>
                                <Text type="secondary">
                                  <ClockCircleOutlined /> {movie.durationMin}{" "}
                                  {locale === "vi" ? "phút" : "mins"}
                                </Text>
                              </Space>

                              <Paragraph className="text-gray-600 line-clamp-3">
                                {movie.description ||
                                  (locale === "vi"
                                    ? "Chưa có mô tả cho phim này..."
                                    : "No description available...")}
                              </Paragraph>

                              <div className="flex items-center gap-3 bg-[#fffaf4] p-3 rounded-lg border border-[#f0e6d2]">
                                <Text className="font-bold text-lg text-[#a61d24]">
                                  {movieStats[movie.id]?.averageRating?.toFixed(
                                    1,
                                  ) || "0.0"}
                                </Text>
                                <Rate
                                  allowHalf
                                  disabled
                                  value={
                                    movieStats[movie.id]?.averageRating || 0
                                  }
                                />
                                <Text type="secondary" className="text-xs">
                                  ({movieStats[movie.id]?.totalReviews || 0}{" "}
                                  {locale === "vi" ? "đánh giá" : "reviews"})
                                </Text>
                              </div>
                            </div>

                            <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
                              <Button
                                type="text"
                                icon={
                                  movieReactions[movie.id]?.likedByMe ? (
                                    <LikeFilled />
                                  ) : (
                                    <LikeOutlined />
                                  )
                                }
                                className={
                                  movieReactions[movie.id]?.likedByMe
                                    ? "text-black font-bold"
                                    : "text-gray-600"
                                }
                                onClick={() =>
                                  handleMovieReaction(movie.id, true)
                                }
                              >
                                {movieReactions[movie.id]?.likeCount || 0}
                              </Button>

                              <Button
                                type="text"
                                icon={
                                  movieReactions[movie.id]?.dislikedByMe ? (
                                    <DislikeFilled />
                                  ) : (
                                    <DislikeOutlined />
                                  )
                                }
                                className={
                                  movieReactions[movie.id]?.dislikedByMe
                                    ? "text-black font-bold"
                                    : "text-gray-600"
                                }
                                onClick={() =>
                                  handleMovieReaction(movie.id, false)
                                }
                              >
                                {movieReactions[movie.id]?.dislikeCount || 0}
                              </Button>

                              <Button
                                type={
                                  expandedMovieId === movie.id
                                    ? "primary"
                                    : "default"
                                }
                                danger={expandedMovieId === movie.id}
                                icon={<MessageOutlined />}
                                className="ml-auto font-semibold rounded-full px-6"
                                onClick={() => handleToggleComments(movie.id)}
                              >
                                {expandedMovieId === movie.id
                                  ? locale === "vi"
                                    ? "Đóng bình luận"
                                    : "Hide Comments"
                                  : locale === "vi"
                                    ? "Xem bình luận"
                                    : "View Comments"}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* KHU VỰC BÌNH LUẬN MỞ RỘNG */}
                        {expandedMovieId === movie.id && (
                          <div className="mt-6 pt-4 border-t-2 border-gray-100 bg-gray-50/50 -mx-6 px-6 pb-2">
                            <Title level={5} className="!text-[#4a3426] mb-4">
                              {locale === "vi"
                                ? "Bình luận của khán giả"
                                : "Audience Comments"}
                            </Title>

                            <div className="mb-5 rounded-xl border border-[#ead6bb] bg-white p-4">
                              <div className="flex items-center gap-4 mb-3">
                                <Text strong>
                                  {locale === "vi"
                                    ? "Viết đánh giá của bạn"
                                    : "Write your review"}
                                </Text>

                                <Rate
                                  value={
                                    reviewDrafts[movie.id]?.ratingScore || 0
                                  }
                                  onChange={(value) =>
                                    setReviewDrafts((prev) => ({
                                      ...prev,
                                      [movie.id]: {
                                        ...prev[movie.id],
                                        ratingScore: value,
                                        comment: prev[movie.id]?.comment || "",
                                      },
                                    }))
                                  }
                                />
                              </div>

                              <Input.TextArea
                                className="mt-3"
                                rows={3}
                                placeholder={
                                  locale === "vi"
                                    ? "Nhập bình luận của bạn..."
                                    : "Write your comment..."
                                }
                                value={reviewDrafts[movie.id]?.comment || ""}
                                onChange={(e) =>
                                  setReviewDrafts((prev) => ({
                                    ...prev,
                                    [movie.id]: {
                                      ratingScore:
                                        prev[movie.id]?.ratingScore || 0,
                                      comment: e.target.value,
                                    },
                                  }))
                                }
                              />

                              <div className="mt-5">
                                <Button
                                  type="primary"
                                  danger
                                  className="rounded-full font-semibold px-6"
                                  onClick={() => handleSubmitReview(movie.id)}
                                >
                                  {locale === "vi"
                                    ? "Gửi đánh giá"
                                    : "Submit review"}
                                </Button>
                              </div>
                            </div>

                            {loadingReviews ? (
                              <Skeleton active avatar paragraph={{ rows: 2 }} />
                            ) : (
                              <List
                                dataSource={movieReviews[movie.id] || []}
                                locale={{
                                  emptyText:
                                    locale === "vi"
                                      ? "Chưa có đánh giá nào."
                                      : "No reviews yet.",
                                }}
                                renderItem={(review: any) => (
                                  <List.Item className="border-b border-gray-200 last:border-0 py-4">
                                    <List.Item.Meta
                                      avatar={
                                        <Avatar src={review.customerAvatar}>
                                          {!review.customerAvatar
                                            ? review.customerName
                                                ?.charAt(0)
                                                ?.toUpperCase()
                                            : null}
                                        </Avatar>
                                      }
                                      title={
                                        <div className="flex flex-wrap items-center gap-4">
                                          <Text strong>
                                            {review.customerName ||
                                              (locale === "vi"
                                                ? "Ẩn danh"
                                                : "Anonymous")}
                                          </Text>

                                          <Rate
                                            disabled
                                            value={review.ratingScore}
                                            className="text-sm"
                                          />

                                          <Text
                                            type="secondary"
                                            className="text-xs"
                                          >
                                            {dayjs(review.postDate).fromNow()}
                                          </Text>
                                        </div>
                                      }
                                      description={
                                        <div className="mt-1">
                                          <Text className="text-gray-700">
                                            {review.comment}
                                          </Text>
                                          <div className="flex gap-2 mt-2">
                                            <Button
                                              type="text"
                                              size="small"
                                              icon={<LikeOutlined />}
                                              className={`text-xs ${
                                                review.isLikedByMe
                                                  ? "text-blue-600 font-bold"
                                                  : "text-gray-500"
                                              }`}
                                              onClick={() =>
                                                handleReaction(
                                                  review.id,
                                                  movie.id,
                                                  true,
                                                )
                                              }
                                            >
                                              {review.likeCount || 0}
                                            </Button>

                                            <Button
                                              type="text"
                                              size="small"
                                              icon={<DislikeOutlined />}
                                              className={`text-xs ${
                                                review.isDislikedByMe
                                                  ? "text-red-600 font-bold"
                                                  : "text-gray-500"
                                              }`}
                                              onClick={() =>
                                                handleReaction(
                                                  review.id,
                                                  movie.id,
                                                  false,
                                                )
                                              }
                                            >
                                              {review.dislikeCount || 0}
                                            </Button>
                                          </div>
                                        </div>
                                      }
                                    />
                                  </List.Item>
                                )}
                              />
                            )}
                          </div>
                        )}
                      </Card>
                    )}
                  />
                )}
              </Col>

              {/* CỘT PHẢI: TIN TỨC ĐƯỢC CHIA TABS */}
              <Col xs={24} lg={8}>
                <div className="sticky top-24">
                  <div className="flex items-center justify-between mb-4">
                    <Title
                      level={4}
                      className="!text-[#4a3426] !mb-0 border-b-2 border-[#e4d1b4] pb-2 inline-block"
                    >
                      {locale === "vi" ? "Bản Tin KCT" : "KCT Bulletin"}
                    </Title>

                    {role === "admin" && (
                      <Button
                        type="primary"
                        danger
                        className="rounded-full"
                        onClick={() => openArticleEditor("create")}
                      >
                        {locale === "vi" ? "Thêm tin tức" : "Add News"}
                      </Button>
                    )}
                  </div>

                  {/* 🔥 TABS CHO 3 MỤC NHỎ */}
                  <Tabs
                    activeKey={activeArticleTab}
                    onChange={setActiveArticleTab}
                    className="mb-4"
                    items={[
                      {
                        key: "NEWS",
                        label: locale === "vi" ? "Tin tức điện ảnh" : "News",
                      },
                      {
                        key: "PROMOTION",
                        label: locale === "vi" ? "Khuyến mãi" : "Promotions",
                      },
                      {
                        key: "NOTICE",
                        label: locale === "vi" ? "Thông báo" : "Notices",
                      },
                    ]}
                  />

                  {loading ? (
                    <Skeleton active paragraph={{ rows: 6 }} />
                  ) : filteredArticles.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                      {locale === "vi"
                        ? "Hiện chưa có bài viết nào."
                        : "No articles available."}
                    </div>
                  ) : (
                    <List
                      itemLayout="vertical"
                      dataSource={filteredArticles}
                      pagination={{
                        pageSize: 4,
                        size: "small",
                        align: "center",
                      }}
                      renderItem={(article) => (
                        <Card
                          hoverable
                          onClick={() => setSelectedArticle(article)}
                          className="!mb-4 rounded-xl border-none shadow-sm overflow-hidden group cursor-pointer"
                          bodyStyle={{ padding: 0 }}
                        >
                          <div className="flex flex-col">
                            <div className="relative h-[160px] overflow-hidden bg-gray-100">
                              <img
                                src={
                                  article.thumbnailUrl ||
                                  "https://via.placeholder.com/400x200?text=News"
                                }
                                alt={article.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded text-xs">
                                {dayjs(article.publishDate).format(
                                  "DD/MM/YYYY",
                                )}
                              </div>
                            </div>

                            <div className="p-4 bg-white">
                              <Text
                                strong
                                className="text-base line-clamp-2 mb-2 group-hover:text-[#a61d24] transition-colors"
                              >
                                {article.title}
                              </Text>

                              <Paragraph
                                type="secondary"
                                className="text-xs line-clamp-2 !m-0"
                              >
                                {article.summary}
                              </Paragraph>

                              {role === "admin" && (
                                <div className="mt-3 flex gap-2">
                                  <Button
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openArticleEditor("edit", article);
                                    }}
                                  >
                                    Sửa
                                  </Button>

                                  <Popconfirm
                                    title="Xóa bài viết này?"
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                    onConfirm={() => deleteArticle(article.id)}
                                  >
                                    <Button
                                      size="small"
                                      danger
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Xóa
                                    </Button>
                                  </Popconfirm>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      )}
                    />
                  )}
                </div>
              </Col>
            </Row>
          )}
        </main>
      </SiteShell>
      <Modal
        open={articleModal.open}
        title={articleModal.mode === "edit" ? "Sửa bài viết" : "Thêm bài viết"}
        onCancel={() => setArticleModal({ open: false, mode: "create" })}
        onOk={saveArticle}
        confirmLoading={submittingArticle}
        okText="Lưu"
        cancelText="Hủy"
        width={720}
      >
        <Form form={articleForm} layout="vertical">
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="thumbnailUrl" label="Ảnh thumbnail URL">
            <Input />
          </Form.Item>

          <Form.Item
            name="summary"
            label="Tóm tắt"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={5} />
          </Form.Item>

          <Form.Item name="type" label="Loại bài" rules={[{ required: true }]}>
            <Select
              options={[
                { label: "Tin tức", value: "NEWS" },
                { label: "Khuyến mãi", value: "PROMOTION" },
                { label: "Thông báo", value: "NOTICE" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { label: "Xuất bản", value: "PUBLISHED" },
                { label: "Bản nháp", value: "DRAFT" },
                { label: "Ẩn", value: "HIDDEN" },
              ]}
            />
          </Form.Item>

          <Form.Item name="featured" label="Hiển thị nổi bật">
            <Select
              options={[
                { label: "Có", value: true },
                { label: "Không", value: false },
              ]}
            />
          </Form.Item>

          <Form.Item name="authorName" label="Tác giả / nguồn">
            <Input />
          </Form.Item>

          <Form.Item name="movieId" label="ID phim liên quan">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
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
          />
        </div>
      </Modal>

      <Modal
        open={isBookingModalVisible}
        onCancel={() => setIsBookingModalVisible(false)}
        footer={null}
        width={900}
        destroyOnClose
        centered
      >
        {selectedMovieForBooking && (
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <img
              src={selectedMovieForBooking.posterUrl}
              alt={selectedMovieForBooking.title}
              className="w-32 rounded-lg shadow-md hidden md:block object-cover aspect-[2/3]"
            />

            <div>
              <Title
                level={3}
                style={{
                  color: "#a61d24",
                  margin: 0,
                  textTransform: "uppercase",
                }}
              >
                {selectedMovieForBooking.title}
              </Title>

              <p className="text-gray-500 mt-2 text-sm">
                <ClockCircleOutlined className="mr-1" />
                {selectedMovieForBooking.durationMin} phút | Thể loại:{" "}
                {selectedMovieForBooking.genre}
              </p>
            </div>
          </div>
        )}

        {isLoadingBookingData ? (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex overflow-x-auto gap-3 justify-start mb-6 pb-2">
              {generateDates().map((dateObj) => {
                const isActive = selectedDate === dateObj.iso;

                return (
                  <button
                    key={dateObj.iso}
                    onClick={() => setSelectedDate(dateObj.iso)}
                    className={`shrink-0 min-w-[100px] px-3 py-2 border rounded-lg flex flex-col items-center justify-center transition-all ${
                      isActive
                        ? "bg-[#a61d24] text-white border-[#a61d24] shadow-md -translate-y-1"
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

            {getGroupedShowtimes().length === 0 ? (
              <div className="text-center py-10 bg-white rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">
                  Không có suất chiếu nào được lên lịch vào ngày này.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {getGroupedShowtimes().map((group) => (
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
                      {group.showtimes.map((st: any) => (
                        <Link
                          href={localizeHref(`/dat-ve/${st.id}`, locale)}
                          key={st.id}
                        >
                          <button className="border border-gray-300 rounded-lg px-5 py-2 hover:border-[#a61d24] hover:bg-red-50 transition-colors flex flex-col items-center group">
                            <span className="font-bold text-lg text-gray-800 group-hover:text-[#a61d24]">
                              {dayjs(st.startTime).format("HH:mm")}
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
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

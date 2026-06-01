"use client";

import React, { useState, useEffect } from "react";
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
} from "antd";
import {
  LikeOutlined,
  LikeFilled,
  DislikeOutlined,
  DislikeFilled,
  MessageOutlined,
  ClockCircleOutlined,
  FireOutlined,
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

const { Title, Text, Paragraph } = Typography;

export function CultureplexUI() {
  const { token } = useAuthSession();
  const { message } = App.useApp();
  const locale = useLocale(); // "vi" hoặc "en"

  // Tự động đổi ngôn ngữ hiển thị thời gian ("2 giờ trước" <-> "2 hours ago")
  dayjs.locale(locale);

  const [movies, setMovies] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [expandedMovieId, setExpandedMovieId] = useState<string | null>(null);
  const [movieReviews, setMovieReviews] = useState<Record<string, any[]>>({});
  const [movieStats, setMovieStats] = useState<Record<string, any>>({});
  const [movieReactions, setMovieReactions] = useState<Record<string, any>>({});
  const [reviewDrafts, setReviewDrafts] = useState<
    Record<string, { ratingScore: number; comment: string }>
  >({});
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const movieRes = await fetch("http://localhost:9090/cinema/movies");
        const movieData = await movieRes.json();

        const articleRes = await fetch(
          "http://localhost:9090/cinema/articles?type=NEWS",
        );
        const articleData = await articleRes.json();

        if (movieData.code === 1000) {
          setMovies(movieData.result);

          const statsResult: Record<string, any> = {};
          const reactionResult: Record<string, any> = {};

          await Promise.all(
            movieData.result.map(async (movie: any) => {
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
        if (articleData.code === 1000) setArticles(articleData.result);
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

    const data = await res.json();

    if (data.code === 1000) {
      setMovieReactions((prev) => ({
        ...prev,
        [movieId]: data.result,
      }));
    }
  };

  return (
    <div className="cinema-page bg-[#f5efe5] min-h-screen">
      <SiteShell>
        <main className="cinema-shell px-4 py-8 sm:px-6 max-w-[1400px] mx-auto">
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
                              <Title level={4} className="!m-0 !text-[#4a3426]">
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
                                value={movieStats[movie.id]?.averageRating || 0}
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
                                value={reviewDrafts[movie.id]?.ratingScore || 0}
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

            {/* CỘT PHẢI: TIN TỨC */}
            <Col xs={24} lg={8}>
              <div className="sticky top-24">
                <Title
                  level={4}
                  className="!text-[#4a3426] mb-4 border-b-2 border-[#e4d1b4] pb-2 inline-block"
                >
                  {locale === "vi" ? "Tin Tức Điện Ảnh" : "Cinema News"}
                </Title>

                {loading ? (
                  <Skeleton active paragraph={{ rows: 6 }} />
                ) : (
                  <List
                    itemLayout="vertical"
                    dataSource={articles}
                    renderItem={(article) => (
                      <Card
                        hoverable
                        className="mb-4 rounded-xl border-none shadow-sm overflow-hidden group cursor-pointer"
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
                              {dayjs(article.publishDate).format("DD/MM/YYYY")}
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
                          </div>
                        </div>
                      </Card>
                    )}
                  />
                )}
              </div>
            </Col>
          </Row>
        </main>
      </SiteShell>
    </div>
  );
}

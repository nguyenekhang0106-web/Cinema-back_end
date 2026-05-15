"use client";

import { Card, Tabs, Empty, Typography, ConfigProvider } from "antd";
import { useEffect, useState } from "react";
import { MovieGrid } from "../components/movie-grid";
import { useDictionary, useLocale } from "../components/locale-provider";
import { SiteShell } from "../components/site-shell";
import { type MovieItem } from "../data/cgv-template";
import { getMoviesWithFallback } from "../lib/cinema-api";

export default function MoviesPage() {
  const locale = useLocale();
  const dictionary = useDictionary();
  const [movies, setMovies] = useState<MovieItem[]>([]);

  useEffect(() => {
    let mounted = true;
    getMoviesWithFallback(locale).then((items) => {
      if (mounted) setMovies(items);
    });
    return () => {
      mounted = false;
    };
  }, [locale]);

  // 🔥 ĐÃ SỬA: Lọc chính xác bằng trường 'status' của DB, loại bỏ lỗi chuỗi Tiếng Việt có dấu
  const nowShowingMovies = movies.filter(
    (movie) => movie.status === "NOW_SHOWING",
  );

  const upcomingMovies = movies.filter(
    (movie) => movie.status === "COMING_SOON",
  );

  const tabItems = [
    {
      key: "now",
      label: dictionary.home.nowShowing,
      children:
        nowShowingMovies.length > 0 ? (
          <MovieGrid movies={nowShowingMovies} showBooking={true} />
        ) : (
          <Empty
            description="Hiện không có phim đang chiếu"
            className="my-10"
          />
        ),
    },
    {
      key: "upcoming",
      label: dictionary.home.comingSoon,
      children:
        upcomingMovies.length > 0 ? (
          <MovieGrid movies={upcomingMovies} showBooking={false} />
        ) : (
          <Empty description="Hiện không có phim sắp chiếu" className="my-10" />
        ),
    },
  ];

  return (
    <div className="cinema-page">
      <SiteShell>
        <main className="cinema-shell px-4 py-8 sm:px-6">
          {/* 🔥 TIÊU ĐỀ "PHIM" VỚI HIỆU ỨNG VẠCH ĐỎ ĐỒNG BỘ TRANG CHỦ 🔥 */}
          <div
            className="mb-10 mt-4"
            style={{ borderLeft: "5px solid #a61d24", paddingLeft: "18px" }}
          >
            <Typography.Title
              level={1}
              style={{
                margin: 0,
                color: "#4a3426",
                textTransform: "uppercase",
                fontSize: "2.5rem",
                lineHeight: "1.2",
                fontWeight: 800,
              }}
            >
              {locale === "vi" ? "PHIM" : "MOVIES"}
            </Typography.Title>

            {/* Thanh gạch dưới chân có hiệu ứng mờ dần (Gradient) */}
            <div
              style={{
                height: "4px",
                width: "150px",
                background:
                  "linear-gradient(90deg, #a61d24 0%, rgba(166, 29, 36, 0) 100%)",
                marginTop: "4px",
              }}
            ></div>
          </div>

          {/* KHUNG TRẮNG CHỨA TAB VÀ DANH SÁCH PHIM */}
          <Card
            bordered={false}
            className="cinema-paper rounded-[28px]"
            styles={{ body: { padding: "24px" } }}
          >
            <ConfigProvider
              theme={{
                components: {
                  Tabs: {
                    itemSelectedColor: "#a61d24",
                    itemHoverColor: "#a61d24",
                    itemActiveColor: "#a61d24",
                    inkBarColor: "#a61d24",
                  },
                },
              }}
            >
              <Tabs
                items={tabItems}
                size="large"
                tabBarStyle={{
                  marginBottom: 24,
                  fontWeight: 600,
                  fontSize: "18px",
                }}
              />
            </ConfigProvider>
          </Card>
        </main>
      </SiteShell>
    </div>
  );
}

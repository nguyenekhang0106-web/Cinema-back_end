"use client";

import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  FireOutlined,
  GiftOutlined,
  StarFilled,
  TrophyOutlined,
} from "@ant-design/icons";
// THÊM Import Carousel từ antd vào đây
import {
  Button,
  Card,
  Col,
  Empty,
  List,
  Row,
  Space,
  Tabs,
  Tag,
  Typography,
  Carousel,
} from "antd";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type MovieItem } from "../data/cgv-template";
import { getMoviesWithFallback } from "../lib/cinema-api";
import {
  getLocalizedCinemas,
  getLocalizedPromotions,
} from "../lib/localized-data";
import { localizeHref } from "../lib/i18n";
import { useDictionary, useLocale } from "./locale-provider";
import { MovieGrid } from "./movie-grid";
import { QuickBookingPanel } from "./quick-booking-panel";
import { SiteShell } from "./site-shell";
import { TemplatePage } from "./template-page";

function HeroSection() {
  const locale = useLocale();
  const dictionary = useDictionary();

  const banners = [
    {
      id: "hero-1",
      title:
        locale === "vi"
          ? "Giao diện đặt vé KCT Cinema đã sẵn sàng để nối dữ liệu thật từ back-end"
          : "The KCT Cinema booking UI is ready for real data from your back-end",
      subtitle:
        locale === "vi"
          ? "Bạn có thể nối phim nổi bật, lịch chiếu, ghế và đơn hàng bằng API Java mà không cần đổi lại bố cục."
          : "You can plug featured movies, showtimes, seats, and orders into this layout through your Java API without redesigning the screens.",
      image:
        "https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
      id: "hero-2",
      title:
        locale === "vi"
          ? "Song ngữ Việt - Anh đã được tách riêng để bạn triển khai nội dung dễ hơn"
          : "Vietnamese and English are now separated for easier content delivery",
      subtitle:
        locale === "vi"
          ? "Route tiếng Việt giữ nguyên, còn bản tiếng Anh chạy dưới /en để phù hợp triển khai thực tế."
          : "Vietnamese routes stay intact, while the English experience runs under /en for a production-friendly structure.",
      image:
        "https://images.pexels.com/photos/274937/pexels-photo-274937.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
  ];

  return (
    <section className="pt-6">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Space direction="vertical" size={24} className="w-full">
            {banners.map((banner) => (
              <Card
                key={banner.id}
                bordered={false}
                className="cinema-hero-banner overflow-hidden rounded-[28px]"
                styles={{ body: { padding: 0 } }}
              >
                <div className="grid min-h-[340px] gap-6 px-8 py-8 text-white md:grid-cols-[1.05fr_0.95fr] md:items-center sm:px-10">
                  <div className="space-y-5">
                    <Space wrap>
                      <Tag color="gold">KCT Cinema</Tag>
                      <Tag color="red">Frontend ready</Tag>
                    </Space>
                    <Typography.Title
                      level={1}
                      style={{
                        color: "#fff",
                        marginBottom: 0,
                        lineHeight: 1.06,
                      }}
                    >
                      {banner.title}
                    </Typography.Title>
                    <Typography.Paragraph
                      style={{
                        color: "rgba(255,255,255,0.86)",
                        fontSize: 16,
                        maxWidth: 560,
                        marginBottom: 0,
                      }}
                    >
                      {banner.subtitle}
                    </Typography.Paragraph>
                    <Space wrap>
                      <Link href={localizeHref("/phim", locale)}>
                        <Button size="large" type="primary">
                          {dictionary.home.allMovies}
                        </Button>
                      </Link>
                      <Link href={localizeHref("/dang-nhap", locale)}>
                        <Button size="large" ghost>
                          {dictionary.header.login}
                        </Button>
                      </Link>
                    </Space>
                  </div>
                  <div className="relative min-h-[260px] overflow-hidden rounded-[24px] border border-white/16">
                    <Image
                      src={banner.image}
                      alt={banner.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        </Col>
        <Col xs={24} lg={8}>
          <Space direction="vertical" size={16} className="w-full">
            <QuickBookingPanel />
            <Card
              bordered={false}
              className="cinema-mini-banner rounded-[24px]"
              styles={{ body: { padding: 22 } }}
            >
              <Space direction="vertical" size={12} className="w-full">
                <Tag color="red">{dictionary.home.loginRegister}</Tag>
                <Typography.Title
                  level={4}
                  style={{ margin: 0, color: "#4a3426" }}
                >
                  {dictionary.home.clubAccountTitle}
                </Typography.Title>
                <Typography.Paragraph style={{ margin: 0, color: "#6d5a46" }}>
                  {dictionary.home.clubAccountDescription}
                </Typography.Paragraph>
                <Space wrap>
                  <Link href={localizeHref("/dang-nhap", locale)}>
                    <Button type="primary">{dictionary.header.login}</Button>
                  </Link>
                  <Link href={localizeHref("/dang-ky", locale)}>
                    <Button>{dictionary.header.register}</Button>
                  </Link>
                </Space>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </section>
  );
}

function MovieTabsSection() {
  const locale = useLocale();
  const dictionary = useDictionary();
  const [movies, setMovies] = useState<MovieItem[]>([]);

  useEffect(() => {
    let mounted = true;

    getMoviesWithFallback(locale).then((items) => {
      if (mounted) {
        setMovies(items);
      }
    });

    return () => {
      mounted = false;
    };
  }, [locale]);

  const nowShowingMovies = movies.filter(
    (movie) =>
      movie.bookingLabel.toLowerCase().includes("showing") ||
      movie.bookingLabel.toLowerCase().includes("chieu"),
  );
  const upcomingMovies = movies.filter(
    (movie) => !nowShowingMovies.includes(movie),
  );

  const tabItems = [
    {
      key: "now",
      label: dictionary.home.nowShowing,
      children:
        nowShowingMovies.length > 0 ? (
          <MovieGrid movies={nowShowingMovies} />
        ) : (
          <MovieFeedEmpty />
        ),
    },
    {
      key: "upcoming",
      label: dictionary.home.comingSoon,
      children:
        upcomingMovies.length > 0 ? (
          <MovieGrid movies={upcomingMovies} />
        ) : (
          <MovieFeedEmpty />
        ),
    },
  ];

  return (
    <section className="mt-10">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Typography.Title
            level={2}
            className="cinema-section-title"
            style={{ margin: 0, color: "#4a3426" }}
          >
            {dictionary.home.movieSectionTitle}
          </Typography.Title>
          <Typography.Paragraph style={{ color: "#6d5a46", marginTop: 16 }}>
            {dictionary.home.movieSectionDescription}
          </Typography.Paragraph>
        </div>
        <Space wrap>
          <Tag color="red">{dictionary.home.movieTags[0]}</Tag>
          <Tag color="gold">{dictionary.home.movieTags[1]}</Tag>
          <Tag color="blue">{dictionary.home.movieTags[2]}</Tag>
        </Space>
      </div>
      <Card bordered={false} className="cinema-paper rounded-[28px]">
        <Tabs items={tabItems} />
      </Card>
    </section>
  );
}

function MovieFeedEmpty() {
  const dictionary = useDictionary();

  return (
    <div className="rounded-[22px] border border-dashed border-[#d7c0a0] bg-[#fffaf4] p-8">
      <Empty
        description={
          <Space direction="vertical" size={6}>
            <Typography.Text strong>
              {dictionary.home.movieFeedTitle}
            </Typography.Text>
            <Typography.Text style={{ color: "#6d5a46" }}>
              {dictionary.home.movieFeedDescription}
            </Typography.Text>
          </Space>
        }
      />
    </div>
  );
}

function CinemaAndPromoSection() {
  const locale = useLocale();
  const dictionary = useDictionary();
  const cinemas = getLocalizedCinemas(locale);
  const promotions = getLocalizedPromotions(locale);

  return (
    <section className="mt-10">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={15}>
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
                <Typography.Paragraph
                  style={{ color: "#6d5a46", marginTop: 16 }}
                >
                  {dictionary.home.cinemaDescription}
                </Typography.Paragraph>
              </div>
              <Tag color="gold">KCT locations</Tag>
            </div>

            <List
              itemLayout="vertical"
              dataSource={cinemas}
              renderItem={(cinema) => (
                <List.Item key={cinema.id}>
                  <Card
                    bordered
                    style={{ borderColor: "#ead8c1", background: "#fffaf4" }}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <Space wrap size={10}>
                          <Typography.Title
                            level={4}
                            style={{ margin: 0, color: "#4a3426" }}
                          >
                            {cinema.name}
                          </Typography.Title>
                          <Tag color="red">
                            <EnvironmentOutlined /> {cinema.area}
                          </Tag>
                        </Space>
                        <Typography.Paragraph
                          style={{ margin: "8px 0 0", color: "#6d5a46" }}
                        >
                          {cinema.address}
                        </Typography.Paragraph>
                        <Space wrap className="mt-1">
                          {cinema.features.map((feature) => (
                            <Tag key={feature} color="gold">
                              {feature}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                      <Space wrap>
                        {cinema.showtimes.slice(0, 4).map((time) => (
                          <Button key={time} disabled>
                            {time}
                          </Button>
                        ))}
                      </Space>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Space direction="vertical" size={24} className="w-full">
            <Card bordered={false} className="cinema-paper rounded-[28px]">
              <Typography.Title
                level={2}
                className="cinema-section-title"
                style={{ margin: 0, color: "#4a3426" }}
              >
                {dictionary.home.promoTitle}
              </Typography.Title>
              <List
                className="mt-5"
                dataSource={promotions}
                renderItem={(promotion) => (
                  <List.Item key={promotion.id}>
                    <Card
                      bordered
                      size="small"
                      style={{
                        width: "100%",
                        borderColor: "#ead8c1",
                        background:
                          "linear-gradient(135deg, rgba(200,154,43,0.12), rgba(166,29,36,0.04))",
                      }}
                    >
                      <Space align="start">
                        <GiftOutlined
                          style={{ fontSize: 22, color: "#a61d24" }}
                        />
                        <div>
                          <Typography.Title
                            level={5}
                            style={{ margin: 0, color: "#4a3426" }}
                          >
                            {promotion.title}
                          </Typography.Title>
                          <Typography.Paragraph
                            style={{ margin: "6px 0 0", color: "#6d5a46" }}
                          >
                            {promotion.description}
                          </Typography.Paragraph>
                        </div>
                      </Space>
                    </Card>
                  </List.Item>
                )}
              />
            </Card>

            <Card bordered={false} className="cinema-paper rounded-[28px]">
              <Typography.Title
                level={4}
                style={{ marginTop: 0, color: "#4a3426" }}
              >
                {dictionary.home.sitePartsTitle}
              </Typography.Title>
              <List
                dataSource={dictionary.home.siteParts}
                renderItem={(item) => (
                  <List.Item>
                    <Space>
                      <TrophyOutlined style={{ color: "#c89a2b" }} />
                      <Typography.Text>{item}</Typography.Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          </Space>
        </Col>
      </Row>
    </section>
  );
}

function NewsStrip() {
  const dictionary = useDictionary();

  return (
    <section className="mt-10">
      <Card bordered={false} className="cinema-paper rounded-[28px]">
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} md={8}>
            <Typography.Title level={3} style={{ margin: 0, color: "#4a3426" }}>
              {dictionary.home.newsTitle}
            </Typography.Title>
            <Typography.Paragraph style={{ marginTop: 10, color: "#6d5a46" }}>
              {dictionary.home.newsDescription}
            </Typography.Paragraph>
          </Col>
          <Col xs={24} md={16}>
            <Row gutter={[16, 16]}>
              {dictionary.home.newsItems.map((item, index) => (
                <Col xs={24} md={8} key={item.key}>
                  <Card
                    bordered
                    style={{
                      height: "100%",
                      borderColor: "#ead8c1",
                      background: "#fffaf4",
                    }}
                  >
                    <Space direction="vertical" size={10}>
                      {index === 0 ? (
                        <FireOutlined style={{ color: "#a61d24" }} />
                      ) : index === 1 ? (
                        <ClockCircleOutlined style={{ color: "#a61d24" }} />
                      ) : (
                        <StarFilled style={{ color: "#c89a2b" }} />
                      )}
                      <Typography.Title level={5} style={{ margin: 0 }}>
                        {item.title}
                      </Typography.Title>
                      <Typography.Text style={{ color: "#6d5a46" }}>
                        {item.desc}
                      </Typography.Text>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Card>
    </section>
  );
}

// === MAIN COMPONENT ===
export function CgvHomePage() {
  return (
    <div className="cinema-page">
      <SiteShell>
        {/* KHỐI CAROUSEL BANNER ĐƯỢC CHÈN VÀO ĐÂY */}
        <div className="w-full">
          {/* Thêm arrows={true} để hiện mũi tên Next/Prev giống Metiz */}
          <Carousel autoplay effect="fade" arrows={true}>
            <div className="relative h-[300px] md:h-[450px] w-full focus:outline-none">
              <img
                // Đã đổi sang link ảnh Unsplash để chắc chắn load được trên localhost
                src="https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=2070&auto=format&fit=crop"
                alt="Banner 1"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative h-[300px] md:h-[450px] w-full focus:outline-none">
              <img
                src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1925&auto=format&fit=crop"
                alt="Banner 2"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative h-[300px] md:h-[450px] w-full focus:outline-none">
              <img
                src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=2070&auto=format&fit=crop"
                alt="Banner 3"
                className="w-full h-full object-cover"
              />
            </div>
          </Carousel>
        </div>

        <main className="cinema-shell px-4 pb-8 sm:px-6">
          <HeroSection />
          <MovieTabsSection />
          <CinemaAndPromoSection />
          <NewsStrip />
        </main>
      </SiteShell>
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

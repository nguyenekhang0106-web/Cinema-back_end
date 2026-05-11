"use client";

import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  FireOutlined,
  GiftOutlined,
  TrophyOutlined,
  StarFilled,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  List,
  Row,
  Space,
  Tag,
  Typography,
  Carousel,
} from "antd";
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
import { SiteShell } from "./site-shell";
import { TemplatePage } from "./template-page";

// 🔥 ĐÃ XÓA HOÀN TOÀN CÁC HÀM MovieTabsSection VÀ MovieFeedEmpty DƯ THỪA 🔥

function CinemaAndPromoSection() {
  const locale = useLocale();
  const dictionary = useDictionary();
  const cinemas = getLocalizedCinemas(locale);
  const promotions = getLocalizedPromotions(locale);

  return (
    <section className="mb-16">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={15}>
          <Card bordered={false} className="cinema-paper rounded-[28px]">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <Typography.Title level={2} className="cinema-section-title" style={{ margin: 0, color: "#4a3426" }}>
                  {dictionary.home.cinemaTitle}
                </Typography.Title>
                <Typography.Paragraph style={{ color: "#6d5a46", marginTop: 16 }}>
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
                  <Card bordered style={{ borderColor: "#ead8c1", background: "#fffaf4" }}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <Space wrap size={10}>
                          <Typography.Title level={4} style={{ margin: 0, color: "#4a3426" }}>
                            {cinema.name}
                          </Typography.Title>
                          <Tag color="red"><EnvironmentOutlined /> {cinema.area}</Tag>
                        </Space>
                        <Typography.Paragraph style={{ margin: "8px 0 0", color: "#6d5a46" }}>
                          {cinema.address}
                        </Typography.Paragraph>
                        <Space wrap className="mt-1">
                          {cinema.features.map((feature) => (
                            <Tag key={feature} color="gold">{feature}</Tag>
                          ))}
                        </Space>
                      </div>
                      <Space wrap>
                        {cinema.showtimes.slice(0, 4).map((time) => (
                          <Button key={time} disabled>{time}</Button>
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
              <Typography.Title level={2} className="cinema-section-title" style={{ margin: 0, color: "#4a3426" }}>
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
                        background: "linear-gradient(135deg, rgba(200,154,43,0.12), rgba(166,29,36,0.04))",
                      }}
                    >
                      <Space align="start">
                        <GiftOutlined style={{ fontSize: 22, color: "#a61d24" }} />
                        <div>
                          <Typography.Title level={5} style={{ margin: 0, color: "#4a3426" }}>
                            {promotion.title}
                          </Typography.Title>
                          <Typography.Paragraph style={{ margin: "6px 0 0", color: "#6d5a46" }}>
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
              <Typography.Title level={4} style={{ marginTop: 0, color: "#4a3426" }}>
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
    <section className="mb-20">
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
                    style={{ height: "100%", borderColor: "#ead8c1", background: "#fffaf4" }}
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
                      <Typography.Text style={{ color: "#6d5a46" }}>{item.desc}</Typography.Text>
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
  const locale = useLocale();
  const [movies, setMovies] = useState<MovieItem[]>([]);

  useEffect(() => {
    let mounted = true;
    getMoviesWithFallback(locale).then((items) => {
      if (mounted) setMovies(items);
    });
    return () => { mounted = false; };
  }, [locale]);

  // 🔥 LỌC PHIM NỔI BẬT: Chỉ hiện những phim có featured === true
  const featuredMovies = movies.filter((movie) => movie.featured === true);

  return (
    <div className="cinema-page">
      <SiteShell>
        <div className="cinema-shell">

          {/* BANNER (Góc vuông, kích thước chuẩn) */}
          <div className="px-4 sm:px-6 pt-6">
            <div className="w-full shadow-sm border border-gray-200">
              <Carousel autoplay effect="fade" arrows>
                <div className="relative h-[200px] md:h-[300px] lg:h-[400px] w-full">
                  <img
                    src="https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=2070&auto=format&fit=crop"
                    alt="Banner 1"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="relative h-[200px] md:h-[300px] lg:h-[400px] w-full">
                  <img
                    src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1925&auto=format&fit=crop"
                    alt="Banner 2"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="relative h-[200px] md:h-[300px] lg:h-[400px] w-full">
                  <img
                    src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=2070&auto=format&fit=crop"
                    alt="Banner 3"
                    className="w-full h-full object-cover"
                  />
                </div>
              </Carousel>
            </div>
          </div>

          <main className="pb-8 pt-10">

            {/* 🔥 KHỐI PHIM NỔI BẬT ĐƯỢC GIỮ LẠI ĐỘC QUYỀN TRÊN TRANG CHỦ */}
            {featuredMovies.length > 0 && (
              <div className="mb-16 px-4 sm:px-6">
                <div className="flex items-center justify-between mb-8">
                  <Typography.Title
                    level={2}
                    className="cinema-section-title"
                    style={{ 
                      margin: 0, 
                      color: "#4a3426", 
                      borderLeft: "5px solid #a61d24", 
                      paddingLeft: "14px", 
                      textTransform: "uppercase" 
                    }}
                  >
                    Phim Nổi Bật
                  </Typography.Title>
                  <Link
                    href={localizeHref("/phim", locale)}
                    className="text-[#a61d24] font-semibold hover:underline text-base"
                  >
                    Xem tất cả &gt;
                  </Link>
                </div>
                <MovieGrid movies={featuredMovies} showBooking={true} />
              </div>
            )}

            {/* 🔥 ĐÃ XÓA HOÀN TOÀN KHỐI CHIA TAB PHIM ĐANG CHIẾU / SẮP CHIẾU Ở ĐÂY 🔥 */}

            <div className="px-4 sm:px-6">
              <CinemaAndPromoSection />
              <NewsStrip />
            </div>

          </main>
        </div>
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
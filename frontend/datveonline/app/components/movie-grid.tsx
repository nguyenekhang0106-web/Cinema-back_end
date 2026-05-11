"use client";

import { useState } from "react";
import { Button, Card, Col, Modal, Row, Space, Tag, Typography } from "antd";
import Image from "next/image";
import Link from "next/link";
import { MovieItem } from "../data/cgv-template";
import { localizeHref } from "../lib/i18n";
import { useDictionary, useLocale } from "./locale-provider";

export function MovieGrid({
  movies,
  showBooking = true,
}: {
  movies: MovieItem[];
  showBooking?: boolean;
}) {
  const locale = useLocale();
  const dictionary = useDictionary();

  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);
  const [currentTrailerUrl, setCurrentTrailerUrl] = useState("");

  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
    }
    return url;
  };

  return (
    <>
      <Row gutter={[20, 20]}>
        {movies.map((movie) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={movie.id}>
            <Card
              hoverable
              bordered={false}
              className="cinema-paper overflow-hidden rounded-[22px] h-full"
              styles={{ body: { padding: '16px' } }}
              cover={
                <div className="relative aspect-[3/4] overflow-hidden group">
                  
                  {/* LỚP 1: ẢNH VÀ LINK CHI TIẾT PHIM */}
                  {/* 🔥 Thêm absolute inset-0 để Link bọc kín 100% diện tích khung ảnh */}
                  <Link href={localizeHref(`/phim/${movie.slug}`, locale)} className="absolute inset-0 z-10 block">
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
                      <Tag color="red">{movie.bookingLabel}</Tag>
                      <Tag color="gold">{movie.rating}</Tag>
                    </div>
                    <div className="absolute inset-x-4 bottom-5">
                      <Typography.Text style={{ color: "rgba(255,255,255,0.74)" }}>
                        {movie.genre}
                      </Typography.Text>
                      <Typography.Title level={4} style={{ color: "#fff", margin: "8px 0 0", lineHeight: 1.18 }}>
                        {movie.title}
                      </Typography.Title>
                    </div>
                  </div>

                  {/* 🔥 LỚP PHỦ METIZ (Bổ sung pointer-events-none để click xuyên qua được) 🔥 */}
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 p-4 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none">
                    
                    {/* NÚT TRAILER (Phục hồi lại khả năng click bằng pointer-events-auto) */}
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
                            Modal.warning({ title: 'Thông báo', content: 'Trailer phim đang được cập nhật!' });
                          }
                        }}
                        className="cinema-hover-btn border-white text-white hover:border-[#f0dfb1] hover:text-[#f0dfb1]"
                      >
                        Trailer
                      </Button>
                    </div>

                    {/* NÚT ĐẶT VÉ (Phục hồi lại khả năng click bằng pointer-events-auto) */}
                    {showBooking && (
                      <div className="w-full px-2 pointer-events-auto">
                        <Link
                          className="w-full block"
                          href={localizeHref(
                            `/dat-ve/${movie.slug}?cinema=${movie.showtimes[0]?.cinemaId ?? ""}&time=${movie.showtimes[0]?.times[0] ?? ""}`,
                            locale,
                          )}
                          onClick={(e) => e.stopPropagation()} 
                        >
                          <Button block size="large" type="primary">
                            {dictionary.home.book}
                          </Button>
                        </Link>
                      </div>
                    )}

                  </div>
                </div>
              }
            >
              {/* PHẦN TEXT BÊN DƯỚI CARD */}
              <Space direction="vertical" size={10} className="w-full">
                <Typography.Text style={{ color: "#7b6a58", fontSize: '13px' }}>
                  {movie.release} | {movie.duration}
                </Typography.Text>
                
                {movie.formats.length > 0 && (
                  <Space wrap size={6}>
                    {movie.formats.map((format) => (
                      <Tag key={format} color="gold" style={{ fontSize: '11px', padding: '0 5px' }}>
                        {format}
                      </Tag>
                    ))}
                  </Space>
                )}

                <Space direction="vertical" size={8} className="w-full mt-1">
                  <Link href={localizeHref(`/phim/${movie.slug}`, locale)}>
                    <Button block>{dictionary.home.detail}</Button>
                  </Link>
                  {showBooking && (
                    <Link
                      href={localizeHref(
                        `/dat-ve/${movie.slug}?cinema=${movie.showtimes[0]?.cinemaId ?? ""}&time=${movie.showtimes[0]?.times[0] ?? ""}`,
                        locale,
                      )}
                    >
                      <Button block type="primary">
                        {dictionary.home.book}
                      </Button>
                    </Link>
                  )}
                </Space>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

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
    </>
  );
}
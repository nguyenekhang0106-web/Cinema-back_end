"use client";

import { Button, Card, Col, Row, Space, Tag, Typography } from "antd";
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

  return (
    <Row gutter={[20, 20]}>
      {movies.map((movie) => (
        <Col xs={24} sm={12} lg={8} xl={6} key={movie.id}>
          <Card
            hoverable
            bordered={false}
            className="cinema-paper overflow-hidden rounded-[22px] h-full"
            cover={
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={movie.posterImage}
                  alt={movie.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  style={{ objectFit: "cover" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Tag color="red">{movie.bookingLabel}</Tag>
                    <Tag>{movie.rating}</Tag>
                  </div>
                  <div className="absolute inset-x-4 bottom-5">
                    <Typography.Text style={{ color: "rgba(255,255,255,0.74)" }}>
                      {movie.genre}
                    </Typography.Text>
                    <Typography.Title
                      level={4}
                      style={{ color: "#fff", margin: "8px 0 0", lineHeight: 1.18 }}
                    >
                      {movie.title}
                    </Typography.Title>
                  </div>
                </div>
              </div>
            }
          >
            <Space direction="vertical" size={12} className="w-full">
              <Typography.Text style={{ color: "#7b6a58" }}>
                {movie.release} | {movie.duration}
              </Typography.Text>
              <Space wrap>
                {movie.formats.map((format) => (
                  <Tag key={format} color="gold">
                    {format}
                  </Tag>
                ))}
              </Space>
              <Space direction="vertical" size={8} className="w-full">
                <Link href={localizeHref(`/phim/${movie.slug}`, locale)}>
                  <Button block>{dictionary.home.detail}</Button>
                </Link>
                {showBooking ? (
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
                ) : null}
              </Space>
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

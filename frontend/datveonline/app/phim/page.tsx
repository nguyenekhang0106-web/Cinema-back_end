"use client";

import { Card, Space, Tag, Typography } from "antd";
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
      if (mounted) {
        setMovies(items);
      }
    });

    return () => {
      mounted = false;
    };
  }, [locale]);

  return (
    <div className="cinema-page">
      <SiteShell>
        <main className="cinema-shell px-4 py-8 sm:px-6">
          <Card bordered={false} className="cinema-paper rounded-[28px]">
            <Space direction="vertical" size={12} className="w-full">
              <Tag color="red">{dictionary.pages.movies.eyebrow}</Tag>
              <Typography.Title level={1} style={{ margin: 0, color: "#4a3426" }}>
                {dictionary.pages.movies.title}
              </Typography.Title>
              <Typography.Paragraph style={{ color: "#6d5a46", marginBottom: 0 }}>
                {dictionary.pages.movies.description}
              </Typography.Paragraph>
            </Space>
          </Card>
          <Card bordered={false} className="cinema-paper mt-8 rounded-[28px]">
            <MovieGrid movies={movies} />
          </Card>
        </main>
      </SiteShell>
    </div>
  );
}

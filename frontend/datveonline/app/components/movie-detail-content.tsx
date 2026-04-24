"use client";

import Image from "next/image";
import Link from "next/link";
import { MovieItem } from "../data/cgv-template";
import { localizeHref } from "../lib/i18n";
import { useDictionary, useLocale } from "./locale-provider";

export function MovieDetailContent({ movie }: { movie: MovieItem }) {
  const locale = useLocale();
  const dictionary = useDictionary();

  return (
    <div className="space-y-8">
      <section className="cinema-paper overflow-hidden rounded-[28px]">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-[360px]">
            <Image
              src={movie.heroImage}
              alt={movie.title}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[#a61d24] px-3 py-1 text-sm font-semibold text-white">
                {movie.bookingLabel}
              </span>
              <span className="rounded-full bg-[#f0dfb1] px-3 py-1 text-sm font-semibold text-[#4a3426]">
                {movie.rating}
              </span>
              {movie.formats.map((format) => (
                <span
                  key={format}
                  className="rounded-full border border-[#e4d1b4] px-3 py-1 text-sm text-[#4a3426]"
                >
                  {format}
                </span>
              ))}
            </div>
            <h1 className="mt-5 text-4xl font-bold text-[#4a3426]">{movie.title}</h1>
            <p className="mt-2 text-lg text-[#8c6b45]">{movie.subtitle}</p>
            <p className="mt-5 leading-7 text-[#6d5a46]">{movie.synopsis}</p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm text-[#6d5a46]">
              <span>{movie.duration}</span>
              <span>{movie.genre}</span>
              <span>{movie.language}</span>
              <span>{movie.release}</span>
            </div>
            <div className="mt-5 space-y-2 text-[#4a3426]">
              <p>
                <strong>{dictionary.movieDetail.director}:</strong> {movie.director}
              </p>
              <p>
                <strong>{dictionary.movieDetail.cast}:</strong> {movie.cast.join(", ")}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-2xl border border-[#c89a2b] px-5 py-3 font-semibold text-[#4a3426]">
                {movie.trailerLabel}
              </span>
              <Link
                href={localizeHref(
                  `/dat-ve/${movie.slug}?cinema=${movie.showtimes[0]?.cinemaId ?? ""}&time=${movie.showtimes[0]?.times[0] ?? ""}`,
                  locale,
                )}
                className="rounded-2xl bg-[#a61d24] px-5 py-3 font-semibold text-white"
              >
                {dictionary.movieDetail.bookNow}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="cinema-paper rounded-[28px] p-6">
          <h2 className="cinema-section-title text-3xl text-[#4a3426]">
            {dictionary.movieDetail.showtimes}
          </h2>
          <div className="mt-6 space-y-4">
            {movie.showtimes.map((showtime) => (
              <div
                key={`${showtime.cinemaId}-${showtime.room}`}
                className="rounded-[22px] border border-[#ead8c1] bg-[#fffaf4] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-bold text-[#4a3426]">
                        {showtime.cinemaName}
                      </h3>
                      <span className="rounded-full bg-[#a61d24] px-3 py-1 text-sm text-white">
                        {showtime.dateLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-[#6d5a46]">{showtime.room}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {showtime.times.map((time) => (
                      <Link
                        key={`${showtime.cinemaId}-${time}`}
                        href={localizeHref(
                          `/dat-ve/${movie.slug}?cinema=${showtime.cinemaId}&time=${time}`,
                          locale,
                        )}
                        className="rounded-xl border border-[#e4d1b4] bg-white px-4 py-2 text-sm font-semibold text-[#4a3426]"
                      >
                        {time}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="cinema-paper rounded-[28px] p-6">
            <h3 className="text-2xl font-bold text-[#4a3426]">
              {dictionary.movieDetail.highlights}
            </h3>
            <div className="mt-4 space-y-3 text-[#6d5a46]">
              {dictionary.movieDetail.highlightItems.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>
          <div className="cinema-paper rounded-[28px] p-6">
            <h3 className="text-2xl font-bold text-[#4a3426]">
              {dictionary.movieDetail.temporaryMedia}
            </h3>
            <p className="mt-4 text-[#6d5a46]">{dictionary.movieDetail.temporaryMediaDescription}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

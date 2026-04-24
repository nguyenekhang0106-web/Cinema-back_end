import { allMovies, type MovieItem, type ShowTime } from "../data/cgv-template";
import { getLocalizedMovies } from "./localized-data";
import { type Locale } from "./i18n";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_CINEMA_API_URL ?? "http://localhost:9090/cinema";

type ApiResponse<T> = {
  code?: number;
  message?: string;
  result?: T;
};

export type AuthRole = "admin" | "user";

export type AuthUser = {
  email?: string;
  role: AuthRole;
};

type BackendMovie = {
  id: string;
  title: string;
  durationMin?: number;
  genre?: string;
  language?: string;
  ageRestriction?: string;
  posterUrl?: string;
  trailerUrl?: string;
  description?: string;
  releaseDate?: string;
  status?: string;
  directors?: string[];
  actors?: string[];
};

type BackendShowtime = {
  id: string;
  startTime?: string;
  format?: string;
  movieId?: string;
  hallId?: string;
};

type LoginResult = {
  authenticated?: boolean;
  token?: string;
};

type RegisterRequest = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  citizenIdNumber: string;
  gender?: string;
  dateOfBirth?: string;
  area?: string;
};

async function request<T>(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;

  if (!response.ok || (payload.code && payload.code !== 1000)) {
    throw new Error(payload.message ?? "Backend request failed");
  }

  return payload.result as T;
}

export async function loginWithBackend(username: string, password: string) {
  const result = await request<LoginResult>("/auth/token", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  if (!result?.authenticated || !result.token) {
    throw new Error("Login failed");
  }

  return {
    token: result.token,
    user: parseUserFromToken(result.token),
  };
}

export async function registerWithBackend(requestBody: RegisterRequest) {
  return request<unknown>("/users/register", {
    method: "POST",
    body: JSON.stringify(requestBody),
  });
}

export async function getBackendMovies(locale: Locale): Promise<MovieItem[]> {
  const movies = await request<BackendMovie[]>("/movies", { next: { revalidate: 30 } });
  return Promise.all(movies.map((movie, index) => toMovieItem(movie, index, locale)));
}

export async function getMoviesWithFallback(locale: Locale): Promise<MovieItem[]> {
  try {
    const movies = await getBackendMovies(locale);
    return movies.length > 0 ? movies : getLocalizedMovies(locale);
  } catch {
    return getLocalizedMovies(locale);
  }
}

export async function getMovieBySlugWithFallback(locale: Locale, slug: string) {
  const movies = await getMoviesWithFallback(locale);
  return movies.find((movie) => movie.slug === slug);
}

function parseUserFromToken(token: string): AuthUser {
  const payload = JSON.parse(atob(token.split(".")[1] ?? "")) as {
    sub?: string;
    scope?: string;
  };
  const scope = payload.scope ?? "";
  return {
    email: payload.sub,
    role: scope.includes("ROLE_ADMIN") ? "admin" : "user",
  };
}

async function toMovieItem(movie: BackendMovie, index: number, locale: Locale): Promise<MovieItem> {
  const fallback = allMovies[index % allMovies.length];
  const showtimes = await getShowtimesForMovie(movie.id, fallback.showtimes);
  const title = movie.title || fallback.title;

  return {
    ...fallback,
    id: movie.id,
    slug: slugify(title),
    title,
    subtitle: fallback.subtitle,
    genre: formatEnum(movie.genre) || fallback.genre,
    duration: movie.durationMin ? `${movie.durationMin} ${locale === "vi" ? "phut" : "min"}` : fallback.duration,
    rating: movie.ageRestriction ?? fallback.rating,
    release: movie.releaseDate ?? fallback.release,
    bookingLabel: movie.status === "NOW_SHOWING" ? (locale === "vi" ? "Dang chieu" : "Now showing") : fallback.bookingLabel,
    posterImage: movie.posterUrl || fallback.posterImage,
    heroImage: movie.posterUrl || fallback.heroImage,
    synopsis: movie.description || fallback.synopsis,
    director: movie.directors?.join(", ") || fallback.director,
    cast: movie.actors?.length ? movie.actors : fallback.cast,
    language: formatEnum(movie.language) || fallback.language,
    trailerLabel: movie.trailerUrl ? "Trailer" : fallback.trailerLabel,
    showtimes,
  };
}

async function getShowtimesForMovie(movieId: string, fallback: ShowTime[]): Promise<ShowTime[]> {
  try {
    const showtimes = await request<BackendShowtime[]>(`/showtimes/movie/${movieId}`, {
      next: { revalidate: 30 },
    });
    if (!showtimes.length) {
      return fallback;
    }

    return [
      {
        cinemaId: showtimes[0]?.hallId ?? "backend-hall",
        cinemaName: "KCT Cinema",
        room: showtimes[0]?.hallId ? `Hall ${showtimes[0].hallId}` : "Backend hall",
        dateLabel: "API",
        times: showtimes.map((showtime) => formatTime(showtime.startTime)),
      },
    ];
  } catch {
    return fallback;
  }
}

function formatEnum(value?: string) {
  return value ? value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : "";
}

function formatTime(value?: string) {
  if (!value) {
    return "--:--";
  }

  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

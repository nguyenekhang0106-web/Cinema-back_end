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
  id?: string; // <-- BẠN THÊM DÒNG NÀY VÀO LÀ HẾT LỖI NGAY
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

export async function loginWithBackend(
  usernameOrEmail: string,
  password: string,
) {
  const result = await request<LoginResult>("/auth/token", {
    method: "POST",
    body: JSON.stringify({
      username: usernameOrEmail, // Gửi giá trị user nhập vào trường "username" của BE
      password: password,
    }),
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
  const movies = await request<BackendMovie[]>("/movies", {
    next: { revalidate: 30 },
  });
  return Promise.all(
    movies.map((movie, index) => toMovieItem(movie, index, locale)),
  );
}

export async function getMoviesWithFallback(
  locale: Locale,
): Promise<MovieItem[]> {
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

// Trong file lib/cinema-api.ts
function parseUserFromToken(token: string): AuthUser {
  const payload = JSON.parse(atob(token.split(".")[1] ?? "")) as {
    sub?: string;
    scope?: string;
    userId?: string; // 🔥 Cấu trúc Payload giờ đã có thêm userId từ Spring Boot
  };
  const scope = payload.scope ?? "";

  return {
    id: payload.userId, // 🔥 Lấy ID thực tế từ Token
    email: payload.sub,
    role: scope.includes("ROLE_ADMIN") ? "admin" : "user",
  };
}

async function toMovieItem(
  movie: BackendMovie,
  index: number,
  locale: Locale,
): Promise<MovieItem> {
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
    duration: movie.durationMin
      ? `${movie.durationMin} ${locale === "vi" ? "phut" : "min"}`
      : fallback.duration,
    rating: movie.ageRestriction ?? fallback.rating,
    release: movie.releaseDate ?? fallback.release,
    bookingLabel:
      movie.status === "NOW_SHOWING"
        ? locale === "vi"
          ? "Dang chieu"
          : "Now showing"
        : fallback.bookingLabel,
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

async function getShowtimesForMovie(
  movieId: string,
  fallback: ShowTime[],
): Promise<ShowTime[]> {
  try {
    const showtimes = await request<BackendShowtime[]>(
      `/showtimes/movie/${movieId}`,
      {
        next: { revalidate: 30 },
      },
    );
    if (!showtimes.length) {
      return fallback;
    }

    return [
      {
        cinemaId: showtimes[0]?.hallId ?? "backend-hall",
        cinemaName: "KCT Cinema",
        room: showtimes[0]?.hallId
          ? `Hall ${showtimes[0].hallId}`
          : "Backend hall",
        dateLabel: "API",
        times: showtimes.map((showtime) => formatTime(showtime.startTime)),
      },
    ];
  } catch {
    return fallback;
  }
}

function formatEnum(value?: string) {
  return value
    ? value
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "";
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

// Thêm đoạn này vào file lib/cinema-api.ts
export async function verifyOtpWithBackend(email: string, otpCode: string) {
  return request<unknown>("/users/verify-otp", {
    method: "POST",
    // Gửi email và mã 6 số xuống backend để đối chiếu với Redis
    body: JSON.stringify({ email, otp: otpCode }),
  });
}

// Lấy thông tin cá nhân (Map tới: GET /users/myInfo)
export async function getMyProfile(token: string) {
  return request<any>("/users/myInfo", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Cập nhật thông tin cá nhân (Map tới: PUT /users/my-info)
export async function updateMyProfile(token: string, payload: any) {
  return request<any>("/users/my-info", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

// Upload Avatar
export async function uploadAvatarApi(
  token: string,
  userId: string,
  file: File,
) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/users/${userId}/avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || (payload.code && payload.code !== 1000)) {
    throw new Error(payload.message ?? "Tải ảnh lên thất bại");
  }

  return payload.result;
}

import { allMovies, type MovieItem, type ShowTime } from "../data/cgv-template";
import { getLocalizedMovies } from "./localized-data";
import { type Locale } from "./i18n";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_CINEMA_API_URL ?? "http://localhost:9090/cinema"
).replace(/\/$/, "");

type ApiResponse<T> = {
  code?: number;
  message?: string;
  result?: T;
};

export type AuthRole = "admin" | "user";

export type AuthUser = {
  id?: string;
  email?: string;
  fullName?: string; // 🔥 BỔ SUNG DÒNG NÀY VÀO LÀ HẾT LỖI
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
  bannerUrl?: string;
  trailerUrl?: string;
  description?: string;
  releaseDate?: string;
  status?: string;
  directors?: string[];
  actors?: string[];
  featured?: boolean;
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
      username: usernameOrEmail,
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
    cache: "no-store",
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
  return movies.find((movie) => movie.slug === slug || movie.id === slug);
}

function parseUserFromToken(token: string): AuthUser {
  // Lấy phần payload của Token
  const base64Url = token.split(".")[1] ?? "";
  // Chuẩn hóa lại chuỗi base64
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

  // 🔥 XỬ LÝ LỖI FONT TIẾNG VIỆT (UTF-8)
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  );

  const payload = JSON.parse(jsonPayload) as {
    sub?: string;
    scope?: string;
    userId?: string;
    fullName?: string;
  };

  const scope = payload.scope ?? "";

  return {
    id: payload.userId,
    email: payload.sub,
    fullName: payload.fullName,
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

  let label = fallback.bookingLabel;
  if (movie.status === "NOW_SHOWING")
    label = locale === "vi" ? "Đang chiếu" : "Now showing";
  else if (movie.status === "COMING_SOON")
    label = locale === "vi" ? "Sắp chiếu" : "Coming soon";
  else if (movie.status === "STOPPED")
    label = locale === "vi" ? "Ngừng chiếu" : "Stopped";

  return {
    ...fallback,
    id: movie.id,
    status: movie.status || fallback.status, // 🔥 QUAN TRỌNG: Bổ sung dòng này để FE nhận đúng trạng thái
    featured: movie.featured || false,
    slug: slugify(title),
    title,
    subtitle: fallback.subtitle,
    genre: formatEnum(movie.genre) || fallback.genre,
    duration: movie.durationMin
      ? `${movie.durationMin} ${locale === "vi" ? "phút" : "min"}`
      : fallback.duration,
    rating: movie.ageRestriction ?? fallback.rating,
    release: movie.releaseDate ?? fallback.release,
    bookingLabel: label,
    posterUrl: movie.posterUrl || fallback.posterUrl,
    bannerUrl: movie.bannerUrl || fallback.bannerUrl,
    synopsis: movie.description || fallback.synopsis,
    director: movie.directors?.join(", ") || fallback.director,
    cast: movie.actors?.length ? movie.actors : fallback.cast,
    language: formatEnum(movie.language) || fallback.language,
    trailerLabel: movie.trailerUrl ? "Trailer" : fallback.trailerLabel,
    trailerUrl: movie.trailerUrl,
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
        cache: "no-store", // 🔥 ĐÃ SỬA: Tắt cache hoàn toàn để Lịch chiếu luôn realtime
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

export async function verifyOtpWithBackend(email: string, otpCode: string) {
  return request<unknown>("/users/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp: otpCode }),
  });
}

export async function getMyProfile(token: string) {
  return request<any>("/users/myInfo", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store", // 🔥 BẮT BUỘC THÊM DÒNG NÀY ĐỂ XÓA CACHE
  });
}

export async function updateMyProfile(token: string, payload: any) {
  return request<any>("/users/my-info", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function uploadAvatarApi(
  token: string,
  userId: string,
  file: File,
) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/users/${userId}/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || (payload.code && payload.code !== 1000)) {
    throw new Error(payload.message ?? "Tải ảnh lên thất bại");
  }
  return payload.result;
}

export async function changePasswordApi(token: string, payload: any) {
  const res = await fetch(`${API_BASE_URL}/users/my-info/change-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || data.code !== 1000) {
    throw new Error(data.message || "Lỗi đổi mật khẩu");
  }
  return data;
}

export async function forgotPasswordApi(email: string) {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok || data.code !== 1000) {
    throw new Error(data.message || "Không thể gửi yêu cầu. Vui lòng thử lại!");
  }
  return data;
}

export async function resetPasswordApi(token: string, newPassword: string) {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });

  const data = await res.json();
  if (!res.ok || data.code !== 1000) {
    throw new Error(
      data.message || "Đặt lại mật khẩu thất bại. Token có thể đã hết hạn!",
    );
  }
  return data;
}

export async function createMovieApi(token: string, payload: any) {
  const res = await fetch(`${API_BASE_URL}/movies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.code !== 1000) {
    throw new Error(data.message || "Lỗi tạo phim mới");
  }
  return data;
}

export async function uploadMovieImagesApi(
  token: string,
  movieId: string,
  posterFile?: File | null,
  bannerFile?: File | null,
) {
  const formData = new FormData();
  if (posterFile) formData.append("posterFile", posterFile);
  if (bannerFile) formData.append("bannerFile", bannerFile);

  const res = await fetch(`${API_BASE_URL}/movies/${movieId}/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok || data.code !== 1000) {
    throw new Error(data.message || "Lỗi tải ảnh lên");
  }
  return data;
}

export async function updateMovieApi(
  token: string,
  movieId: string,
  data: any,
) {
  const res = await fetch(`${API_BASE_URL}/movies/${movieId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (json.code !== 1000) {
    throw new Error(json.message || "Lỗi khi cập nhật phim");
  }
  return json;
}

export async function getMoviesApi() {
  const res = await fetch(`${API_BASE_URL}/movies`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  const json = await res.json();
  if (json.code !== 1000) {
    throw new Error(json.message || "Lỗi khi lấy danh sách phim");
  }
  return json;
}

export async function getMovieByIdApi(id: string) {
  const res = await fetch(`${API_BASE_URL}/movies/${id}`, {
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.code !== 1000)
    throw new Error(data.message || "Lỗi lấy dữ liệu phim");
  return data.result;
}

export async function deleteMovieApi(token: string, id: string) {
  const res = await fetch(`${API_BASE_URL}/movies/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok || data.code !== 1000)
    throw new Error(data.message || "Lỗi xóa phim");
  return data;
}

export interface BannerItem {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  displayOrder: number;
  active: boolean;
}

export async function getActiveBanners(): Promise<BannerItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/banners`, {
      cache: "no-store", // 🔥 ĐÃ SỬA: Đổi revalidate thành no-store
    });
    if (!response.ok) return [];

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error("Lỗi khi fetch banners:", error);
    return [];
  }
}

export interface CinemaItem {
  id: string;
  name: string;
  address: string;
  hotline: string;
  city: string;
}

export async function getCinemas(): Promise<CinemaItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/cinemas`, {
      cache: "no-store", // 🔥 ĐÃ SỬA: Đổi revalidate thành no-store
    });

    if (!res.ok) {
      console.error("Lỗi HTTP:", res.status);
      return [];
    }

    const data = await res.json();
    return data.result || [];
  } catch (error) {
    console.error("Lỗi khi fetch danh sách rạp:", error);
    return [];
  }
}

export async function getMyTicketsApi(token: string) {
  const res = await fetch(`${API_BASE_URL}/tickets/my-tickets`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch tickets");
  return res.json();
}

// Lấy danh sách voucher trong ví của User
export async function getMyVouchersApi(token: string) {
  const res = await fetch(`${API_BASE_URL}/promotions/my-vouchers`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch vouchers");
  return res.json();
}

// Chức năng: User bấm nút Nhận mã ưu đãi
export async function collectVoucherApi(token: string, promotionId: string) {
  const res = await fetch(`${API_BASE_URL}/promotions/${promotionId}/collect`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "Lỗi khi nhận mã");
  }
  return res.json();
}

export async function getUsersApi(token: string) {
  return request<any[]>("/users", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
}

export async function createUserApi(token: string, payload: any) {
  return request<any>("/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateUserApi(token: string, id: string, payload: any) {
  return request<any>(`/users/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteUserApi(token: string, id: string) {
  return request<any>(`/users/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function toggleUserStatusApi(token: string, id: string) {
  return request<any>(`/users/${id}/toggle-status`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

const API_BASE = API_BASE_URL;

// 🔥 1. NÂNG CẤP HÀM LẤY TOKEN ĐỂ ĐỌC ĐÚNG TỪ KHO LƯU TRỮ MỚI
export function getStoredToken() {
  if (typeof window === "undefined") return null;

  // Ưu tiên 1: Đọc từ kho lưu trữ bảo mật mới của AuthSessionProvider
  const sessionStr = window.localStorage.getItem("kct-auth-session");
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      if (session.token) return session.token;
    } catch (e) {
      console.error("Lỗi đọc session:", e);
    }
  }

  // Ưu tiên 2: Dự phòng cho các code cũ (nếu có sót lại)
  return (
    window.localStorage.getItem("token") ||
    window.sessionStorage.getItem("token")
  );
}

export function setStoredToken(token: string) {
  localStorage.setItem("token", token);
  window.dispatchEvent(new Event("auth-changed"));
}

// 🔥 2. ĐỒNG BỘ HÀM XÓA DỮ LIỆU KHI TOKEN HỎNG
export function clearAuthAndRedirect() {
  if (typeof window !== "undefined") {
    // Xóa sạch mọi dấu vết token cũ và mới
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");
    window.localStorage.removeItem("kct-auth-session"); // Thêm dòng này để xóa session mới

    // Kích hoạt sự kiện để React UI tự động update
    window.dispatchEvent(new Event("auth-changed"));
    window.dispatchEvent(new Event("force-logout")); // Kích hoạt lệnh đá văng an toàn

    // Đẩy về trang đăng nhập
    window.location.href = "/dang-nhap";
  }
}

export async function refreshAccessToken() {
  const oldToken = getStoredToken();

  if (!oldToken) {
    clearAuthAndRedirect();
    return null;
  }

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: oldToken,
    }),
  });

  const data = await res.json();

  if (!res.ok || data.code !== 1000 || !data.result?.token) {
    clearAuthAndRedirect();
    return null;
  }

  const newToken = data.result.token;
  setStoredToken(newToken);

  return newToken;
}

export async function authFetch(input: string, init: RequestInit = {}) {
  let token = getStoredToken();

  const makeRequest = (currentToken: string | null) =>
    fetch(input, {
      ...init,
      headers: {
        ...(init.headers || {}),
        ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
      },
    });

  let res = await makeRequest(token);

  if (res.status === 401 || res.status === 403) {
    const newToken = await refreshAccessToken();

    if (!newToken) {
      clearAuthAndRedirect();
      throw new Error("Phiên đăng nhập đã hết hạn");
    }

    res = await makeRequest(newToken);
  }

  return res;
}

// 🔥 GỌI API GỬI LẠI MÃ OTP
export async function resendOtpApi(email: string) {
  const res = await fetch(`${API_BASE_URL}/users/resend-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

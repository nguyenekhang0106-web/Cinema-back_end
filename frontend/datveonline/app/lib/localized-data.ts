import {
  allMovies,
  cinemas,
  heroBanners,
  nowShowingMovies,
  promotions,
  quickBookingOptions,
  upcomingMovies,
  type BannerItem,
  type CinemaItem,
  type MovieItem,
} from "../data/cgv-template";
import { type Locale } from "./i18n";

const viTextMap: Record<string, string> = {
  "Quan 1, TP.HCM": "Quận 1, TP.HCM",
  "Hanh dong | Giat gan": "Hành động | Giật gân",
  "Bi an | Tam ly": "Bí ẩn | Tâm lý",
  "Tinh cam | Am nhac": "Tình cảm | Âm nhạc",
  "Phieu luu | Vien tuong": "Phiêu lưu | Viễn tưởng",
  "Vien tuong | Chinh kich": "Viễn tưởng | Chính kịch",
  "Tinh cam | Chua lanh": "Tình cảm | Chữa lành",
  "128 phut": "128 phút",
  "114 phut": "114 phút",
  "109 phut": "109 phút",
  "136 phut": "136 phút",
  "121 phut": "121 phút",
  "104 phut": "104 phút",
  "Dang chieu": "Đang chiếu",
  "Khoi chieu 26/04": "Khởi chiếu 26/04",
  "Khoi chieu 30/04": "Khởi chiếu 30/04",
  "Dat truoc": "Đặt trước",
  "Sap mo ban": "Sắp mở bán",
  "Phu de va long tieng": "Phụ đề và lồng tiếng",
  "Phu de": "Phụ đề",
  "Long tieng va phu de": "Lồng tiếng và phụ đề",
  "Long tieng": "Lồng tiếng",
  "Trailer chinh thuc": "Trailer chính thức",
  "Hom nay": "Hôm nay",
  "Ngay mai": "Ngày mai",
  "Cuoi tuan": "Cuối tuần",
  "Phong 05 - IMAX": "Phòng 05 - IMAX",
  "Phong 03 - Gold": "Phòng 03 - Gold",
  "Phong 07 - ScreenX": "Phòng 07 - ScreenX",
  "Phong 02 - Standard": "Phòng 02 - Standard",
  "Phong 01 - Gold": "Phòng 01 - Gold",
  "Phong 03 - Premium": "Phòng 03 - Premium",
  "Phong 06 - Laser": "Phòng 06 - Laser",
  "Phong 08 - IMAX": "Phòng 08 - IMAX",
  "Thu 4 KCT Member": "Thứ 4 KCT Member",
  "Dong gia 79.000d cho ve 2D va giam 20% combo bap nuoc.":
    "Đồng giá 79.000đ cho vé 2D và giảm 20% combo bắp nước.",
  "Dat online - nhan uu dai": "Đặt online - nhận ưu đãi",
  "Mien phi nang size nuoc khi thanh toan online truoc 18:00.":
    "Miễn phí nâng size nước khi thanh toán online trước 18:00.",
  "Sinh vien di rap": "Sinh viên đi rạp",
  "Gia uu dai cho xuat truoc 17:00 khi xac minh tai khoan thanh vien.":
    "Giá ưu đãi cho suất trước 17:00 khi xác minh tài khoản thành viên.",
};

const textMap: Record<string, string> = {
  "Quan 1, TP.HCM": "District 1, Ho Chi Minh City",
  "Binh Thanh, TP.HCM": "Binh Thanh, Ho Chi Minh City",
  "Thu Duc, TP.HCM": "Thu Duc, Ho Chi Minh City",
  "Hanh dong | Giat gan": "Action | Thriller",
  "Bi an | Tam ly": "Mystery | Psychological",
  "Tinh cam | Am nhac": "Romance | Musical",
  "Phieu luu | Vien tuong": "Adventure | Sci-fi",
  "Vien tuong | Chinh kich": "Sci-fi | Drama",
  "Tinh cam | Chua lanh": "Romance | Healing drama",
  "128 phut": "128 min",
  "114 phut": "114 min",
  "109 phut": "109 min",
  "136 phut": "136 min",
  "121 phut": "121 min",
  "104 phut": "104 min",
  "Dang chieu": "Now showing",
  "Khoi chieu 26/04": "Opens on Apr 26",
  "Khoi chieu 30/04": "Opens on Apr 30",
  "Best seller": "Best seller",
  Hot: "Hot",
  "Dat truoc": "Advance booking",
  "Coming soon": "Coming soon",
  "Sap mo ban": "Sales opening soon",
  "Phu de va long tieng": "Subtitled and dubbed",
  "Phu de": "Subtitled",
  "Long tieng va phu de": "Dubbed and subtitled",
  "Long tieng": "Dubbed",
  "Trailer chinh thuc": "Official trailer",
  "Teaser mystery": "Mystery teaser",
  "MV trailer": "Music trailer",
  "Trailer IMAX": "IMAX trailer",
  "First look": "First look",
  "Official teaser": "Official teaser",
  "Hom nay": "Today",
  "Ngay mai": "Tomorrow",
  "Cuoi tuan": "Weekend",
  "Phong 05 - IMAX": "Auditorium 05 - IMAX",
  "Phong 03 - Gold": "Auditorium 03 - Gold",
  "Phong 07 - ScreenX": "Auditorium 07 - ScreenX",
  "Phong 02 - Standard": "Auditorium 02 - Standard",
  "Phong 01 - Gold": "Auditorium 01 - Gold",
  "Phong 03 - Premium": "Auditorium 03 - Premium",
  "Phong 06 - Laser": "Auditorium 06 - Laser",
  "Phong 08 - IMAX": "Auditorium 08 - IMAX",
  "Dat ve xem phim tai KCT Cinema nhanh, dep va ro rang tren moi man hinh":
    "Book movie tickets at KCT Cinema with a clean, fast flow on every screen.",
  "Template duoc mo rong tu homepage sang chi tiet phim, chon ghe, checkout va auth pages de tao thanh mot flow dat ve tron ven.":
    "This template expands from the homepage into movie detail, seat selection, checkout, and auth pages to complete the booking flow.",
  "Dat ve ngay": "Book now",
  "KCT Cinema | IMAX & Gold Class": "KCT Cinema | IMAX & Gold Class",
  "Them trailer, poster, uu dai va membership vao mot bo cuc ban ve co chuyen doi tot":
    "Bring trailers, posters, offers, and membership into a ticketing layout built for conversion.",
  "Moi button chinh deu da duoc noi route, giup nguoi dung di tu homepage sang trang phim, dat ghe va thanh toan.":
    "Every primary button already connects to its route, guiding users from the homepage to movies, seat booking, and checkout.",
  "Xem phim hot": "See featured movies",
  "Dang chieu | Uu dai thanh vien": "Now showing | Member offers",
  "Su dung san bo anh cinema de demo truoc khi ban gui poster va banner that":
    "Use the built-in cinema image set to demo the UI before final posters and banners arrive.",
  "Toi da dung anh remote co san de lap day giao dien, ban co the doi sang tai nguyen cua rieng minh bat ky luc nao.":
    "The layout currently uses remote stock imagery, and you can swap it with your own assets at any time.",
  "Mo trang phim": "Open movie page",
  "Poster tam thoi | Pexels assets": "Temporary posters | Pexels assets",
  "Thu 4 KCT Member": "KCT Member Wednesday",
  "Dong gia 79.000d cho ve 2D va giam 20% combo bap nuoc.":
    "Enjoy a flat 79,000d price for 2D tickets and 20% off popcorn combos.",
  "Dat online - nhan uu dai": "Book online - get rewards",
  "Mien phi nang size nuoc khi thanh toan online truoc 18:00.":
    "Get a free drink size upgrade when you complete online payment before 18:00.",
  "Sinh vien di rap": "Student movie plan",
  "Gia uu dai cho xuat truoc 17:00 khi xac minh tai khoan thanh vien.":
    "Receive discounted pricing on sessions before 17:00 after verifying your member account.",
};

const movieTranslations: Record<string, Partial<MovieItem>> = {
  "movie-1": {
    title: "Moonlight Heist",
    subtitle: "Ke Danh Cap Anh Trang",
    synopsis:
      "After a diamond robbery goes wrong, a veteran investigator and a young hacker are forced into an overnight chase through a city that never sleeps.",
  },
  "movie-2": {
    title: "The Old Hall",
    subtitle: "Dem Trong Rap Cu",
    synopsis:
      "A group of friends returns to the abandoned cinema where they grew up, only to find the night dissolving into memories and hallucinations none of them wants to face.",
  },
  "movie-3": {
    title: "Last Summer Flavor",
    subtitle: "Huong Vi Mua He Cuoi",
    synopsis:
      "Two young adults meet again inside a city cineplex, and their delayed love story unfolds through music, memory, and a final string of summer matinees.",
  },
  "movie-4": {
    title: "Light Below",
    subtitle: "Anh Sang Cuoi Duong Ham",
    synopsis:
      "In an energy-starved future, a team of young engineers dives into an underground tunnel network to reignite the final source of light for the city.",
  },
  "movie-5": {
    title: "Second Sun",
    subtitle: "Mat Troi Lan Thu Hai",
    synopsis:
      "When a satellite detects a strange optical event in the sky, a space crew is drawn toward a truth that could reshape the planet.",
  },
  "movie-6": {
    title: "Hear the Rain Again",
    subtitle: "Ban Con Nghe Mua Roi",
    synopsis:
      "After a family crisis, a pianist returns to an old city to recover the soundscape and the person that changed his life.",
  },
};

function translate(value: string) {
  return textMap[value] ?? value;
}

function translateVi(value: string) {
  return viTextMap[value] ?? value;
}

function localizeMovie(movie: MovieItem, locale: Locale): MovieItem {
  if (locale === "vi") {
    return {
      ...movie,
      genre: translateVi(movie.genre),
      duration: translateVi(movie.duration),
      release: translateVi(movie.release),
      bookingLabel: translateVi(movie.bookingLabel),
      language: translateVi(movie.language),
      trailerLabel: translateVi(movie.trailerLabel),
      showtimes: movie.showtimes.map((showtime) => ({
        ...showtime,
        room: translateVi(showtime.room),
        dateLabel: translateVi(showtime.dateLabel),
      })),
    };
  }

  const movieTranslation = movieTranslations[movie.id] ?? {};

  return {
    ...movie,
    ...movieTranslation,
    genre: translate(movie.genre),
    duration: translate(movie.duration),
    release: translate(movie.release),
    bookingLabel: translate(movie.bookingLabel),
    language: translate(movie.language),
    trailerLabel: translate(movie.trailerLabel),
    showtimes: movie.showtimes.map((showtime) => ({
      ...showtime,
      room: translate(showtime.room),
      dateLabel: translate(showtime.dateLabel),
    })),
  };
}

function localizeCinema(cinema: CinemaItem, locale: Locale): CinemaItem {
  if (locale === "vi") {
    return {
      ...cinema,
      area: translateVi(cinema.area),
    };
  }

  return {
    ...cinema,
    area: translate(cinema.area),
  };
}

function localizeBanner(banner: BannerItem, locale: Locale): BannerItem {
  if (locale === "vi") {
    return banner;
  }

  return {
    ...banner,
    title: translate(banner.title),
    subtitle: translate(banner.subtitle),
    cta: translate(banner.cta),
    accent: translate(banner.accent),
  };
}

export function getLocalizedMovies(locale: Locale) {
  return allMovies.map((movie) => localizeMovie(movie, locale));
}

export function getLocalizedMovieBySlug(locale: Locale, slug: string) {
  const movie = allMovies.find((item) => item.slug === slug);
  return movie ? localizeMovie(movie, locale) : undefined;
}

export function getLocalizedNowShowingMovies(locale: Locale) {
  return nowShowingMovies.map((movie) => localizeMovie(movie, locale));
}

export function getLocalizedUpcomingMovies(locale: Locale) {
  return upcomingMovies.map((movie) => localizeMovie(movie, locale));
}

export function getLocalizedCinemas(locale: Locale) {
  return cinemas.map((cinema) => localizeCinema(cinema, locale));
}

export function getLocalizedHeroBanners(locale: Locale) {
  return heroBanners.map((banner) => localizeBanner(banner, locale));
}

export function getLocalizedPromotions(locale: Locale) {
  if (locale === "vi") {
    return promotions.map((promotion) => ({
      ...promotion,
      title: translateVi(promotion.title),
      description: translateVi(promotion.description),
    }));
  }

  return promotions.map((promotion) => ({
    ...promotion,
    title: translate(promotion.title),
    description: translate(promotion.description),
  }));
}

export function getLocalizedQuickBookingOptions(locale: Locale) {
  if (locale === "vi") {
    return quickBookingOptions;
  }

  return {
    movieOptions: getLocalizedNowShowingMovies(locale).map((movie) => ({
      value: movie.slug,
      label: movie.title,
    })),
    cinemaOptions: getLocalizedCinemas(locale).map((cinema) => ({
      value: cinema.id,
      label: cinema.name,
    })),
    dateOptions: quickBookingOptions.dateOptions.map((item) => ({
      ...item,
      label: translate(item.label),
    })),
    formatOptions: quickBookingOptions.formatOptions,
  };
}

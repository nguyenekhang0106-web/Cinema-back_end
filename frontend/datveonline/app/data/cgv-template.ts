export type ShowTime = {
  cinemaId: string;
  cinemaName: string;
  room: string;
  dateLabel: string;
  times: string[];
};

export type MovieItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  genre: string;
  duration: string;
  rating: string;
  release: string;
  bookingLabel: string;
  gradient: string;
  formats: string[];

  // 🔥 Đổi tên 2 trường này cho khớp với Backend Java
  posterUrl: string;
  bannerUrl: string;

  synopsis: string;
  director: string;
  cast: string[];
  language: string;
  trailerLabel: string;
  showtimes: ShowTime[];
  featured?: boolean;
  trailerUrl?: string;
  status?: string;
};

export type CinemaItem = {
  id: string;
  name: string;
  area: string;
  address: string;
  features: string[];
  showtimes: string[];
};

export type BannerItem = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  accent: string;
  image: string;
  movieSlug: string;
};

export const cinemas: CinemaItem[] = [
  {
    id: "kct-skyline",
    name: "KCT Cinema Skyline",
    area: "Quan 1, TP.HCM",
    address: "58 Nguyen Hue, Ben Nghe, Quan 1",
    features: ["IMAX", "Laser", "Couple Seat", "Snack bar"],
    showtimes: ["09:15", "11:45", "14:20", "17:10", "20:40"],
  },
  {
    id: "kct-landmark",
    name: "KCT Cinema Landmark",
    area: "Binh Thanh, TP.HCM",
    address: "208 Nguyen Huu Canh, Binh Thanh",
    features: ["Gold Class", "Dolby Atmos", "Sweetbox"],
    showtimes: ["10:00", "12:30", "15:10", "18:25", "21:15"],
  },
  {
    id: "kct-riverside",
    name: "KCT Cinema Riverside",
    area: "Thu Duc, TP.HCM",
    address: "01 Sala Drive, Thu Duc",
    features: ["4DX", "Premium Seat", "Family zone"],
    showtimes: ["08:40", "11:20", "13:50", "16:40", "19:55"],
  },
];

export const nowShowingMovies: MovieItem[] = [
  {
    id: "movie-1",
    slug: "ke-danh-cap-anh-trang",
    title: "Ke Danh Cap Anh Trang",
    subtitle: "Moonlight Heist",
    genre: "Hanh dong | Giat gan",
    duration: "128 phut",
    rating: "T16",
    release: "Dang chieu",
    bookingLabel: "Best seller",
    gradient: "linear-gradient(135deg, #111827, #7c2d12)",
    formats: ["2D", "IMAX", "4DX"],
    posterUrl:
      "https://images.pexels.com/photos/22908923/pexels-photo-22908923.jpeg?cs=srgb&dl=pexels-matt-richmond-314917881-22908923.jpg&fm=jpg",
    bannerUrl:
      "https://images.pexels.com/photos/12661846/pexels-photo-12661846.jpeg?cs=srgb&dl=pexels-hussain-haqq-262050061-12661846.jpg&fm=jpg",
    synopsis:
      "Sau mot vu trom kim cuong bat thanh, mot doi cuu dieu tra vien va mot tay hacker tre buoc vao cuoc truy duoi xuyen dem trong thanh pho khong bao gio ngu.",
    director: "Tran Minh Khang",
    cast: ["Hoang Quan", "Khanh Linh", "Bao Nam"],
    language: "Phu de va long tieng",
    trailerLabel: "Trailer chinh thuc",
    showtimes: [
      {
        cinemaId: "kct-skyline",
        cinemaName: "KCT Cinema Skyline",
        room: "Phong 05 - IMAX",
        dateLabel: "Hom nay",
        times: ["11:45", "14:20", "17:10", "20:40"],
      },
      {
        cinemaId: "kct-landmark",
        cinemaName: "KCT Cinema Landmark",
        room: "Phong 03 - Gold",
        dateLabel: "Hom nay",
        times: ["10:00", "15:10", "18:25", "21:15"],
      },
    ],
  },
  {
    id: "movie-2",
    slug: "dem-trong-rap-cu",
    title: "Dem Trong Rap Cu",
    subtitle: "The Old Hall",
    genre: "Bi an | Tam ly",
    duration: "114 phut",
    rating: "T18",
    release: "Dang chieu",
    bookingLabel: "Hot",
    gradient: "linear-gradient(135deg, #1f2937, #7c2d12)",
    formats: ["2D", "ScreenX"],
    posterUrl:
      "https://images.pexels.com/photos/7991320/pexels-photo-7991320.jpeg?cs=srgb&dl=pexels-tima-miroshnichenko-7991320.jpg&fm=jpg",
    bannerUrl:
      "https://images.pexels.com/photos/7991257/pexels-photo-7991257.jpeg?cs=srgb&dl=pexels-tima-miroshnichenko-7991257.jpg&fm=jpg",
    synopsis:
      "Mot nhom ban quay tro lai rap phim bo hoang noi ho da tung lon len, nhung man dem do dan bien thanh chuoi ky uc va ao giac khong ai muon doi mat.",
    director: "Nguyen Duc Tri",
    cast: ["Dieu Nhi", "Le Gia Huy", "Minh Anh"],
    language: "Phu de",
    trailerLabel: "Teaser mystery",
    showtimes: [
      {
        cinemaId: "kct-riverside",
        cinemaName: "KCT Cinema Riverside",
        room: "Phong 07 - ScreenX",
        dateLabel: "Hom nay",
        times: ["13:50", "16:40", "19:55"],
      },
      {
        cinemaId: "kct-skyline",
        cinemaName: "KCT Cinema Skyline",
        room: "Phong 02 - Standard",
        dateLabel: "Ngay mai",
        times: ["09:15", "12:10", "18:10"],
      },
    ],
  },
  {
    id: "movie-3",
    slug: "huong-vi-mua-he-cuoi",
    title: "Huong Vi Mua He Cuoi",
    subtitle: "Last Summer Flavor",
    genre: "Tinh cam | Am nhac",
    duration: "109 phut",
    rating: "T13",
    release: "Dang chieu",
    bookingLabel: "Dat truoc",
    gradient: "linear-gradient(135deg, #b45309, #be123c)",
    formats: ["2D", "Gold Class"],
    posterUrl:
      "https://images.pexels.com/photos/8261816/pexels-photo-8261816.jpeg?cs=srgb&dl=pexels-cottonbro-8261816.jpg&fm=jpg",
    bannerUrl:
      "https://images.pexels.com/photos/7991320/pexels-photo-7991320.jpeg?cs=srgb&dl=pexels-tima-miroshnichenko-7991320.jpg&fm=jpg",
    synopsis:
      "Hai nguoi tre gap lai nhau tai mot cum rap giua thanh pho, va chuyen tinh muon mang cua ho duoc dan dat bang am nhac, ky uc va nhung buoi chieu cuoi he.",
    director: "Pham Gia Linh",
    cast: ["Anh Tu", "Ngoc Han", "Thanh Nhan"],
    language: "Long tieng va phu de",
    trailerLabel: "MV trailer",
    showtimes: [
      {
        cinemaId: "kct-landmark",
        cinemaName: "KCT Cinema Landmark",
        room: "Phong 01 - Gold",
        dateLabel: "Hom nay",
        times: ["12:30", "15:20", "19:10"],
      },
      {
        cinemaId: "kct-riverside",
        cinemaName: "KCT Cinema Riverside",
        room: "Phong 03 - Premium",
        dateLabel: "Cuoi tuan",
        times: ["10:10", "14:30", "20:15"],
      },
    ],
  },
  {
    id: "movie-4",
    slug: "anh-sang-cuoi-duong-ham",
    title: "Anh Sang Cuoi Duong Ham",
    subtitle: "Light Below",
    genre: "Phieu luu | Vien tuong",
    duration: "136 phut",
    rating: "T13",
    release: "Dang chieu",
    bookingLabel: "IMAX",
    gradient: "linear-gradient(135deg, #0f766e, #1d4ed8)",
    formats: ["2D", "IMAX", "Laser"],
    posterUrl:
      "https://images.pexels.com/photos/7991257/pexels-photo-7991257.jpeg?cs=srgb&dl=pexels-tima-miroshnichenko-7991257.jpg&fm=jpg",
    bannerUrl:
      "https://images.pexels.com/photos/8261823/pexels-photo-8261823.jpeg?cs=srgb&dl=pexels-cottonbro-8261823.jpg&fm=jpg",
    synopsis:
      "Trong mot tuong lai can kiem nang luong, nhom ky su tre phai lao vao he thong duong ham ngam de kich hoat lai nguon sang cuoi cung cho thanh pho.",
    director: "Vo Huy Cuong",
    cast: ["Minh Kiet", "Bao Chau", "Quoc Thai"],
    language: "Phu de",
    trailerLabel: "Trailer IMAX",
    showtimes: [
      {
        cinemaId: "kct-skyline",
        cinemaName: "KCT Cinema Skyline",
        room: "Phong 06 - Laser",
        dateLabel: "Hom nay",
        times: ["10:25", "13:15", "16:35", "20:00"],
      },
      {
        cinemaId: "kct-landmark",
        cinemaName: "KCT Cinema Landmark",
        room: "Phong 08 - IMAX",
        dateLabel: "Ngay mai",
        times: ["11:30", "15:45", "19:40"],
      },
    ],
  },
];

export const upcomingMovies: MovieItem[] = [
  {
    id: "movie-5",
    slug: "mat-troi-lan-thu-hai",
    title: "Mat Troi Lan Thu Hai",
    subtitle: "Second Sun",
    genre: "Vien tuong | Chinh kich",
    duration: "121 phut",
    rating: "T16",
    release: "Khoi chieu 26/04",
    bookingLabel: "Coming soon",
    gradient: "linear-gradient(135deg, #312e81, #9f1239)",
    formats: ["2D", "IMAX"],
    posterUrl:
      "https://images.pexels.com/photos/8261823/pexels-photo-8261823.jpeg?cs=srgb&dl=pexels-cottonbro-8261823.jpg&fm=jpg",
    bannerUrl:
      "https://images.pexels.com/photos/12661846/pexels-photo-12661846.jpeg?cs=srgb&dl=pexels-hussain-haqq-262050061-12661846.jpg&fm=jpg",
    synopsis:
      "Khi mot ve tinh phat hien hien tuong quang hoc la tren bau troi, mot phi hanh doan buoc vao su that co the thay doi hanh tinh.",
    director: "Le Thanh Son",
    cast: ["Quang Dung", "Uyen Vy", "Hoang Phuc"],
    language: "Phu de",
    trailerLabel: "First look",
    showtimes: [],
  },
  {
    id: "movie-6",
    slug: "ban-con-nghe-mua-roi",
    title: "Ban Con Nghe Mua Roi",
    subtitle: "Hear the Rain Again",
    genre: "Tinh cam | Chua lanh",
    duration: "104 phut",
    rating: "T13",
    release: "Khoi chieu 30/04",
    bookingLabel: "Sap mo ban",
    gradient: "linear-gradient(135deg, #0f766e, #0f172a)",
    formats: ["2D"],
    posterUrl:
      "https://images.pexels.com/photos/7991320/pexels-photo-7991320.jpeg?cs=srgb&dl=pexels-tima-miroshnichenko-7991320.jpg&fm=jpg",
    bannerUrl:
      "https://images.pexels.com/photos/7991257/pexels-photo-7991257.jpeg?cs=srgb&dl=pexels-tima-miroshnichenko-7991257.jpg&fm=jpg",
    synopsis:
      "Sau bien co gia dinh, mot nghe si piano tro ve thanh pho cu de tim lai am thanh va con nguoi da thay doi cuoc doi minh.",
    director: "Do Hoang Mai",
    cast: ["Nha Phuong", "Nhan Phuc Vinh"],
    language: "Long tieng",
    trailerLabel: "Official teaser",
    showtimes: [],
  },
];

export const allMovies = [...nowShowingMovies, ...upcomingMovies];

export const heroBanners: BannerItem[] = [
  {
    id: "banner-1",
    title:
      "Dat ve xem phim tai KCT Cinema nhanh, dep va ro rang tren moi man hinh",
    subtitle:
      "Template duoc mo rong tu homepage sang chi tiet phim, chon ghe, checkout va auth pages de tao thanh mot flow dat ve tron ven.",
    cta: "Dat ve ngay",
    accent: "KCT Cinema | IMAX & Gold Class",
    image:
      "https://images.pexels.com/photos/12661846/pexels-photo-12661846.jpeg?cs=srgb&dl=pexels-hussain-haqq-262050061-12661846.jpg&fm=jpg",
    movieSlug: "ke-danh-cap-anh-trang",
  },
  {
    id: "banner-2",
    title:
      "Them trailer, poster, uu dai va membership vao mot bo cuc ban ve co chuyen doi tot",
    subtitle:
      "Moi button chinh deu da duoc noi route, giup nguoi dung di tu homepage sang trang phim, dat ghe va thanh toan.",
    cta: "Xem phim hot",
    accent: "Dang chieu | Uu dai thanh vien",
    image:
      "https://images.pexels.com/photos/8261823/pexels-photo-8261823.jpeg?cs=srgb&dl=pexels-cottonbro-8261823.jpg&fm=jpg",
    movieSlug: "dem-trong-rap-cu",
  },
  {
    id: "banner-3",
    title:
      "Su dung san bo anh cinema de demo truoc khi ban gui poster va banner that",
    subtitle:
      "Toi da dung anh remote co san de lap day giao dien, ban co the doi sang tai nguyen cua rieng minh bat ky luc nao.",
    cta: "Mo trang phim",
    accent: "Poster tam thoi | Pexels assets",
    image:
      "https://images.pexels.com/photos/7991320/pexels-photo-7991320.jpeg?cs=srgb&dl=pexels-tima-miroshnichenko-7991320.jpg&fm=jpg",
    movieSlug: "huong-vi-mua-he-cuoi",
  },
];

export const promotions = [
  {
    id: "promo-1",
    title: "Thu 4 KCT Member",
    description: "Dong gia 79.000d cho ve 2D va giam 20% combo bap nuoc.",
  },
  {
    id: "promo-2",
    title: "Dat online - nhan uu dai",
    description: "Mien phi nang size nuoc khi thanh toan online truoc 18:00.",
  },
  {
    id: "promo-3",
    title: "Sinh vien di rap",
    description:
      "Gia uu dai cho xuat truoc 17:00 khi xac minh tai khoan thanh vien.",
  },
];

export const quickBookingOptions = {
  movieOptions: nowShowingMovies.map((movie) => ({
    value: movie.slug,
    label: movie.title,
  })),
  cinemaOptions: cinemas.map((cinema) => ({
    value: cinema.id,
    label: cinema.name,
  })),
  dateOptions: [
    { value: "today", label: "Hom nay" },
    { value: "tomorrow", label: "Ngay mai" },
    { value: "weekend", label: "Cuoi tuan" },
  ],
  formatOptions: [
    { value: "2d", label: "2D" },
    { value: "imax", label: "IMAX" },
    { value: "4dx", label: "4DX" },
    { value: "gold", label: "Gold Class" },
  ],
};

export function getMovieBySlug(slug: string) {
  return allMovies.find((movie) => movie.slug === slug);
}

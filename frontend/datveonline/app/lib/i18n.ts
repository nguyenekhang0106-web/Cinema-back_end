export type Locale = "vi" | "en";

export function isLocale(value: string): value is Locale {
  return value === "vi" || value === "en";
}

type Dictionary = {
  header: {
    nav: Array<{ href: string; label: string }>;
    topLinks: string[];
    searchPlaceholder: string;
    quickBooking: string;
    showtimes: string;
    club: string;
    tagline: string;
    login: string;
    register: string;
  };
  home: {
    allMovies: string;
    loginRegister: string;
    clubAccountTitle: string;
    clubAccountDescription: string;
    nowShowing: string;
    comingSoon: string;
    movieSectionTitle: string;
    movieSectionDescription: string;
    movieTags: string[];
    detail: string;
    book: string;
    viewDetails: string;
    cinemaTitle: string;
    cinemaDescription: string;
    promoTitle: string;
    sitePartsTitle: string;
    siteParts: string[];
    newsTitle: string;
    newsDescription: string;
    newsItems: Array<{ key: string; title: string; desc: string }>;
    movieFeedTitle: string;
    movieFeedDescription: string;
  };
  quickBooking: {
    title: string;
    description: string;
    byMovie: string;
    byCinema: string;
    selectMovie: string;
    selectCinema: string;
    selectDate: string;
    selectFormat: string;
    searchShowtimes: string;
    missingSelection: string;
    integrationTitle: string;
    integrationDescription: string;
    backendHint: string;
  };
  footer: {
    description: string;
    navigation: string;
    availableParts: string;
    items: string[];
  };
  movieDetail: {
    director: string;
    cast: string;
    bookNow: string;
    showtimes: string;
    highlights: string;
    temporaryMedia: string;
    highlightItems: string[];
    temporaryMediaDescription: string;
  };
  seatSelection: {
    title: string;
    seatMapTag: string;
    screen: string;
    available: string;
    sold: string;
    couple: string;
    summary: string;
    selectedSeats: string;
    noneSelected: string;
    subtotal: string;
    continuePayment: string;
    chooseSeatWarning: string;
    integrationTitle: string;
    integrationDescription: string;
    integrationButton: string;
    seatStatusNote: string;
  };
  checkout: {
    title: string;
    successTitle: string;
    successSubtitle: (props: {
      seats: string[];
      movieTitle: string;
      cinemaName: string;
      time: string;
    }) => string;
    home: string;
    account: string;
    orderConfirmed: string;
    fullName: string;
    fullNameRequired: string;
    phone: string;
    phoneRequired: string;
    email: string;
    emailRequired: string;
    paymentMethod: string;
    card: string;
    wallet: string;
    counter: string;
    confirmPayment: string;
    orderSummary: string;
    showtime: string;
    seats: string;
    total: string;
    invalidOrder: string;
    integrationTitle: string;
    integrationDescription: string;
    integrationButton: string;
  };
  auth: {
    loginTitle: string;
    loginDescription: string;
    registerTitle: string;
    registerDescription: string;
    fullName: string;
    fullNameRequired: string;
    password: string;
    passwordRequired: string;
    confirmPassword: string;
    confirmPasswordRequired: string;
    login: string;
    register: string;
    noAccount: string;
    hasAccount: string;
    registerNow: string;
    emailRequired: string;
    roleLabel: string;
    roleDescription: string;
    roleAdmin: string;
    roleUser: string;
  };
  pages: {
    movies: {
      eyebrow: string;
      title: string;
      description: string;
    };
    cinemas: {
      eyebrow: string;
      title: string;
      description: string;
      showtimeHint: string;
    };
    member: {
      eyebrow: string;
      title: string;
      description: string;
      features: Array<{ title: string; desc: string }>;
    };
    cultureplex: {
      eyebrow: string;
      title: string;
      description: string;
    };
    admin: {
      eyebrow: string;
      title: string;
      description: string;
      stats: Array<{ label: string; value: string }>;
      sections: Array<{ title: string; desc: string }>;
    };
    user: {
      eyebrow: string;
      title: string;
      description: string;
      stats: Array<{ label: string; value: string }>;
      sections: Array<{ title: string; desc: string }>;
    };
    placeholderCards: Array<{ title: string; desc: string }>;
  };
};

const dictionaries: Record<Locale, Dictionary> = {
  vi: {
    header: {
      nav: [
        { href: "/", label: "Trang chủ" },
        { href: "/phim", label: "Phim" },
        { href: "/rap-gia-ve", label: "Rạp & Giá vé" },
        { href: "/thanh-vien", label: "Thành viên" },
        { href: "/cultureplex", label: "Cultureplex" },
      ],
      topLinks: ["Ưu đãi thành viên", "Vé của tôi / Đơn hàng"],
      searchPlaceholder: "Tìm phim, rạp, ưu đãi, bài viết...",
      quickBooking: "Đặt vé nhanh",
      showtimes: "Lịch chiếu",
      club: "KCT Club",
      tagline: "Đặt vé xem phim online",
      login: "Đăng nhập",
      register: "Đăng ký",
    },
    home: {
      allMovies: "Xem tất cả phim",
      loginRegister: "Đăng nhập / Đăng ký",
      clubAccountTitle: "Tài khoản KCT Club",
      clubAccountDescription:
        "Đăng nhập để tích điểm, nhận ưu đãi, lưu lịch sử đặt vé và mở khóa các khuyến mãi thành viên.",
      nowShowing: "Phim đang chiếu",
      comingSoon: "Phim sắp chiếu",
      movieSectionTitle: "Phim",
      movieSectionDescription:
        "Phần danh sách phim sẽ được nối với back-end Java và dữ liệu trong database ở bước tích hợp.",
      movieTags: ["Chi tiết phim", "Đặt ghế", "Checkout"],
      detail: "Chi tiết phim",
      book: "Đặt vé",
      viewDetails: "Xem chi tiết",
      cinemaTitle: "Rạp & lịch chiếu",
      cinemaDescription:
        "Chọn rạp, xem format và giờ chiếu. Việc khóa ghế và giữ chỗ sẽ do back-end xử lý.",
      promoTitle: "Ưu đãi",
      sitePartsTitle: "Các phần giao diện đã có",
      siteParts: [
        "Trang chủ và các khu vực giới thiệu",
        "Trang phim, đăng nhập, đăng ký",
        "Giao diện chọn ghế và thanh toán",
        "Dashboard admin và dashboard user",
      ],
      newsTitle: "Tin mới & sự kiện",
      newsDescription:
        "Khu vực dành cho event, review phim, trailer và campaign theo mùa.",
      newsItems: [
        {
          key: "opening-week",
          title: "Tuần phim mới",
          desc: "Đồng bộ homepage và trang phim với campaign ra mắt của từng tựa phim.",
        },
        {
          key: "showtime-reminder",
          title: "Nhắc lịch chiếu",
          desc: "Giữ luồng điều hướng rõ ràng từ lịch chiếu sang chọn ghế và thanh toán.",
        },
        {
          key: "member-benefits",
          title: "Quyền lợi thành viên",
          desc: "Đẩy voucher, ưu đãi và quyền lợi hạng thành viên trên toàn bộ website.",
        },
      ],
      movieFeedTitle: "Danh sách phim sẽ lấy từ database",
      movieFeedDescription:
        "Hiện tại phần front-end chỉ giữ chỗ giao diện. Khi có API Java, bạn chỉ cần bind dữ liệu vào khu vực này.",
    },
    quickBooking: {
      title: "Đặt vé nhanh",
      description:
        "Giao diện sẵn sàng để nối API phim, rạp, ngày chiếu và format từ back-end Java.",
      byMovie: "Theo phim",
      byCinema: "Theo rạp",
      selectMovie: "Chọn phim",
      selectCinema: "Chọn rạp",
      selectDate: "Chọn ngày",
      selectFormat: "Format",
      searchShowtimes: "Tìm suất chiếu",
      missingSelection: "Hãy chọn phim và rạp.",
      integrationTitle: "Chờ đồng bộ dữ liệu từ back-end",
      integrationDescription:
        "Danh sách phim nổi bật, lịch chiếu và trạng thái booking sẽ được lấy từ database thông qua API.",
      backendHint: "Gợi ý tích hợp: Java API -> movie/showtime/cinema endpoints",
    },
    footer: {
      description:
        "Giao diện đặt vé xem phim online bằng Next.js và Ant Design, đã tách song ngữ Việt - Anh, có sẵn homepage, auth, dashboard và các màn hình chờ tích hợp API.",
      navigation: "Điều hướng",
      availableParts: "Thành phần sẵn có",
      items: [
        "Bản tiếng Việt và tiếng Anh",
        "Dashboard admin và user",
        "UI chọn ghế chờ tích hợp API",
        "Form đăng nhập, đăng ký, thanh toán",
      ],
    },
    movieDetail: {
      director: "Đạo diễn",
      cast: "Diễn viên",
      bookNow: "Đặt vé ngay",
      showtimes: "Lịch chiếu",
      highlights: "Điểm nổi bật",
      temporaryMedia: "Hình ảnh tạm thời",
      highlightItems: [
        "Khu vực chi tiết phim đang để sẵn cấu trúc để nhận dữ liệu từ API phim.",
        "Showtime, rating, poster và nội dung mô tả nên được đổ từ back-end Java.",
        "Giao diện vẫn giữ nguyên để bạn chỉ cần nối dữ liệu ở bước sau.",
      ],
      temporaryMediaDescription:
        "Ảnh hiện tại chỉ là ảnh minh họa cho giao diện. Bạn có thể thay bằng poster chính thức bất kỳ lúc nào.",
    },
    seatSelection: {
      title: "Chọn ghế",
      seatMapTag: "Sơ đồ ghế KCT Cinema",
      screen: "MÀN HÌNH",
      available: "Ghế trống",
      sold: "Ghế đã bán",
      couple: "Ghế đôi",
      summary: "Tóm tắt vé",
      selectedSeats: "Ghế đã chọn",
      noneSelected: "Chưa có dữ liệu",
      subtotal: "Tạm tính",
      continuePayment: "Tiếp tục thanh toán",
      chooseSeatWarning: "Hãy chọn ít nhất một ghế.",
      integrationTitle: "Giao diện chọn ghế chờ nối API",
      integrationDescription:
        "Trạng thái ghế, giữ ghế theo phiên đăng nhập và xác nhận booking cần được lấy từ back-end và database.",
      integrationButton: "Chờ dữ liệu ghế từ server",
      seatStatusNote: "Front-end chỉ hiển thị layout. Không xử lý giữ ghế cục bộ.",
    },
    checkout: {
      title: "Thanh toán",
      successTitle: "Thanh toán thành công",
      successSubtitle: ({ seats, movieTitle, cinemaName, time }) =>
        `Bạn đã đặt ${seats.join(", ")} cho ${movieTitle} tại ${cinemaName} lúc ${time}.`,
      home: "Về trang chủ",
      account: "Xem tài khoản",
      orderConfirmed: "Đơn hàng đã được xác nhận.",
      fullName: "Họ và tên",
      fullNameRequired: "Nhập họ và tên.",
      phone: "Số điện thoại",
      phoneRequired: "Nhập số điện thoại.",
      email: "Email",
      emailRequired: "Nhập email.",
      paymentMethod: "Phương thức thanh toán",
      card: "Thẻ ngân hàng / Thẻ quốc tế",
      wallet: "Ví điện tử",
      counter: "Thanh toán tại quầy",
      confirmPayment: "Xác nhận thanh toán",
      orderSummary: "Tóm tắt đơn hàng",
      showtime: "Giờ chiếu",
      seats: "Ghế",
      total: "Tổng thanh toán",
      invalidOrder: "Không có dữ liệu đơn hàng hợp lệ.",
      integrationTitle: "Form thanh toán chỉ là giao diện",
      integrationDescription:
        "Thông tin đơn hàng, mã giảm giá, cổng thanh toán và xác nhận giao dịch cần được xử lý bởi back-end.",
      integrationButton: "Chờ tích hợp payment API",
    },
    auth: {
      loginTitle: "Đăng nhập KCT Cinema",
      loginDescription:
        "Chọn loại tài khoản để vào đúng dashboard sau khi đăng nhập. Phần xác thực thật sẽ do back-end Java xử lý.",
      registerTitle: "Đăng ký tài khoản KCT Cinema",
      registerDescription:
        "Form đăng ký chỉ là giao diện. Bạn có thể nối API đăng ký và xác thực email ở bước back-end.",
      fullName: "Họ và tên",
      fullNameRequired: "Nhập họ và tên.",
      password: "Mật khẩu",
      passwordRequired: "Nhập mật khẩu.",
      confirmPassword: "Xác nhận mật khẩu",
      confirmPasswordRequired: "Xác nhận mật khẩu.",
      login: "Đăng nhập",
      register: "Đăng ký",
      noAccount: "Chưa có tài khoản?",
      hasAccount: "Đã có tài khoản?",
      registerNow: "Đăng ký ngay",
      emailRequired: "Nhập email.",
      roleLabel: "Quyền tài khoản",
      roleDescription: "Chọn quyền để điều hướng giao diện sau đăng nhập.",
      roleAdmin: "Admin",
      roleUser: "User",
    },
    pages: {
      movies: {
        eyebrow: "Movie library",
        title: "Danh sách phim tại KCT Cinema",
        description:
          "Khu vực này đang để trống để nhận danh sách phim từ database qua back-end Java.",
      },
      cinemas: {
        eyebrow: "Rạp & Giá vé",
        title: "Hệ thống rạp KCT Cinema",
        description:
          "Danh sách rạp vẫn hiển thị giao diện. Booking theo giờ chiếu sẽ được kích hoạt sau khi nối API.",
        showtimeHint: "Giờ chiếu hiện chỉ là placeholder giao diện.",
      },
      member: {
        eyebrow: "KCT Club",
        title: "Thành viên KCT Cinema",
        description:
          "Khu vực dành cho tài khoản, hạng thành viên, lịch sử giao dịch, voucher và ưu đãi.",
        features: [
          {
            title: "Cấp bậc thành viên",
            desc: "Silver, Gold, Platinum và mốc điểm thưởng theo giao dịch.",
          },
          {
            title: "Voucher & ưu đãi",
            desc: "Khuyến mãi sinh nhật, combo snack, ticket bundle và sự kiện.",
          },
          {
            title: "Lịch sử đặt vé",
            desc: "Theo dõi vé đã mua, suất chiếu sắp tới và thông tin giao dịch.",
          },
        ],
      },
      cultureplex: {
        eyebrow: "Editorial / event hub",
        title: "Cultureplex",
        description:
          "Route dành cho sự kiện, bài viết, góc review phim và các campaign truyền thông theo phong cách CGV.",
      },
      admin: {
        eyebrow: "Admin console",
        title: "Trang quản trị KCT Cinema",
        description:
          "Dashboard này dành cho quản trị phim, lịch chiếu, đơn hàng, người dùng và nội dung trang chủ.",
        stats: [
          { label: "Module phim", value: "API" },
          { label: "Lịch chiếu", value: "DB" },
          { label: "Tài khoản", value: "RBAC" },
        ],
        sections: [
          {
            title: "Quản lý phim",
            desc: "Tạo, cập nhật, ẩn hiện phim nổi bật và nội dung hiển thị trên homepage.",
          },
          {
            title: "Quản lý lịch chiếu",
            desc: "Cấu hình suất chiếu, phòng chiếu, format và trạng thái mở bán từ database.",
          },
          {
            title: "Quản lý người dùng",
            desc: "Theo dõi tài khoản, phân quyền, voucher và lịch sử giao dịch.",
          },
        ],
      },
      user: {
        eyebrow: "User dashboard",
        title: "Trang người dùng KCT Cinema",
        description:
          "Dashboard này dành cho thông tin cá nhân, vé đã đặt, voucher, điểm thưởng và lịch sử giao dịch.",
        stats: [
          { label: "Vé đã mua", value: "--" },
          { label: "Voucher khả dụng", value: "--" },
          { label: "Điểm thành viên", value: "--" },
        ],
        sections: [
          {
            title: "Thông tin tài khoản",
            desc: "Hiển thị hồ sơ cá nhân, email, số điện thoại và trạng thái xác thực.",
          },
          {
            title: "Lịch sử đặt vé",
            desc: "Hiển thị đơn hàng, ghế đã đặt, rạp, suất chiếu và trạng thái thanh toán.",
          },
          {
            title: "Voucher & điểm thưởng",
            desc: "Quản lý voucher khả dụng, voucher đã dùng và điểm tích lũy.",
          },
        ],
      },
      placeholderCards: [
        {
          title: "Danh sách nội dung",
          desc: "Nơi đặt cards, table, tabs và filters cho route này.",
        },
        {
          title: "Banner / media",
          desc: "Có sẵn khu vực để bổ sung poster, thumbnail và event banner.",
        },
        {
          title: "CTA / thông tin phụ",
          desc: "Đặt call-to-action, góc ưu đãi và luồng điều hướng tiếp theo.",
        },
      ],
    },
  },
  en: {
    header: {
      nav: [
        { href: "/", label: "Home" },
        { href: "/phim", label: "Movies" },
        { href: "/rap-gia-ve", label: "Cinemas & Pricing" },
        { href: "/thanh-vien", label: "Membership" },
        { href: "/cultureplex", label: "Cultureplex" },
      ],
      topLinks: ["Member offers", "My tickets / Orders"],
      searchPlaceholder: "Search movies, cinemas, offers, articles...",
      quickBooking: "Quick booking",
      showtimes: "Showtimes",
      club: "KCT Club",
      tagline: "Online movie ticket booking",
      login: "Sign in",
      register: "Register",
    },
    home: {
      allMovies: "View all movies",
      loginRegister: "Sign in / Register",
      clubAccountTitle: "KCT Club Account",
      clubAccountDescription:
        "Sign in to collect points, unlock offers, save booking history, and activate member-only promotions.",
      nowShowing: "Now showing",
      comingSoon: "Coming soon",
      movieSectionTitle: "Movies",
      movieSectionDescription:
        "The featured movie blocks are intentionally left empty and ready to receive data from your Java back-end.",
      movieTags: ["Movie details", "Seat booking", "Checkout"],
      detail: "Movie details",
      book: "Book tickets",
      viewDetails: "View details",
      cinemaTitle: "Cinemas & showtimes",
      cinemaDescription:
        "Cinema cards remain on the front-end, while showtime booking and seat locking should come from the back-end.",
      promoTitle: "Promotions",
      sitePartsTitle: "Available UI modules",
      siteParts: [
        "Vietnamese and English versions",
        "Admin and user dashboards",
        "Seat-selection UI waiting for API data",
        "Auth and checkout forms",
      ],
      newsTitle: "News & events",
      newsDescription:
        "A flexible strip for campaigns, reviews, trailers, and seasonal event content.",
      newsItems: [
        {
          key: "opening-week",
          title: "Opening week",
          desc: "Keep homepage content aligned with each new release campaign.",
        },
        {
          key: "showtime-reminder",
          title: "Showtime reminder",
          desc: "Preserve a clear path from schedule browsing to seat booking and payment.",
        },
        {
          key: "member-benefits",
          title: "Member benefits",
          desc: "Surface vouchers, offers, and loyalty tiers across the full website.",
        },
      ],
      movieFeedTitle: "Movie feed will come from the database",
      movieFeedDescription:
        "This UI block is intentionally empty. Once your Java API is ready, you can bind real movie data here.",
    },
    quickBooking: {
      title: "Quick Booking",
      description:
        "This panel is prepared for movie, cinema, date, and format data coming from your Java back-end.",
      byMovie: "By movie",
      byCinema: "By cinema",
      selectMovie: "Select movie",
      selectCinema: "Select cinema",
      selectDate: "Select date",
      selectFormat: "Format",
      searchShowtimes: "Find showtimes",
      missingSelection: "Please choose both a movie and a cinema.",
      integrationTitle: "Waiting for back-end data",
      integrationDescription:
        "Featured movies, showtimes, and booking states should be loaded from the database through your API.",
      backendHint: "Suggested integration: Java API -> movie/showtime/cinema endpoints",
    },
    footer: {
      description:
        "An online movie ticket booking UI built with Next.js and Ant Design, now split into Vietnamese and English, with auth, dashboards, and API-ready placeholder flows.",
      navigation: "Navigation",
      availableParts: "Available sections",
      items: [
        "Vietnamese and English versions",
        "Admin and user dashboards",
        "Seat UI ready for API integration",
        "Auth and checkout forms",
      ],
    },
    movieDetail: {
      director: "Director",
      cast: "Cast",
      bookNow: "Book now",
      showtimes: "Showtimes",
      highlights: "Highlights",
      temporaryMedia: "Temporary media",
      highlightItems: [
        "The movie detail structure is ready to receive movie data from the API.",
        "Showtimes, ratings, posters, and descriptions should be provided by the Java back-end.",
        "The layout stays intact so you only need to bind data later.",
      ],
      temporaryMediaDescription:
        "Current imagery is only used to support the layout. You can swap it with official posters at any time.",
    },
    seatSelection: {
      title: "Seat selection",
      seatMapTag: "KCT Cinema seat map",
      screen: "SCREEN",
      available: "Available seat",
      sold: "Sold seat",
      couple: "Couple seat",
      summary: "Ticket summary",
      selectedSeats: "Selected seats",
      noneSelected: "No live data yet",
      subtotal: "Estimated total",
      continuePayment: "Continue to payment",
      chooseSeatWarning: "Please select at least one seat.",
      integrationTitle: "Seat UI waiting for API integration",
      integrationDescription:
        "Seat availability, seat locks per session, and booking confirmation must come from the back-end and database.",
      integrationButton: "Waiting for seat data from server",
      seatStatusNote: "Front-end only renders the layout. No local seat-locking logic is applied.",
    },
    checkout: {
      title: "Checkout",
      successTitle: "Payment successful",
      successSubtitle: ({ seats, movieTitle, cinemaName, time }) =>
        `You booked ${seats.join(", ")} for ${movieTitle} at ${cinemaName} at ${time}.`,
      home: "Back to home",
      account: "View account",
      orderConfirmed: "Your order has been confirmed.",
      fullName: "Full name",
      fullNameRequired: "Please enter your full name.",
      phone: "Phone number",
      phoneRequired: "Please enter your phone number.",
      email: "Email",
      emailRequired: "Please enter your email.",
      paymentMethod: "Payment method",
      card: "Bank card / International card",
      wallet: "E-wallet",
      counter: "Pay at counter",
      confirmPayment: "Confirm payment",
      orderSummary: "Order summary",
      showtime: "Showtime",
      seats: "Seats",
      total: "Total payment",
      invalidOrder: "No valid order data was provided.",
      integrationTitle: "Checkout form is UI-only",
      integrationDescription:
        "Order payloads, discount codes, payment gateways, and transaction confirmation need to be handled by the back-end.",
      integrationButton: "Waiting for payment API integration",
    },
    auth: {
      loginTitle: "Sign in to KCT Cinema",
      loginDescription:
        "Choose an account role to reach the correct dashboard after sign-in. Real authentication should be handled by your Java back-end.",
      registerTitle: "Create your KCT Cinema account",
      registerDescription:
        "This registration form is UI-only. You can connect sign-up and email verification APIs later.",
      fullName: "Full name",
      fullNameRequired: "Please enter your full name.",
      password: "Password",
      passwordRequired: "Please enter your password.",
      confirmPassword: "Confirm password",
      confirmPasswordRequired: "Please confirm your password.",
      login: "Sign in",
      register: "Register",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      registerNow: "Register now",
      emailRequired: "Please enter your email.",
      roleLabel: "Account role",
      roleDescription: "Choose the role-based dashboard destination.",
      roleAdmin: "Admin",
      roleUser: "User",
    },
    pages: {
      movies: {
        eyebrow: "Movie library",
        title: "Movie lineup at KCT Cinema",
        description:
          "This section is intentionally empty so the movie catalog can be loaded from your database through the Java back-end.",
      },
      cinemas: {
        eyebrow: "Cinemas & Pricing",
        title: "KCT Cinema locations",
        description:
          "Cinema cards remain available on the front-end. Actual booking per showtime should be activated after API integration.",
        showtimeHint: "Showtimes are currently visual placeholders only.",
      },
      member: {
        eyebrow: "KCT Club",
        title: "KCT Cinema Membership",
        description:
          "This area is reserved for account details, membership tiers, transaction history, vouchers, and member perks.",
        features: [
          {
            title: "Membership tiers",
            desc: "Silver, Gold, Platinum, and loyalty milestones tied to spending.",
          },
          {
            title: "Vouchers & offers",
            desc: "Birthday rewards, snack combos, ticket bundles, and event campaigns.",
          },
          {
            title: "Booking history",
            desc: "Track purchased tickets, upcoming sessions, and payment details.",
          },
        ],
      },
      cultureplex: {
        eyebrow: "Editorial / event hub",
        title: "Cultureplex",
        description:
          "This route is intended for events, editorial stories, movie reviews, and campaign-led content.",
      },
      admin: {
        eyebrow: "Admin console",
        title: "KCT Cinema admin dashboard",
        description:
          "This dashboard is for managing movies, showtimes, orders, users, and homepage content.",
        stats: [
          { label: "Movie module", value: "API" },
          { label: "Showtimes", value: "DB" },
          { label: "Accounts", value: "RBAC" },
        ],
        sections: [
          {
            title: "Movie management",
            desc: "Create, update, and control featured movie visibility on the homepage.",
          },
          {
            title: "Showtime management",
            desc: "Configure screenings, auditoriums, formats, and sales status from the database.",
          },
          {
            title: "User management",
            desc: "Track accounts, permissions, vouchers, and transaction history.",
          },
        ],
      },
      user: {
        eyebrow: "User dashboard",
        title: "KCT Cinema user dashboard",
        description:
          "This dashboard is for profile data, booked tickets, vouchers, loyalty points, and transaction history.",
        stats: [
          { label: "Booked tickets", value: "--" },
          { label: "Available vouchers", value: "--" },
          { label: "Member points", value: "--" },
        ],
        sections: [
          {
            title: "Account profile",
            desc: "Display personal details, email, phone number, and verification state.",
          },
          {
            title: "Booking history",
            desc: "Display orders, booked seats, cinemas, showtimes, and payment status.",
          },
          {
            title: "Vouchers & points",
            desc: "Manage available vouchers, redeemed vouchers, and accumulated points.",
          },
        ],
      },
      placeholderCards: [
        {
          title: "Content blocks",
          desc: "Use this area for cards, tables, tabs, and filters on the route.",
        },
        {
          title: "Banner / media",
          desc: "A prepared area for posters, thumbnails, and event banners.",
        },
        {
          title: "CTA / supporting info",
          desc: "Place calls to action, offer highlights, and next-step navigation here.",
        },
      ],
    },
  },
};

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

export function localizeHref(href: string, locale: Locale) {
  if (locale === "vi") {
    return href;
  }

  if (!href.startsWith("/") || href.startsWith("/en")) {
    return href;
  }

  return href === "/" ? "/en" : `/en${href}`;
}

export function getLocaleSwitchHref(pathname: string, targetLocale: Locale) {
  if (targetLocale === "vi") {
    return pathname === "/en" ? "/" : pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  }

  return pathname === "/" ? "/en" : pathname.startsWith("/en") ? pathname : `/en${pathname}`;
}

export function formatCurrency(locale: Locale, value: number) {
  return `${value.toLocaleString(locale === "en" ? "en-US" : "vi-VN")}đ`;
}

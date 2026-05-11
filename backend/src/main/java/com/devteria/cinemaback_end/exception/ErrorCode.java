package com.devteria.cinemaback_end.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "UNCATEGORIZED error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Invalid message key", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
    FULLNAME_INVALID(1003, "Fullname must be least 3 characters", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1004, "Password must be least 8 characters",  HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "User not existed", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You don't have permission", HttpStatus.FORBIDDEN),
    EMAIL_NOT_BLANK(1008, "Email không được để trống", HttpStatus.BAD_REQUEST),
    EMAIL_NOT_FORMAT(1009, "Email không đúng định dạng", HttpStatus.BAD_REQUEST),
    FULLNAME_NOT_BLANK(1010, "Họ tên không được để trống", HttpStatus.BAD_REQUEST),
    PASSWORD_NOT_BLANK(1011, "Mật khẩu không được để trống", HttpStatus.BAD_REQUEST),
    PHONE_INVALID(1012, "Số điện thoại không hợp lệ", HttpStatus.BAD_REQUEST),
    CITIZEN_ID_INVALID(1013, "CCCD không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_GENDER(1014, "Giới tính không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_DOB_FORMAT(1015, "Ngày sinh không đúng định dạng yyyy-MM-dd", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1016, "Email đã được sử dụng", HttpStatus.BAD_REQUEST),
    PHONE_EXISTED(1017, "Số điện thoại đã được sử dụng", HttpStatus.BAD_REQUEST),
    CITIZEN_ID_EXISTED(1018, "CCCD đã được sử dụng", HttpStatus.BAD_REQUEST),
    CCCD_NOT_BLANK(1019, "CCCD Không được để trống", HttpStatus.BAD_REQUEST),
    PHONE_NOT_BLANK(1020, "Số điện thoại không dược để trống", HttpStatus.BAD_REQUEST),
    INVALID_AREA(1021, "Khu vực (Tỉnh/Thành phố) không hợp lệ", HttpStatus.BAD_REQUEST),

    TITLE_NOT_BLANK(1022, "Tên phim không được để trống", HttpStatus.BAD_REQUEST),
    DURATION_NOT_NULL(1023, "Thời lượng phim không được để trống", HttpStatus.BAD_REQUEST),
    DURATION_MIN_INVALID(1024, "Thời lượng phim phải từ 1 phút trở lên", HttpStatus.BAD_REQUEST),
    GENRE_NOT_NULL(1025, "Thể loại phim không được để trống", HttpStatus.BAD_REQUEST),
    LANGUAGE_NOT_NULL(1026, "Ngôn ngữ phim không được để trống", HttpStatus.BAD_REQUEST),
    AGE_RESTRICTION_NOT_NULL(1027, "Giới hạn độ tuổi không được để trống", HttpStatus.BAD_REQUEST),
    RELEASE_DATE_NOT_NULL(1028, "Ngày phát hành không được để trống", HttpStatus.BAD_REQUEST),

    // Xử lý bắt lỗi khi nhập sai Enum của Movie
    INVALID_GENRE(1029, "Thể loại phim không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_LANGUAGE(1030, "Ngôn ngữ phim không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_AGE_RESTRICTION(1031, "Mã giới hạn độ tuổi không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_MOVIE_STATUS(1032, "Trạng thái phim không hợp lệ", HttpStatus.BAD_REQUEST),
    MOVIE_NOT_EXISTED(1033, "Phim không tồn tại", HttpStatus.NOT_FOUND),

    EMAIL_NOT_VERIFIED(1034, "Vui lòng xác thực email trước khi đăng nhập", HttpStatus.UNAUTHORIZED),
    INVALID_VERIFICATION_TOKEN(1035, "Mã xác thực không đúng hoặc đã hết hạn", HttpStatus.BAD_REQUEST),
    UNABLE_TO_SEND_EMAIL(1036, "Không thể gửi email xác thực", HttpStatus.INTERNAL_SERVER_ERROR),

    VERIFY_CODE_NOT_BLANK(1037, "Mã xác thực không được để trống", HttpStatus.BAD_REQUEST),
    VERIFY_CODE_INVALID(1038, "Mã xác thực phải gồm đúng 6 chữ số", HttpStatus.BAD_REQUEST),
    USER_ID_NOT_BLANK(1039, "Mã người dùng không được để trống", HttpStatus.BAD_REQUEST),
    VERIFY_TOKEN_NOT_BLANK(1040, "Mã phiên xác thực không được để trống", HttpStatus.BAD_REQUEST),
    
    INVALID_VERIFICATION_CODE(1041, "Mã xác thực không đúng", HttpStatus.BAD_REQUEST),
    VERIFICATION_ATTEMPTS_EXCEEDED(1042, "Bạn đã nhập sai quá nhiều lần. Hãy resend mã xác thực", HttpStatus.BAD_REQUEST),
    RESEND_TOO_FREQUENT(1043, "Vui lòng chờ trước khi resend mã xác thực tiếp theo", HttpStatus.BAD_REQUEST),
    
    PASSWORD_MUST_CONTAIN_UPPERCASE_LOWERCASE_DIGIT_SPECIAL_CHAR(1044, "Mật khẩu phải chứa ít nhất: chữ hoa, chữ thường, số, ký tự đặc biệt (@$!%*?&)", HttpStatus.BAD_REQUEST),
    TOO_MANY_LOGIN_ATTEMPTS(1045, "Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau", HttpStatus.TOO_MANY_REQUESTS),
    
    // New Registration Flow - OTP & Rate Limiting
    REGISTRATION_BLOCKED(1046, "Tài khoản này bị khóa do quá nhiều lần gửi OTP. Vui lòng thử lại sau 24 giờ", HttpStatus.FORBIDDEN),
    OTP_EXPIRED(1047, "OTP hết hạn. Vui lòng gửi lại", HttpStatus.GONE),
    INVALID_OTP(1048, "OTP không đúng", HttpStatus.BAD_REQUEST),
    OTP_ATTEMPTS_EXCEEDED(1049, "Bạn đã nhập OTP sai 3 lần. Vui lòng gửi lại OTP mới", HttpStatus.BAD_REQUEST),
    OTP_SEND_LIMIT_EXCEEDED(1050, "Bạn đã gửi quá 5 lần trong 24 giờ. Vui lòng thử lại sau 24 giờ", HttpStatus.TOO_MANY_REQUESTS),
    OTP_RESEND_COOLDOWN(1051, "Vui lòng chờ trước khi gửi OTP tiếp theo", HttpStatus.TOO_MANY_REQUESTS),
    REGISTRATION_EXPIRED(1052, "Thời hạn đăng kí 7 ngày đã hết. Vui lòng đăng kí lại", HttpStatus.GONE),
    INVALID_REQUEST(1053, "Yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),

    START_TIME_NOT_NULL(1054, "Giờ bắt đầu không được để trống", HttpStatus.BAD_REQUEST),
    END_TIME_NOT_NULL(1055, "Giờ kết thúc không được để trống", HttpStatus.BAD_REQUEST),
    BASE_PRICE_NOT_NULL(1056, "Giá gốc không được để trống", HttpStatus.BAD_REQUEST),
    PRICE_MUST_BE_POSITIVE(1057, "Giá vé phải lớn hơn 0", HttpStatus.BAD_REQUEST),
    SHOWTIME_FORMAT_NOT_NULL(1058, "Định dạng chiếu không được để trống", HttpStatus.BAD_REQUEST),
    MOVIE_ID_NOT_BLANK(1059, "ID Phim không được để trống", HttpStatus.BAD_REQUEST),
    HALL_ID_NOT_BLANK(1060, "ID Phòng chiếu không được để trống", HttpStatus.BAD_REQUEST),

    // Lỗi Enum Format / Status
    INVALID_SHOWTIME_FORMAT(1061, "Định dạng lịch chiếu không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_SHOWTIME_STATUS(1062, "Trạng thái lịch chiếu không hợp lệ", HttpStatus.BAD_REQUEST),

    // Lỗi nghiệp vụ (Business Logic)
    SHOWTIME_NOT_EXISTED(1063, "Lịch chiếu không tồn tại", HttpStatus.NOT_FOUND),
    INVALID_TIME_RANGE(1064, "Giờ kết thúc phải sau giờ bắt đầu", HttpStatus.BAD_REQUEST),
    START_TIME_IN_PAST(1065, "Giờ bắt đầu không được nằm trong quá khứ", HttpStatus.BAD_REQUEST),
    SHOWTIME_OVERLAP(1066, "Phòng chiếu này đã có lịch chiếu bị trùng lặp thời gian", HttpStatus.CONFLICT),

    RATING_NOT_NULL(1068, "Điểm đánh giá không được để trống", HttpStatus.BAD_REQUEST),
    RATING_MIN_INVALID(1069, "Điểm đánh giá tối thiểu là 1 sao", HttpStatus.BAD_REQUEST),
    RATING_MAX_INVALID(1070, "Điểm đánh giá tối đa là 5 sao", HttpStatus.BAD_REQUEST),
    COMMENT_TOO_LONG(1071, "Bình luận không được vượt quá 1000 ký tự", HttpStatus.BAD_REQUEST),

    // Các lỗi nghiệp vụ cho Review
    REVIEW_NOT_EXISTED(1072, "Đánh giá không tồn tại", HttpStatus.NOT_FOUND),
    REVIEW_ALREADY_EXISTED(1073, "Bạn đã đánh giá bộ phim này rồi", HttpStatus.CONFLICT),

    // Lỗi cho Cinema
    CINEMA_NAME_NOT_BLANK(1074, "Tên rạp không được để trống", HttpStatus.BAD_REQUEST),
    CINEMA_ADDRESS_NOT_BLANK(1075, "Địa chỉ rạp không được để trống", HttpStatus.BAD_REQUEST),
    HOTLINE_NOT_BLANK(1076, "Hotline không được để trống", HttpStatus.BAD_REQUEST),
    HOTLINE_INVALID(1077, "Số điện thoại hotline không hợp lệ", HttpStatus.BAD_REQUEST),
    AREA_NOT_NULL(1081, "Khu vực không được để trống", HttpStatus.BAD_REQUEST),

    // Bổ sung sẵn lỗi nghiệp vụ dùng cho Service sau này
    CINEMA_NOT_EXISTED(1079, "Rạp chiếu phim không tồn tại", HttpStatus.NOT_FOUND),
    CINEMA_ALREADY_EXISTED(1080, "Tên rạp chiếu phim đã tồn tại", HttpStatus.CONFLICT),

    // Các lỗi của Hall
    HALL_NAME_NOT_BLANK(1084, "Tên phòng chiếu không được để trống", HttpStatus.BAD_REQUEST),
    TOTAL_SEATS_NOT_NULL(1085, "Tổng số ghế không được để trống", HttpStatus.BAD_REQUEST),
    TOTAL_SEATS_MIN_INVALID(1086, "Tổng số ghế phải từ 20 trở lên", HttpStatus.BAD_REQUEST),
    CINEMA_ID_NOT_BLANK(1087, "ID rạp chiếu phim không được để trống", HttpStatus.BAD_REQUEST),

    // Lỗi logic dùng cho Service sau này
    HALL_NOT_EXISTED(1088, "Phòng chiếu không tồn tại", HttpStatus.NOT_FOUND),
    HALL_ALREADY_EXISTED(1089, "Tên phòng chiếu này đã tồn tại trong rạp", HttpStatus.CONFLICT),

    IMAGE_URL_NOT_BLANK(1090, "Đường dẫn hình ảnh không được để trống", HttpStatus.BAD_REQUEST),
    DISPLAY_ORDER_NOT_NULL(1091, "Thứ tự hiển thị không được để trống", HttpStatus.BAD_REQUEST),
    DISPLAY_ORDER_INVALID(1092, "Thứ tự hiển thị phải từ 0 trở lên", HttpStatus.BAD_REQUEST),
    BANNER_NOT_EXISTED(1093, "Banner không tồn tại", HttpStatus.NOT_FOUND),

    ROW_NAME_NOT_BLANK(1094, "Tên hàng ghế không được để trống", HttpStatus.BAD_REQUEST),
    SEAT_NUMBER_NOT_NULL(1095, "Số ghế không được để trống", HttpStatus.BAD_REQUEST),
    SEAT_NUMBER_INVALID(1096, "Số ghế phải lớn hơn 0", HttpStatus.BAD_REQUEST),
    SEAT_TYPE_NOT_NULL(1097, "Loại ghế không được để trống", HttpStatus.BAD_REQUEST),

    // Lỗi logic cho Service
    SEAT_NOT_EXISTED(1098, "Ghế không tồn tại", HttpStatus.NOT_FOUND),
    SEAT_ALREADY_EXISTED(1099, "Ghế này đã tồn tại trong phòng chiếu", HttpStatus.CONFLICT),

    ROW_NAMES_NOT_EMPTY(1100, "Danh sách tên hàng ghế không được để trống", HttpStatus.BAD_REQUEST),
    SEATS_PER_ROW_NOT_NULL(1101, "Số lượng ghế mỗi hàng không được để trống", HttpStatus.BAD_REQUEST),
    SEATS_PER_ROW_INVALID(1102, "Số lượng ghế mỗi hàng phải lớn hơn 0", HttpStatus.BAD_REQUEST),
    TOO_MANY_REQUESTS(1103, "Quá nhiều yêu cầu. Vui lòng thử lại sau", HttpStatus.TOO_MANY_REQUESTS),

    PASSWORD_ALREADY_USED(1104, "Mật khẩu mới không được trùng với mật khẩu cũ", HttpStatus.BAD_REQUEST),

    // Các lỗi cho Article (Bài viết)
    ARTICLE_TITLE_NOT_BLANK(1105, "Tiêu đề bài viết không được để trống", HttpStatus.BAD_REQUEST),
    SUMMARY_NOT_BLANK(1106, "Tóm tắt bài viết không được để trống", HttpStatus.BAD_REQUEST),
    CONTENT_NOT_BLANK(1107, "Nội dung bài viết không được để trống", HttpStatus.BAD_REQUEST),
    ARTICLE_TYPE_NOT_NULL(1108, "Loại bài viết không được để trống", HttpStatus.BAD_REQUEST),
    ARTICLE_STATUS_NOT_NULL(1109, "Trạng thái bài viết không được để trống", HttpStatus.BAD_REQUEST),
    ARTICLE_NOT_EXISTED(1110, "Bài viết không tồn tại", HttpStatus.NOT_FOUND),

    // Các lỗi cho Concession (Đồ ăn/Thức uống)
    CONCESSION_NAME_NOT_BLANK(1111, "Tên đồ ăn/thức uống không được để trống", HttpStatus.BAD_REQUEST),
    PRICE_NOT_NULL(1112, "Giá tiền không được để trống", HttpStatus.BAD_REQUEST),
    PRICE_MIN_INVALID(1113, "Giá tiền không được là số âm", HttpStatus.BAD_REQUEST),
    CATEGORY_NOT_NULL(1114, "Phân loại không được để trống", HttpStatus.BAD_REQUEST),

    // Lỗi logic dùng cho Service
    CONCESSION_NOT_EXISTED(1115, "Đồ ăn/thức uống không tồn tại", HttpStatus.NOT_FOUND),

    // Các lỗi cho Promotion (Khuyến mãi)
    PROMO_TITLE_NOT_BLANK(1116, "Tiêu đề khuyến mãi không được để trống", HttpStatus.BAD_REQUEST),
    PROMO_CODE_NOT_BLANK(1117, "Mã giảm giá không được để trống", HttpStatus.BAD_REQUEST),
    DISCOUNT_PERCENT_NOT_NULL(1118, "Phần trăm giảm giá không được để trống", HttpStatus.BAD_REQUEST),
    DISCOUNT_PERCENT_INVALID(1119, "Phần trăm giảm giá phải lớn hơn 0", HttpStatus.BAD_REQUEST),
    VALID_FROM_NOT_NULL(1120, "Ngày bắt đầu không được để trống", HttpStatus.BAD_REQUEST),
    VALID_UNTIL_NOT_NULL(1121, "Ngày kết thúc không được để trống", HttpStatus.BAD_REQUEST),
    MIN_PURCHASE_INVALID(1122, "Giá trị đơn hàng tối thiểu không hợp lệ", HttpStatus.BAD_REQUEST),
    MAX_DISCOUNT_INVALID(1123, "Mức giảm tối đa không hợp lệ", HttpStatus.BAD_REQUEST),
    USAGE_LIMIT_INVALID(1124, "Giới hạn số lượt dùng không hợp lệ", HttpStatus.BAD_REQUEST),

    // Lỗi logic dùng cho Service sau này
    PROMO_CODE_EXISTED(1125, "Mã giảm giá này đã tồn tại", HttpStatus.CONFLICT),
    PROMO_NOT_EXISTED(1126, "Khuyến mãi không tồn tại", HttpStatus.NOT_FOUND),
    PROMO_TARGET_NOT_NULL(1127, "Phạm vi áp dụng của mã giảm giá không được để trống", HttpStatus.BAD_REQUEST),

    TICKET_NOT_EXISTED(1128, "Vé không tồn tại", HttpStatus.NOT_FOUND),
    TICKET_ALREADY_SCANNED(1129, "Vé này đã được quét và sử dụng trước đó", HttpStatus.BAD_REQUEST),
    TICKET_CANCELLED(1130, "Vé này đã bị hủy, không thể sử dụng", HttpStatus.BAD_REQUEST),

    // Bổ sung các lỗi logic của Promotion (Khuyến mãi) bị thiếu
    PROMO_EXPIRED(1131, "Mã giảm giá đã hết hạn sử dụng", HttpStatus.BAD_REQUEST),
    PROMO_OUT_OF_USAGE(1132, "Mã giảm giá đã hết lượt sử dụng", HttpStatus.BAD_REQUEST),
    PROMO_MIN_PURCHASE_NOT_MET(1133, "Chưa đạt giá trị đơn hàng tối thiểu để áp dụng mã", HttpStatus.BAD_REQUEST),

    // Các lỗi cho Booking (Đặt vé & Thanh toán)
    SHOWTIME_ID_NOT_BLANK(1134, "Vui lòng chọn suất chiếu", HttpStatus.BAD_REQUEST),
    SEAT_LIST_NOT_EMPTY(1135, "Vui lòng chọn ít nhất 1 ghế", HttpStatus.BAD_REQUEST),
    BOOKING_NOT_EXISTED(1136, "Hóa đơn đặt vé không tồn tại", HttpStatus.NOT_FOUND),

    // Lỗi quan trọng nhất của hệ thống đặt vé
    SEAT_ALREADY_BOOKED(1137, "Rất tiếc, ghế bạn chọn đã có người đặt. Vui lòng chọn ghế khác!", HttpStatus.CONFLICT),
    // ==========================================
    // MODULE PAYMENT (THANH TOÁN)
    // ==========================================
    BOOKING_ID_NOT_BLANK(1138, "Mã hóa đơn không được để trống", HttpStatus.BAD_REQUEST),
    PAYMENT_METHOD_NOT_NULL(1139, "Phương thức thanh toán không được để trống", HttpStatus.BAD_REQUEST),

    // Lỗi logic cho Service
    INVALID_PAYMENT_METHOD(1140, "Phương thức thanh toán không hợp lệ", HttpStatus.BAD_REQUEST),
    PAYMENT_NOT_EXISTED(1141, "Giao dịch thanh toán không tồn tại", HttpStatus.NOT_FOUND),
    PAYMENT_FAILED(1142, "Thanh toán thất bại. Vui lòng thử lại", HttpStatus.BAD_REQUEST),

    // 🔥 Lỗi cực kỳ quan trọng để chống "Double Billing" (Khách bị trừ tiền 2 lần)
    PAYMENT_ALREADY_PROCESSED(1143, "Hóa đơn này đã được thanh toán thành công trước đó", HttpStatus.CONFLICT),
    // ==========================================
    // MODULE FILE & AMAZON S3
    // ==========================================
    FILE_IS_EMPTY(1144, "File tải lên không được để trống", HttpStatus.BAD_REQUEST),
    INVALID_FILE_FORMAT(1145, "Định dạng không hợp lệ. Chỉ chấp nhận file hình ảnh (PNG, JPG, JPEG...)", HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE(1146, "Dung lượng file quá lớn. Vui lòng chọn file dưới 5MB", HttpStatus.BAD_REQUEST), // Bạn có thể dùng HttpStatus.PAYLOAD_TOO_LARGE cũng được
    UPLOAD_FILE_FAILED(1147, "Lỗi hệ thống: Không thể tải file lên máy chủ", HttpStatus.INTERNAL_SERVER_ERROR),
    DELETE_FILE_FAILED(1148, "Lỗi hệ thống: Không thể xóa file trên máy chủ", HttpStatus.INTERNAL_SERVER_ERROR),

    POSTER_IS_EMPTY(1149, "File ảnh poster không được để trống", HttpStatus.BAD_REQUEST),
    BANNER_IS_EMPTY(1150, "File ảnh banner không được để trống", HttpStatus.BAD_REQUEST),
    DIRECTOR_NOT_EMPTY(1151, "Danh sách đạo diễn không được để trống", HttpStatus.BAD_REQUEST),
    ACTORS_NOT_EMPTY(1152, "Danh sách diễn viên không được để trống", HttpStatus.BAD_REQUEST),
    // ==========================================
    // MODULE BOOKING & PAYMENT (Bổ sung nâng cao)
    // ==========================================
    // Khi người dùng thanh toán quá chậm, qua 10 phút giữ ghế thì ghế bị nhả ra
    SEAT_HOLD_EXPIRED(1153, "Thời gian giữ ghế đã hết. Vui lòng chọn lại ghế", HttpStatus.BAD_REQUEST),
    // Khi cố tình thanh toán/truy cập một hóa đơn đã bị hệ thống hủy (do hết giờ hoặc user tự hủy)
    BOOKING_ALREADY_CANCELLED(1154, "Hóa đơn này đã bị hủy trước đó", HttpStatus.BAD_REQUEST),
    // Khi rạp phim có sự cố (ví dụ: cúp điện) và cần hủy vé + hoàn tiền cho khách
    REFUND_FAILED(1155, "Lỗi hệ thống: Không thể hoàn tiền cho giao dịch này", HttpStatus.INTERNAL_SERVER_ERROR),
    // Dành cho giỏ hàng (Concession) khi đặt vé
    CONCESSION_QUANTITY_INVALID(1156, "Số lượng đồ ăn/thức uống không hợp lệ", HttpStatus.BAD_REQUEST),
    PASSWORD_NOT_CORRECT(1157, "Mật khẩu cũ không chính xác", HttpStatus.BAD_REQUEST),
    ;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private int code;
    private String message;
    private HttpStatusCode statusCode;

}

# Chạy KCT Cinema trên máy phát triển

[← Về trang giới thiệu](../README.md)

## 1. Chuẩn bị

- JDK **25**, theo `backend/pom.xml`.
- Maven Wrapper có sẵn trong `backend`; nếu wrapper không khởi động được, dùng Maven đã cài và thay `./mvnw` bằng `mvn`.
- Node.js tương thích Next.js 16 và npm.
- MySQL với database đã tạo; Redis và RabbitMQ đang hoạt động.
- Thông tin SMTP, VNPay sandbox và S3 để chạy các chức năng tích hợp.

Không bắt buộc dùng lại tài khoản cloud của nhóm. Có thể cung cấp dịch vụ của riêng bạn qua cấu hình môi trường.

## 2. Cấu hình backend

Tạo file **`backend/.env.properties`**. Đây là file cấu hình riêng, đã được `.gitignore` bỏ qua. Các giá trị bên dưới là placeholder; thay bằng thông tin của môi trường bạn sử dụng.

```properties
DB_URL=jdbc:mysql://localhost:3306/cinema
DB_USERNAME=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD

JWT_SIGNER_KEY=YOUR_LONG_RANDOM_SIGNING_SECRET

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VIRTUAL_HOST=/
RABBITMQ_SSL_ENABLED=false
RABBITMQ_AUTO_STARTUP=true

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=YOUR_EMAIL
MAIL_PASSWORD=YOUR_SMTP_PASSWORD
MAIL_FROM=YOUR_EMAIL

VNPAY_TMN_CODE=YOUR_SANDBOX_TMN_CODE
VNPAY_HASH_SECRET=YOUR_SANDBOX_HASH_SECRET
VNPAY_RETURN_URL=http://localhost:3000/vnpay-return

AWS_ACCESS_KEY=YOUR_ACCESS_KEY
AWS_SECRET_KEY=YOUR_SECRET_KEY
AWS_REGION=ap-southeast-2
AWS_BUCKET_NAME=YOUR_BUCKET
```

Backend đang ký JWT bằng HS512: đặt `JWT_SIGNER_KEY` là chuỗi ngẫu nhiên có ít nhất 64 byte (ví dụ 64 ký tự ASCII ngẫu nhiên trở lên). Không dùng nguyên placeholder để kiểm thử xác thực hoặc tích hợp.

**Redis SSL:** `application.yml` hiện bật `spring.data.redis.ssl.enabled: true`. Nếu dùng Redis local không TLS, đặt biến môi trường trước khi chạy backend (PowerShell):

```powershell
$env:SPRING_DATA_REDIS_SSL_ENABLED = "false"
```

Nếu dùng Redis cloud có TLS, giữ cấu hình SSL phù hợp nhà cung cấp. Tương tự, cấu hình MySQL SSL trong `DB_URL` và RabbitMQ TLS theo dịch vụ của bạn.

**Database:** tạo database `cinema` trước nếu dùng ví dụ local. `ddl-auto: update` cho phép Hibernate tạo/cập nhật bảng khi khởi động; không phục hồi dữ liệu cũ. Repo chưa kèm SQL dump hoặc bộ dữ liệu mẫu đầy đủ. Có thể nhập dữ liệu qua trang quản trị; cần có rạp, phòng, ghế, phim và suất chiếu trước khi đặt vé.

## 3. Khởi động backend

Từ thư mục gốc repo trên Windows:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Trên macOS/Linux, dùng `./mvnw spring-boot:run` trong `backend`.

Nếu chạy bằng IntelliJ IDEA, chọn class `CinemaBackEndApplication`, JDK 25 và **Working directory = thư mục `backend`**. File `.env.properties` được nạp theo thư mục làm việc.

API mặc định: `http://localhost:9090/cinema`. Đây là địa chỉ gốc API, không phải trang giao diện.

## 4. Khởi động frontend

Tạo `frontend/datveonline/.env.local`:

```properties
NEXT_PUBLIC_CINEMA_API_URL=http://localhost:9090/cinema
```

Mở terminal khác từ thư mục gốc repo:

```powershell
cd frontend/datveonline
npm ci
npm run dev
```

Truy cập `http://localhost:3000`. Trang quản trị ở `/admin` và yêu cầu tài khoản có quyền phù hợp. Logic khởi tạo tài khoản/role nằm trong [ApplicationInitConfig](../backend/src/main/java/com/devteria/cinemaback_end/configuration/ApplicationInitConfig.java); thay thông tin tài khoản mặc định trước khi dùng môi trường công khai.

## 5. Build và kiểm tra

Backend, trong `backend`:

```powershell
.\mvnw.cmd test
.\mvnw.cmd package -DskipTests
```

Frontend, trong `frontend/datveonline`:

```powershell
npm run lint
npm run build
```

Đây là các lệnh để tự kiểm tra, không phải tuyên bố các kiểm tra đã chạy thành công trong lần cập nhật tài liệu này.

## Những điểm dễ gặp khi chạy lại đồ án

| Hiện tượng | Cần kiểm tra |
| --- | --- |
| Không đọc được `DB_URL` hoặc các placeholder | Working directory và vị trí `.env.properties` |
| Maven không tải được dependency | Kết nối tới Maven repository, cấu hình proxy/cache; không dùng offline nếu chưa có dependency |
| Redis lỗi SSL/handshake | Redis local thường không TLS; đối chiếu `SPRING_DATA_REDIS_SSL_ENABLED` |
| Trang web lên nhưng không có phim | Kết nối API, DB có dữ liệu, biến `NEXT_PUBLIC_CINEMA_API_URL` |
| Không có email hoặc vé sau thanh toán | Cấu hình SMTP, RabbitMQ, log consumer và trạng thái giao dịch |
| Không chạy được Dockerfile hiện tại | Dockerfile đang dùng Java 24 trong khi POM hiện yêu cầu Java 25; đồng bộ JDK trước khi build Docker |

## Hiển thị tài liệu trên GitHub

`README.md` nằm ở gốc repo để GitHub hiển thị phần giới thiệu. Các ảnh dùng đường dẫn tương đối trong `docs/images`, nên cần commit cả README và thư mục `docs` cùng nhau. Không cần bật GitHub Pages để xem phần trình bày này.

Trong mục **About** của repo, có thể dùng mô tả: `KCT Cinema — Full-stack cinema booking & management | Spring Boot, Next.js, MySQL, Redis, RabbitMQ`.

Topics gợi ý: `cinema`, `ticket-booking`, `spring-boot`, `nextjs`, `mysql`, `redis`, `rabbitmq`, `vnpay`, `student-project`. Chỉ thêm URL demo khi đã kiểm tra frontend và các dịch vụ liên quan hoạt động.

"use client";

import { ReloadOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Radio,
  Select,
  Space,
  Typography,
  Tabs,
  Modal,
} from "antd";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  loginWithBackend,
  registerWithBackend,
  verifyOtpWithBackend,
  forgotPasswordApi, // 🔥 THÊM DÒNG NÀY
  resendOtpApi,
} from "../lib/cinema-api";
import { localizeHref } from "../lib/i18n";
import { useAuthSession } from "./auth-session-provider";
import { useDictionary, useLocale } from "./locale-provider";

import {
  MailOutlined,
  LockOutlined,
  UserOutlined,
  PhoneOutlined,
} from "@ant-design/icons";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const dictionary = useDictionary();
  const { message } = App.useApp();
  const { signIn } = useAuthSession();

  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    // Nếu thời gian đã chạm 0 thì không làm gì cả
    if (resendCooldown <= 0) return;

    // Thiết lập đồng hồ chạy mỗi 1000ms (1 giây)
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer); // Dừng đồng hồ khi chạm 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Dọn dẹp đồng hồ nếu người dùng chuyển trang
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // 🔥 2. THÊM LUÔN HÀM GỬI LẠI MÃ VÀO ĐÂY
  // 🔥 2. THÊM LUÔN HÀM GỬI LẠI MÃ VÀO ĐÂY
  const handleResendOtp = async () => {
    try {
      // 🔥 SỬ DỤNG state registeredEmail thay vì form để không bị mất dữ liệu khi chuyển màn hình
      const email = registeredEmail || registerForm.getFieldValue("email");
      if (!email) {
        message.error("Không tìm thấy email để gửi lại mã!");
        return;
      }

      const res = await resendOtpApi(email);
      if (res.code === 1000) {
        // Lấy thông báo trực tiếp từ Backend (nếu có), nếu không có mới dùng câu mặc định
        message.success(
          res.result?.message ||
            res.message ||
            "Mã OTP mới đã được gửi đến email của bạn!",
        );

        // Ép kiểu an toàn về số (Number) để đồng hồ đếm ngược chắc chắn chạy được
        const cooldown = Number(res.result?.resendCooldownSeconds);
        setResendCooldown(!isNaN(cooldown) && cooldown > 0 ? cooldown : 300); // Đổi mặc định thành 300s
      } else {
        // [CỰC KỲ QUAN TRỌNG] Nếu gửi lỗi do click quá nhanh (Backend chặn spam)
        // Ta cũng cần lấy thời gian phạt từ Backend để khóa nút lại trên giao diện
        if (res.result?.resendCooldownSeconds) {
          setResendCooldown(Number(res.result.resendCooldownSeconds));
        }

        message.error(
          res.message || "Không thể gửi lại mã OTP. Vui lòng thử lại sau!",
        );
      }
    } catch (error) {
      message.error("Lỗi mạng khi gửi lại OTP");
    }
  };

  // Thiết lập Tab mặc định dựa trên URL
  const [activeTab, setActiveTab] = useState(mode);

  const registerCopy =
    locale === "en" ? registerContent.en : registerContent.vi;
  const loginCopy = locale === "en" ? loginContent.en : loginContent.vi;

  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  const [captchaCode, setCaptchaCode] = useState(() => createCaptchaCode());
  const [submitting, setSubmitting] = useState(false);

  const [isOtpStep, setIsOtpStep] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otpForm] = Form.useForm();

  // State cho Quên mật khẩu
  const [forgotPwdModalOpen, setForgotPwdModalOpen] = useState(false);
  const [forgotPwdForm] = Form.useForm();
  const [forgotPwdLoading, setForgotPwdLoading] = useState(false);

  // Đổi trạng thái Tab và URL trên trình duyệt nhưng không tải lại trang
  const handleTabChange = (key: string) => {
    setActiveTab(key as "login" | "register");
    const targetUrl = key === "login" ? "/dang-nhap" : "/dang-ky";
    window.history.replaceState(null, "", localizeHref(targetUrl, locale));
  };

  // ==========================================
  // XỬ LÝ: GIAO DIỆN XÁC THỰC OTP
  // ==========================================
  if (isOtpStep) {
    return (
      <div className="w-full flex justify-center items-center py-12">
        <Card
          bordered={false}
          className="cinema-paper mx-auto max-w-[560px] w-full rounded-[28px] shadow-lg border border-[#ead6bb]"
        >
          <div className="text-center mb-6">
            <Typography.Title
              level={2}
              style={{ color: "#4a3426", marginTop: 0 }}
            >
              Xác thực Email
            </Typography.Title>
            <Typography.Paragraph style={{ color: "#6d5a46" }}>
              Hệ thống đã gửi một mã gồm 6 chữ số tới email{" "}
              <strong style={{ color: "#a61d24" }}>{registeredEmail}</strong>.
              <br />
              Vui lòng kiểm tra hộp thư (và mục Spam) để hoàn tất.
            </Typography.Paragraph>
          </div>
          <Form
            form={otpForm}
            layout="vertical"
            onFinish={async (values) => {
              setSubmitting(true);
              try {
                await verifyOtpWithBackend(registeredEmail, values.otp);
                message.success("Xác thực thành công! Bạn có thể đăng nhập.");
                setIsOtpStep(false);
                handleTabChange("login");
              } catch (error) {
                message.error("Mã OTP không chính xác hoặc đã hết hạn.");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <Form.Item
              name="otp"
              style={{ display: "flex", justifyContent: "center" }}
              rules={[
                { required: true, message: "Vui lòng nhập mã OTP." },
                { len: 6, message: "Mã OTP phải gồm đúng 6 chữ số." },
              ]}
            >
              <Input.OTP length={6} size="large" />
            </Form.Item>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              block
              loading={submitting}
              style={{ backgroundColor: "#14b8a6", borderColor: "#14b8a6" }}
            >
              Xác nhận mã
            </Button>

            <div className="mt-4 text-center">
              <Button
                type="link"
                disabled={resendCooldown > 0}
                onClick={handleResendOtp}
                className="text-gray-500 hover:text-[#a61d24] transition-colors"
              >
                {resendCooldown > 0
                  ? `Gửi lại mã sau ${resendCooldown}s`
                  : "Bạn chưa nhận được mã? Gửi lại ngay"}
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    );
  }

  // ==========================================
  // FORM 1: ĐĂNG NHẬP
  // ==========================================
  const loginContentForm = (
    <Form
      form={loginForm}
      layout="vertical"
      size="large"
      onFinish={async (values) => {
        setSubmitting(true);
        try {
          const auth = await loginWithBackend(
            String(values.email).trim().toLowerCase(),
            String(values.password),
          );
          signIn(auth.token, auth.user);
          message.success(loginCopy.loginSuccess);
          const nextPath = searchParams.get("next");
          router.push(
            nextPath ||
              localizeHref(
                auth.user.role === "admin" ? "/admin" : "/user",
                locale,
              ),
          );
        } catch (error) {
          message.error(
            error instanceof Error
              ? error.message
              : loginCopy.invalidCredentials,
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <Form.Item
        name="email"
        rules={[{ required: true, message: dictionary.auth.emailRequired }]}
      >
        <Input
          prefix={<MailOutlined className="text-gray-400 mr-2" />}
          placeholder={
            locale === "vi" ? "Email / Số điện thoại" : "Email / Phone"
          }
          className="rounded-lg bg-gray-50/50"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: dictionary.auth.passwordRequired }]}
      >
        <Input.Password
          prefix={<LockOutlined className="text-gray-400 mr-2" />}
          placeholder={dictionary.auth.password}
          className="rounded-lg bg-gray-50/50"
        />
      </Form.Item>

      <div className="flex justify-center mt-6">
        <Button
          type="primary"
          htmlType="submit"
          block
          loading={submitting}
          style={{ backgroundColor: "#14b8a6", borderColor: "#14b8a6" }}
          className="font-bold rounded-lg h-12 text-lg"
        >
          {dictionary.auth.login}
        </Button>
      </div>

      <div className="text-center mt-4">
        <span
          className="text-[#a61d24] cursor-pointer hover:underline font-medium"
          onClick={() => setForgotPwdModalOpen(true)} // 🔥 BẬT POPUP TẠI ĐÂY
        >
          Quên mật khẩu?
        </span>
      </div>
    </Form>
  );

  // ==========================================
  // FORM 2: ĐĂNG KÝ
  // ==========================================
  const registerContentForm = (
    <Form
      form={registerForm}
      layout="vertical"
      size="large"
      onFinish={async (values) => {
        setSubmitting(true);
        try {
          // 🔥 HỨNG KẾT QUẢ TỪ API TRẢ VỀ VÀO BIẾN res
          const res: any = await registerWithBackend({
            fullName: String(values.fullName),
            email: String(values.email).trim().toLowerCase(),
            phone: String(values.phone),
            password: String(values.password),
            citizenIdNumber: String(values.citizenId),
            gender:
              values.gender === "male"
                ? "Nam"
                : values.gender === "female"
                  ? "Nữ"
                  : "khác",
            dateOfBirth: buildBirthDate(
              values.birthYear,
              values.birthMonth,
              values.birthDay,
            ),
            area: provinceToArea(String(values.province)),
          });

          setRegisteredEmail(String(values.email).trim().toLowerCase());
          setIsOtpStep(true);

          // 🔥 1. ĐỒNG BỘ THÔNG BÁO TỪ BACKEND ("Đã gửi OTP mới" HOẶC "OTP cũ vẫn còn hạn")
          message.success(
            res?.result?.message ||
              res?.message ||
              registerCopy.registerSuccess,
          );

          // 🔥 2. ĐỒNG BỘ THỜI GIAN ĐẾM NGƯỢC CHÍNH XÁC TỪ BACKEND
          const cooldown = Number(res?.result?.resendCooldownSeconds);
          setResendCooldown(!isNaN(cooldown) && cooldown > 0 ? cooldown : 300);
        } catch (error: any) {
          message.error(
            error instanceof Error
              ? error.message
              : error?.message || registerCopy.registerFailed,
          );
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="grid gap-x-4 md:grid-cols-2">
        <Form.Item
          name="fullName"
          rules={[{ required: true, message: registerCopy.fullNameRequired }]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400 mr-2" />}
            placeholder={registerCopy.fullName}
            className="rounded-lg bg-gray-50/50"
          />
        </Form.Item>
        <Form.Item
          name="gender"
          rules={[{ required: true, message: registerCopy.genderRequired }]}
        >
          <Select
            placeholder={registerCopy.gender}
            options={[
              { label: registerCopy.male, value: "male" },
              { label: registerCopy.female, value: "female" },
              { label: registerCopy.other, value: "other" },
            ]}
          />
        </Form.Item>
      </div>

      <div className="grid gap-x-4 md:grid-cols-2">
        <Form.Item
          name="email"
          rules={[
            { required: true, message: dictionary.auth.emailRequired },
            { type: "email", message: dictionary.auth.emailRequired },
          ]}
        >
          <Input
            prefix={<MailOutlined className="text-gray-400 mr-2" />}
            placeholder="Email"
            className="rounded-lg bg-gray-50/50"
          />
        </Form.Item>
        <Form.Item
          name="phone"
          rules={[
            { required: true, message: registerCopy.phoneRequired },
            {
              pattern: /^(84|0[35789])\d{8}$/,
              message: registerCopy.phoneInvalid,
            },
          ]}
        >
          <Input
            prefix={<PhoneOutlined className="text-gray-400 mr-2" />}
            inputMode="tel"
            placeholder={registerCopy.phone}
            className="rounded-lg bg-gray-50/50"
          />
        </Form.Item>
      </div>

      <div className="grid gap-x-2 grid-cols-3 mb-6">
        <Form.Item
          name="birthDay"
          noStyle
          rules={[{ required: true, message: registerCopy.birthDateRequired }]}
        >
          <Select
            placeholder={registerCopy.day}
            options={days.map((day) => ({ label: day, value: day }))}
          />
        </Form.Item>
        <Form.Item
          name="birthMonth"
          noStyle
          rules={[{ required: true, message: registerCopy.birthDateRequired }]}
        >
          <Select
            placeholder={registerCopy.month}
            options={months.map((month) => ({ label: month, value: month }))}
          />
        </Form.Item>
        <Form.Item
          name="birthYear"
          noStyle
          rules={[{ required: true, message: registerCopy.birthDateRequired }]}
        >
          <Select
            placeholder={registerCopy.year}
            options={years.map((year) => ({ label: year, value: year }))}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
      </div>

      <div className="grid gap-x-4 md:grid-cols-2">
        <Form.Item
          name="province"
          rules={[{ required: true, message: registerCopy.provinceRequired }]}
        >
          <Select
            placeholder={registerCopy.province}
            showSearch
            optionFilterProp="label"
            options={VIETNAM_PROVINCES.map((province) => ({
              label: province,
              value: province,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="citizenId"
          rules={[
            { required: true, message: registerCopy.citizenIdRequired },
            { pattern: /^\d{12}$/, message: registerCopy.citizenIdInvalid },
          ]}
        >
          <Input
            inputMode="numeric"
            maxLength={12}
            placeholder={registerCopy.citizenId}
            className="rounded-lg bg-gray-50/50"
          />
        </Form.Item>
      </div>

      <div className="grid gap-x-4 md:grid-cols-2">
        <Form.Item
          name="password"
          rules={[
            { required: true, message: registerCopy.passwordRequired },
            { min: 8, message: registerCopy.passwordTooShort },
            {
              pattern:
                /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
              message: registerCopy.passwordWeak,
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400 mr-2" />}
            placeholder={registerCopy.password}
            className="rounded-lg bg-gray-50/50"
          />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true, message: registerCopy.confirmPasswordRequired },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(registerCopy.confirmPasswordMismatch),
                );
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-gray-400 mr-2" />}
            placeholder={registerCopy.confirmPassword}
            className="rounded-lg bg-gray-50/50"
          />
        </Form.Item>
      </div>

      <Form.Item required className="mb-2">
        <div className="auth-register-captcha-wrap border border-gray-200 p-2 rounded-lg bg-gray-50 flex items-center justify-between">
          <Image
            alt={registerCopy.captchaAlt}
            src={buildCaptchaDataUri(captchaCode)}
            width={220}
            height={78}
            className="rounded"
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => setCaptchaCode(createCaptchaCode())}
            size="middle"
            type="dashed"
          >
            {registerCopy.refreshCaptcha}
          </Button>
        </div>
      </Form.Item>

      <Form.Item
        name="captchaInput"
        rules={[
          { required: true, message: registerCopy.captchaRequired },
          () => ({
            validator(_, value) {
              if (
                typeof value === "string" &&
                value.trim().toUpperCase() === captchaCode
              ) {
                return Promise.resolve();
              }
              return Promise.reject(new Error(registerCopy.captchaMismatch));
            },
          }),
        ]}
      >
        <Input
          maxLength={6}
          placeholder={registerCopy.captchaPlaceholder}
          onPaste={(event) => event.preventDefault()}
          className="rounded-lg bg-gray-50/50 text-center uppercase tracking-[0.25em]"
        />
      </Form.Item>

      <div className="flex justify-center mt-6">
        <Button
          type="primary"
          htmlType="submit"
          block
          loading={submitting}
          style={{ backgroundColor: "#14b8a6", borderColor: "#14b8a6" }}
          className="font-bold rounded-lg h-12 text-lg"
        >
          {dictionary.auth.register}
        </Button>
      </div>
    </Form>
  );

  return (
    <div className="w-full flex flex-col justify-center items-center py-10 md:py-16">
      {/* Khối bọc Tabs: Đây mới là nơi giới hạn chiều rộng (chỉ giới hạn cái form) */}
      <div
        className="w-full bg-white rounded-xl shadow-lg overflow-hidden border border-[#ead6bb] metiz-auth-container mx-auto"
        style={{
          maxWidth: activeTab === "register" ? "800px" : "500px",
          transition: "max-width 0.3s ease",
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          centered
          size="large"
          className="metiz-auth-tabs m-0"
          items={[
            {
              key: "login",
              label: (
                <span className="px-6 md:px-12 font-bold text-base">
                  {dictionary.auth.login}
                </span>
              ),
              children: <div className="p-6 md:p-10">{loginContentForm}</div>,
            },
            {
              key: "register",
              label: (
                <span className="px-6 md:px-12 font-bold text-base">
                  {dictionary.auth.register}
                </span>
              ),
              children: (
                <div className="p-6 md:p-10">{registerContentForm}</div>
              ),
            },
          ]}
        />
      </div>

      {/* KHỐI MODAL QUÊN MẬT KHẨU */}
      <Modal
        title={
          <div className="text-center w-full pb-2">
            <Typography.Title level={3} style={{ margin: 0, color: "#4a3426" }}>
              Quên mật khẩu?
            </Typography.Title>
            <p className="text-gray-500 text-sm mt-2 font-normal">
              Nhập email đăng ký của bạn để nhận liên kết đặt lại mật khẩu.
            </p>
          </div>
        }
        open={forgotPwdModalOpen}
        onCancel={() => {
          setForgotPwdModalOpen(false);
          forgotPwdForm.resetFields();
        }}
        footer={null}
        centered
      >
        <Form
          form={forgotPwdForm}
          layout="vertical"
          onFinish={async (values) => {
            setForgotPwdLoading(true);
            try {
              await forgotPasswordApi(values.email);
              message.success(
                "Đã gửi liên kết! Vui lòng kiểm tra email của bạn.",
              );
              setForgotPwdModalOpen(false);
              forgotPwdForm.resetFields();
            } catch (error: any) {
              message.error(error.message);
            } finally {
              setForgotPwdLoading(false);
            }
          }}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không đúng định dạng!" },
            ]}
          >
            <Input
              prefix={<MailOutlined className="text-gray-400 mr-2" />}
              size="large"
              placeholder="Nhập email của bạn"
              className="rounded-lg bg-gray-50/50"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={forgotPwdLoading}
            style={{ backgroundColor: "#14b8a6", borderColor: "#14b8a6" }}
            className="font-bold rounded-lg h-12"
          >
            Gửi yêu cầu
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
//... GIỮ NGUYÊN CODE TỪ CONST DAYS TRỞ XUỐNG

const days = Array.from({ length: 31 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);
const months = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);
const years = Array.from({ length: 87 }, (_, index) => String(2025 - index));

const VIETNAM_PROVINCES = [
  "An Giang",
  "Bắc Ninh",
  "Cà Mau",
  "Cao Bằng",
  "Cần Thơ",
  "Đà Nẵng",
  "Đắk Lắk",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Nội",
  "Hà Tĩnh",
  "Hải Phòng",
  "Hưng Yên",
  "Huế",
  "Khánh Hòa",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Nghệ An",
  "Ninh Bình",
  "Phú Thọ",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sơn La",
  "Tây Ninh",
  "Thái Nguyên",
  "Thanh Hóa",
  "Thành phố Hồ Chí Minh",
  "Tuyên Quang",
  "Vĩnh Long",
] as const;

const registerContent = {
  vi: {
    kicker: "Biểu mẫu đăng kí thành viên",
    title: "Đăng kí tài khoản KCT Cinema",
    description:
      "Biểu mẫu này đã được thay theo đúng thông tin bạn yêu cầu, gồm giới tính, ngày sinh, tỉnh/thành mới, CCCD và mã xác nhận dạng ảnh.",
    bannerTitle: "Vào rạp nhanh hơn với tài khoản thành viên riêng của bạn.",
    bannerDescription:
      "Lưu thông tin đặt vé, theo dõi ưu đãi và chuẩn bị sẵn cho các suất chiếu mới mà không cần nhập lại từ đầu.",
    bannerAlt: "Banner đăng kí tài khoản KCT Cinema",
    fullName: "Họ tên",
    fullNameRequired: "Nhập họ tên.",
    fullNamePlaceholder: "Nguyễn Văn A",
    gender: "Giới tính",
    genderRequired: "Chọn giới tính.",
    male: "Nam",
    female: "Nữ",
    other: "Khác",
    birthDate: "Ngày sinh",
    birthDateRequired: "Chọn đầy đủ ngày, tháng, năm sinh.",
    day: "Ngày",
    month: "Tháng",
    year: "Năm",
    province: "Tỉnh/Thành phố",
    provinceRequired: "Chọn tỉnh hoặc thành phố.",
    provincePlaceholder: "Chọn tỉnh/thành sau sáp nhập",
    phone: "Số điện thoại",
    phoneRequired: "Nhập số điện thoại.",
    phoneInvalid: "Số điện thoại chưa đúng định dạng.",
    citizenId: "CCCD",
    citizenIdRequired: "Nhập số CCCD.",
    citizenIdInvalid: "CCCD phải gồm đúng 12 chữ số.",
    password: "Mật khẩu",
    passwordRequired: "Nhập mật khẩu.",
    passwordTooShort: "Mật khẩu cần ít nhất 8 ký tự.",
    passwordWeak: "Mật khẩu cần có chữ hoa, chữ thường, số và ký tự đặc biệt.",
    confirmPassword: "Xác nhận mật khẩu",
    confirmPasswordRequired: "Nhập lại mật khẩu.",
    confirmPasswordMismatch: "Mật khẩu xác nhận không khớp.",
    captcha: "Nhập mã xác nhận",
    captchaAlt: "Ảnh mã xác nhận",
    captchaRequired: "Nhập mã xác nhận.",
    captchaMismatch: "Mã xác nhận chưa đúng.",
    captchaPlaceholder: "Nhập lại mã đang hiển thị",
    refreshCaptcha: "Đổi mã",
    submit: "Đăng kí",
    registerSuccess: "Đăng kí thành công. Hãy kiểm tra email để nhập OTP.",
    registerFailed: "Đăng kí thất bại.",
  },
  en: {
    kicker: "Member registration form",
    title: "Create your KCT Cinema account",
    description:
      "This registration form now includes gender, date of birth, the updated merged province list, citizen ID, and an image-style verification code.",
    bannerTitle: "Join faster checkouts with your own cinema member profile.",
    bannerDescription:
      "Save your booking details, keep track of offers, and stay ready for the next movie release without re-entering everything.",
    bannerAlt: "KCT Cinema registration banner",
    fullName: "Full name",
    fullNameRequired: "Please enter your full name.",
    fullNamePlaceholder: "Nguyen Van A",
    gender: "Gender",
    genderRequired: "Please choose a gender.",
    male: "Male",
    female: "Female",
    other: "Other",
    birthDate: "Date of birth",
    birthDateRequired: "Please choose day, month, and year.",
    day: "Day",
    month: "Month",
    year: "Year",
    province: "Province / City",
    provinceRequired: "Please choose a province or city.",
    provincePlaceholder: "Choose one of the 34 current units",
    phone: "Phone number",
    phoneRequired: "Please enter your phone number.",
    phoneInvalid: "Phone number format is invalid.",
    citizenId: "Citizen ID",
    citizenIdRequired: "Please enter your citizen ID.",
    citizenIdInvalid: "Citizen ID must contain exactly 12 digits.",
    password: "Password",
    passwordRequired: "Please enter a password.",
    passwordTooShort: "Password must be at least 8 characters.",
    passwordWeak:
      "Password needs uppercase, lowercase, number, and special character.",
    confirmPassword: "Confirm password",
    confirmPasswordRequired: "Please confirm your password.",
    confirmPasswordMismatch: "Confirmation password does not match.",
    captcha: "Verification code",
    captchaAlt: "Verification code image",
    captchaRequired: "Please enter the verification code.",
    captchaMismatch: "Verification code is incorrect.",
    captchaPlaceholder: "Enter the code shown above",
    refreshCaptcha: "Refresh",
    submit: "Register",
    registerSuccess: "Registration started. Check your email for the OTP code.",
    registerFailed: "Registration failed.",
  },
} as const;

const DEMO_ACCOUNTS = [
  {
    role: "admin",
    email: "admin@gmail.com",
    password: "admin123",
    labelVi: "Tài khoản Admin demo",
    labelEn: "Demo Admin Account",
  },
  {
    role: "user",
    email: "user@kctcinema.vn",
    password: "User@123",
    labelVi: "Tài khoản User demo",
    labelEn: "Demo User Account",
  },
] as const;

const loginContent = {
  vi: {
    demoTitle: "Tài khoản trải nghiệm nhanh",
    passwordLabel: "Mật khẩu",
    useAccount: "Dùng tài khoản này",
    invalidCredentials: "Email hoặc mật khẩu không đúng tài khoản demo.",
    roleMismatch: "Tôi đã tự đổi đúng quyền theo tài khoản bạn chọn.",
    loginSuccess: "Đăng nhập thành công.",
  },
  en: {
    demoTitle: "Quick demo accounts",
    passwordLabel: "Password",
    useAccount: "Use this account",
    invalidCredentials: "Email or password does not match any demo account.",
    roleMismatch: "The role has been adjusted to match the selected account.",
    loginSuccess: "Signed in successfully.",
  },
} as const;

function buildBirthDate(year?: string, month?: string, day?: string) {
  if (!year || !month || !day) {
    return undefined;
  }

  return `${year}-${month}-${day}`;
}

function provinceToArea(province: string) {
  const normalized = province.toLowerCase();

  if (
    normalized.includes("hồ chí minh") ||
    normalized.includes("ho chi minh")
  ) {
    return "HO_CHI_MINH";
  }
  if (normalized.includes("hà nội") || normalized.includes("ha noi")) {
    return "HA_NOI";
  }
  if (normalized.includes("đà nẵng") || normalized.includes("da nang")) {
    return "DA_NANG";
  }
  if (normalized.includes("cần thơ") || normalized.includes("can tho")) {
    return "CAN_THO";
  }

  return "HO_CHI_MINH";
}

function createCaptchaCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}

function buildCaptchaDataUri(code: string) {
  const width = 220;
  const height = 78;
  const characters = code
    .split("")
    .map((char, index) => {
      const x = 18 + index * 31;
      const y = 52 + ((index % 2) * 4 - 2);
      const rotate = -18 + index * 7;
      const fontSize = 44 - (index % 2) * 3;
      return `<text x="${x}" y="${y}" transform="rotate(${rotate} ${x} ${y})" font-size="${fontSize}" font-family="Georgia, serif" font-weight="700" fill="#080808">${char}</text>`;
    })
    .join("");
  const noiseLines = Array.from({ length: 8 }, (_, index) => {
    const x1 = (index * 29) % width;
    const y1 = index % 2 === 0 ? 10 + index * 4 : height - 12 - index * 5;
    const x2 = width - 14 - index * 11;
    const y2 = index % 2 === 0 ? height - 8 - index * 4 : 18 + index * 3;
    return `<path d="M ${x1} ${y1} C ${x1 + 34} ${y1 - 18}, ${x2 - 30} ${y2 + 22}, ${x2} ${y2}" stroke="rgba(0,0,0,0.72)" stroke-width="${1.2 + (index % 3) * 0.6}" fill="none" stroke-linecap="round" />`;
  }).join("");
  const dots = Array.from({ length: 18 }, (_, index) => {
    const cx = 12 + ((index * 37) % (width - 24));
    const cy = 10 + ((index * 19) % (height - 20));
    const r = index % 4 === 0 ? 1.7 : 1.1;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(0,0,0,0.42)" />`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="12" fill="#ffffff"/>
    ${noiseLines}
    ${dots}
    ${characters}
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

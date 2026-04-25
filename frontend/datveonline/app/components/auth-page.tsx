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
} from "antd";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  loginWithBackend,
  registerWithBackend,
  verifyOtpWithBackend,
} from "../lib/cinema-api";
import { localizeHref } from "../lib/i18n";
import { useAuthSession } from "./auth-session-provider";
import { useDictionary, useLocale } from "./locale-provider";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const dictionary = useDictionary();
  const { message } = App.useApp();
  const { signIn } = useAuthSession();
  const isLogin = mode === "login";
  const registerCopy =
    locale === "en" ? registerContent.en : registerContent.vi;
  const loginCopy = locale === "en" ? loginContent.en : loginContent.vi;
  const [loginForm] = Form.useForm();
  const [captchaCode, setCaptchaCode] = useState(() => createCaptchaCode());
  const [submitting, setSubmitting] = useState(false);

  const [isOtpStep, setIsOtpStep] = useState(false); // Biến kiểm tra xem có đang ở bước OTP không
  const [registeredEmail, setRegisteredEmail] = useState(""); // Lưu email vừa đăng ký
  const [otpForm] = Form.useForm();

  // THÊM NGUYÊN ĐOẠN NÀY VÀO NGAY TRƯỚC: if (!isLogin) { return ... }
  if (isOtpStep) {
    return (
      <Card
        bordered={false}
        className="cinema-paper mx-auto max-w-[560px] rounded-[28px]"
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
              // Gọi API xác thực xuống Spring Boot (kiểm tra Redis)
              await verifyOtpWithBackend(registeredEmail, values.otp);
              message.success("Xác thực thành công! Bạn có thể đăng nhập.");
              // Thành công mới chuyển hướng về trang đăng nhập
              router.push(localizeHref("/dang-nhap", locale));
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
            {/* Nếu bạn đang dùng Ant Design phiên bản mới (>5.14), dùng Input.OTP */}
            <Input.OTP length={6} size="large" />

            {/* LƯU Ý: Nếu Ant Design bản cũ báo lỗi Input.OTP, hãy xóa dòng trên và dùng dòng dưới:
             <Input size="large" maxLength={6} placeholder="Nhập mã 6 số..." style={{ textAlign: "center", fontSize: 24, letterSpacing: 8 }} />
            */}
          </Form.Item>

          <Button
            type="primary"
            size="large"
            htmlType="submit"
            block
            loading={submitting}
          >
            Xác nhận mã
          </Button>
        </Form>
      </Card>
    );
  }

  if (!isLogin) {
    return (
      <Card
        bordered={false}
        className="auth-register-card cinema-paper mx-auto max-w-[760px] rounded-[32px]"
      >
        <div className="auth-register-banner cinema-hero-banner">
          <Image
            src="/register-visual.svg"
            alt={registerCopy.bannerAlt}
            width={960}
            height={1200}
            priority
            className="auth-register-banner-art"
          />
          <div className="auth-register-banner-overlay">
            <Typography.Text className="auth-register-kicker">
              {registerCopy.kicker}
            </Typography.Text>
            <Typography.Title
              level={2}
              style={{ margin: 0, color: "#fff7ea", maxWidth: 420 }}
            >
              {registerCopy.bannerTitle}
            </Typography.Title>
            <Typography.Paragraph
              style={{
                marginBottom: 0,
                maxWidth: 440,
                color: "rgba(255, 247, 234, 0.82)",
              }}
            >
              {registerCopy.bannerDescription}
            </Typography.Paragraph>
          </div>
        </div>
        <div className="auth-register-header">
          <Typography.Text className="auth-register-kicker">
            {registerCopy.kicker}
          </Typography.Text>
          <Typography.Title level={2} style={{ margin: 0, color: "#4a3426" }}>
            {registerCopy.title}
          </Typography.Title>
          <Typography.Paragraph style={{ marginBottom: 0, color: "#6d5a46" }}>
            {registerCopy.description}
          </Typography.Paragraph>
        </div>
        <Form
          layout="vertical"
          className="auth-register-form"
          onFinish={async (values) => {
            setSubmitting(true);
            try {
              await registerWithBackend({
                fullName: String(values.fullName),
                email: String(values.email).trim().toLowerCase(),
                phone: String(values.phone),
                password: String(values.password),
                citizenIdNumber: String(values.citizenId),
                gender: values.gender === "male" ? "Nam" : undefined,
                dateOfBirth: buildBirthDate(
                  values.birthYear,
                  values.birthMonth,
                  values.birthDay,
                ),
                area: provinceToArea(String(values.province)),
              });
              // SỬA TỪ ĐÂY: Thay vì chuyển trang, ta bật bước OTP lên
              setRegisteredEmail(String(values.email).trim().toLowerCase());
              setIsOtpStep(true);
              message.success(registerCopy.registerSuccess); // "Đăng kí thành công. Hãy kiểm tra email..."
            } catch (error) {
              message.error(
                error instanceof Error
                  ? error.message
                  : registerCopy.registerFailed,
              );
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div className="auth-register-grid auth-register-grid--two">
            <Form.Item
              name="fullName"
              label={registerCopy.fullName}
              rules={[
                { required: true, message: registerCopy.fullNameRequired },
              ]}
            >
              <Input
                size="large"
                placeholder={registerCopy.fullNamePlaceholder}
              />
            </Form.Item>
            <Form.Item
              name="gender"
              label={registerCopy.gender}
              rules={[{ required: true, message: registerCopy.genderRequired }]}
            >
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                className="auth-register-gender"
                options={[
                  { label: registerCopy.male, value: "male" },
                  { label: registerCopy.female, value: "female" },
                  { label: registerCopy.other, value: "other" },
                ]}
              />
            </Form.Item>
          </div>

          <div className="auth-register-grid auth-register-grid--two">
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: dictionary.auth.emailRequired },
                { type: "email", message: dictionary.auth.emailRequired },
              ]}
            >
              <Input size="large" placeholder="ban@kctcinema.vn" />
            </Form.Item>
            <Form.Item
              name="phone"
              label={registerCopy.phone}
              rules={[
                { required: true, message: registerCopy.phoneRequired },
                {
                  pattern: /^(84|0[35789])\d{8}$/,
                  message: registerCopy.phoneInvalid,
                },
              ]}
            >
              <Input size="large" inputMode="tel" placeholder="0901234567" />
            </Form.Item>
          </div>

          <Form.Item
            label={registerCopy.birthDate}
            required
            style={{ marginBottom: 16 }}
          >
            <div className="auth-register-grid auth-register-grid--three">
              <Form.Item
                name="birthDay"
                noStyle={false}
                rules={[
                  { required: true, message: registerCopy.birthDateRequired },
                ]}
              >
                <Select
                  size="large"
                  placeholder={registerCopy.day}
                  options={days.map((day) => ({ label: day, value: day }))}
                />
              </Form.Item>
              <Form.Item
                name="birthMonth"
                noStyle={false}
                rules={[
                  { required: true, message: registerCopy.birthDateRequired },
                ]}
              >
                <Select
                  size="large"
                  placeholder={registerCopy.month}
                  options={months.map((month) => ({
                    label: month,
                    value: month,
                  }))}
                />
              </Form.Item>
              <Form.Item
                name="birthYear"
                noStyle={false}
                rules={[
                  { required: true, message: registerCopy.birthDateRequired },
                ]}
              >
                <Select
                  size="large"
                  placeholder={registerCopy.year}
                  options={years.map((year) => ({ label: year, value: year }))}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            </div>
          </Form.Item>

          <Form.Item
            name="province"
            label={registerCopy.province}
            rules={[{ required: true, message: registerCopy.provinceRequired }]}
          >
            <Select
              size="large"
              placeholder={registerCopy.provincePlaceholder}
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
            label={registerCopy.citizenId}
            rules={[
              { required: true, message: registerCopy.citizenIdRequired },
              {
                pattern: /^\d{12}$/,
                message: registerCopy.citizenIdInvalid,
              },
            ]}
          >
            <Input
              size="large"
              inputMode="numeric"
              maxLength={12}
              placeholder="012345678901"
            />
          </Form.Item>

          <div className="auth-register-grid auth-register-grid--two">
            <Form.Item
              name="password"
              label={registerCopy.password}
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
              <Input.Password size="large" placeholder="••••••••" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label={registerCopy.confirmPassword}
              dependencies={["password"]}
              rules={[
                {
                  required: true,
                  message: registerCopy.confirmPasswordRequired,
                },
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
              <Input.Password size="large" placeholder="••••••••" />
            </Form.Item>
          </div>

          <Form.Item
            label={registerCopy.captcha}
            required
            style={{ marginBottom: 12 }}
          >
            <div className="auth-register-captcha-wrap">
              <Image
                alt={registerCopy.captchaAlt}
                src={buildCaptchaDataUri(captchaCode)}
                width={220}
                height={78}
                className="auth-register-captcha-image"
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={() => setCaptchaCode(createCaptchaCode())}
                size="large"
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

                  return Promise.reject(
                    new Error(registerCopy.captchaMismatch),
                  );
                },
              }),
            ]}
          >
            <Input
              size="large"
              maxLength={6}
              placeholder={registerCopy.captchaPlaceholder}
              onPaste={(event) => event.preventDefault()}
            />
          </Form.Item>

          <Button
            type="primary"
            size="large"
            htmlType="submit"
            block
            loading={submitting}
          >
            {registerCopy.submit}
          </Button>
        </Form>
        <Space className="mt-4" wrap>
          <Typography.Text style={{ color: "#6d5a46" }}>
            {dictionary.auth.hasAccount}
          </Typography.Text>
          <Link href={localizeHref("/dang-nhap", locale)}>
            {dictionary.auth.login}
          </Link>
        </Space>
      </Card>
    );
  }

  return (
    <Card
      bordered={false}
      className="cinema-paper mx-auto max-w-[560px] rounded-[28px]"
    >
      <Typography.Title level={2} style={{ marginTop: 0, color: "#4a3426" }}>
        {isLogin ? dictionary.auth.loginTitle : dictionary.auth.registerTitle}
      </Typography.Title>
      <Typography.Paragraph style={{ color: "#6d5a46" }}>
        {isLogin
          ? dictionary.auth.loginDescription
          : dictionary.auth.registerDescription}
      </Typography.Paragraph>
      <div className="auth-demo-accounts">
        <Typography.Text className="auth-demo-accounts-title">
          {loginCopy.demoTitle}
        </Typography.Text>
        <div className="auth-demo-accounts-grid">
          {DEMO_ACCOUNTS.map((account) => (
            <div key={account.email} className="auth-demo-account">
              <div>
                <Typography.Text
                  strong
                  style={{ color: "#4a3426", display: "block" }}
                >
                  {locale === "en" ? account.labelEn : account.labelVi}
                </Typography.Text>
                <Typography.Text style={{ color: "#6d5a46", display: "block" }}>
                  {account.email}
                </Typography.Text>
                <Typography.Text style={{ color: "#8c6b45", display: "block" }}>
                  {loginCopy.passwordLabel}: {account.password}
                </Typography.Text>
              </div>
              <Button
                size="middle"
                onClick={() => {
                  loginForm.setFieldsValue({
                    email: account.email,
                    password: account.password,
                    role: account.role,
                  });
                }}
              >
                {loginCopy.useAccount}
              </Button>
            </div>
          ))}
        </div>
      </div>
      <Form
        form={loginForm}
        layout="vertical"
        initialValues={{ role: "user" }}
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
          label="Email"
          rules={[{ required: true, message: dictionary.auth.emailRequired }]}
        >
          <Input size="large" placeholder="ban@kctcinema.vn" />
        </Form.Item>
        <Form.Item
          name="password"
          label={dictionary.auth.password}
          rules={[
            { required: true, message: dictionary.auth.passwordRequired },
          ]}
        >
          <Input.Password size="large" placeholder="********" />
        </Form.Item>
        <Form.Item
          name="role"
          label={dictionary.auth.roleLabel}
          extra={dictionary.auth.roleDescription}
        >
          <Radio.Group className="w-full">
            <Space direction="vertical">
              <Radio value="admin">{dictionary.auth.roleAdmin}</Radio>
              <Radio value="user">{dictionary.auth.roleUser}</Radio>
            </Space>
          </Radio.Group>
        </Form.Item>
        <Button
          type="primary"
          size="large"
          htmlType="submit"
          block
          loading={submitting}
        >
          {isLogin ? dictionary.auth.login : dictionary.auth.register}
        </Button>
      </Form>
      <Space className="mt-4" wrap>
        <Typography.Text style={{ color: "#6d5a46" }}>
          {isLogin ? dictionary.auth.noAccount : dictionary.auth.hasAccount}
        </Typography.Text>
        <Link href={localizeHref(isLogin ? "/dang-ky" : "/dang-nhap", locale)}>
          {isLogin ? dictionary.auth.registerNow : dictionary.auth.login}
        </Link>
      </Space>
    </Card>
  );
}

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

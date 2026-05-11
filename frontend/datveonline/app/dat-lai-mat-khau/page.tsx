"use client";

import { App, Button, Card, Form, Input, Typography } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { resetPasswordApi } from "../lib/cinema-api";
import { SiteShell } from "../components/site-shell";

// Component chứa Form (Bắt buộc tách riêng để bọc Suspense)
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); // Lấy token từ URL
  
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Nếu ai đó vào trang này mà không có token trên URL -> Đuổi về trang đăng nhập
  if (!token) {
    return (
      <div className="text-center py-6">
        <Typography.Title level={5} type="danger">
          Liên kết không hợp lệ hoặc đã hết hạn!
        </Typography.Title>
        <Button className="mt-4" type="primary" onClick={() => router.push("/dang-nhap")}>
          Quay lại Đăng nhập
        </Button>
      </div>
    );
  }

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      // Gọi API gửi token và mật khẩu mới
      await resetPasswordApi(token, values.newPassword);
      message.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.");
      router.push("/dang-nhap"); // Xong thì đá về trang đăng nhập
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} size="large">
      <Form.Item
        name="newPassword"
        label={<strong className="text-gray-600">Mật khẩu mới</strong>}
        rules={[
          { required: true, message: "Vui lòng nhập mật khẩu mới!" },
          { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự!" },
          { 
            pattern: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
            message: "Mật khẩu yếu! Cần chữ hoa, chữ thường, số và ký tự đặc biệt." 
          }
        ]}
      >
        <Input.Password prefix={<LockOutlined className="text-gray-400 mr-2" />} placeholder="Nhập mật khẩu mới" />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        label={<strong className="text-gray-600">Xác nhận mật khẩu</strong>}
        dependencies={['newPassword']}
        rules={[
          { required: true, message: "Vui lòng xác nhận mật khẩu!" },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
            },
          }),
        ]}
      >
        <Input.Password prefix={<LockOutlined className="text-gray-400 mr-2" />} placeholder="Nhập lại mật khẩu mới" />
      </Form.Item>

      <Button 
        type="primary" 
        htmlType="submit" 
        block 
        loading={submitting} 
        style={{ backgroundColor: '#14b8a6', borderColor: '#14b8a6' }}
        className="font-bold h-12 rounded-lg mt-2"
      >
        Lưu mật khẩu mới
      </Button>
    </Form>
  );
}

// Layout chính của trang
export default function ResetPasswordPage() {
  return (
    <SiteShell>
      <div className="w-full flex justify-center items-center py-20 min-h-[75vh] bg-[#fffaf4]">
        <Card className="w-full max-w-md shadow-lg rounded-xl border border-[#ead6bb] p-2">
           <div className="text-center mb-6">
             <Typography.Title level={2} style={{ color: "#4a3426", margin: 0 }}>
               Đặt lại mật khẩu
             </Typography.Title>
             <p className="text-gray-500 mt-2">
               Vui lòng nhập mật khẩu mới an toàn cho tài khoản của bạn.
             </p>
           </div>
           
           <Suspense fallback={<div className="text-center text-gray-500">Đang kiểm tra liên kết...</div>}>
             <ResetPasswordForm />
           </Suspense>
        </Card>
      </div>
    </SiteShell>
  );
}
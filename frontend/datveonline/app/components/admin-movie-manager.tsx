"use client";

import { useState } from "react";
import { App, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Upload, Row, Col, Table, Space } from "antd";
import { PlusOutlined, UploadOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
// Đảm bảo import thêm updateMovieApi và dayjs
import { createMovieApi, uploadMovieImagesApi, updateMovieApi } from "../lib/cinema-api"; 
import { useAuthSession } from "./auth-session-provider";
import dayjs from "dayjs"; // Antd DatePicker sử dụng dayjs để xử lý ngày tháng

export function AdminMovieManager() {
  // 🔥 1. BẢO MẬT: Lấy thông tin user hiện tại để kiểm tra quyền Admin
  const { token, user } = useAuthSession();
  // Ép về string và kiểm tra xem có chứa chữ ADMIN không (bao trọn cả "ROLE_ADMIN")
  const isAdmin = String(user?.role).toUpperCase().includes("ADMIN");

  const { message } = App.useApp();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // 🔥 2. STATE ĐỂ PHÂN BIỆT ĐANG "THÊM" HAY "SỬA"
  const [editingMovieId, setEditingMovieId] = useState<string | null>(null);

  // State lưu file ảnh khi người dùng chọn
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  // ==========================================
  // HÀM MỞ MODAL ĐỂ SỬA PHIM
  // ==========================================
  const openEditModal = (movie: any) => {
    setEditingMovieId(movie.id);
    
    // Đổ dữ liệu cũ vào form (lưu ý DatePicker cần convert string sang dayjs)
    form.setFieldsValue({
      ...movie,
      releaseDate: movie.releaseDate ? dayjs(movie.releaseDate) : null,
    });

    setPosterFile(null);
    setBannerFile(null);
    setIsModalOpen(true);
  };

  // ==========================================
  // HÀM MỞ MODAL ĐỂ THÊM PHIM (Reset form)
  // ==========================================
  const openCreateModal = () => {
    setEditingMovieId(null);
    form.resetFields();
    setPosterFile(null);
    setBannerFile(null);
    setIsModalOpen(true);
  };

  // ==========================================
  // HÀM XỬ LÝ LƯU (DÙNG CHUNG CHO CẢ THÊM VÀ SỬA)
  // ==========================================
  const handleSubmit = async (values: any) => {
    // Nếu là THÊM MỚI -> Bắt buộc phải có đủ 2 ảnh
    if (!editingMovieId && (!posterFile || !bannerFile)) {
      message.error("Vui lòng tải lên đầy đủ Poster và Banner để thêm phim mới!");
      return;
    }

    setLoading(true);
    try {
      // 1. Chuẩn bị payload dạng JSON
      const payload = {
        title: values.title,
        durationMin: values.durationMin,
        genre: values.genre,
        language: values.language,
        ageRestriction: values.ageRestriction,
        trailerUrl: values.trailerUrl,
        description: values.description,
        releaseDate: values.releaseDate.format("YYYY-MM-DD"),
        directors: values.directors,
        actors: values.actors,
      };

      let currentMovieId = editingMovieId;

      // 2. GỌI API TEXT (CREATE HOẶC UPDATE)
      if (editingMovieId) {
        // Chế độ Sửa
        await updateMovieApi(token!, editingMovieId, payload);
        message.success("Cập nhật thông tin chữ thành công!");
      } else {
        // Chế độ Thêm mới
        const createRes = await createMovieApi(token!, payload);
        currentMovieId = createRes.result.id;
        message.success("Thêm phim mới thành công!");
      }

      // 3. GỌI API UPLOAD ẢNH (Nếu người dùng có chọn ảnh)
      // Đối với Sửa: Ảnh là tùy chọn, không chọn thì không gọi
      if (posterFile || bannerFile) {
          // 🔥 Thêm 'as any' hoặc 'as File' để báo cho TypeScript biết mình đang làm gì
          await uploadMovieImagesApi(token!, currentMovieId!, posterFile as any, bannerFile as any);
          message.success("Cập nhật ảnh thành công!");
        }

      // 4. Dọn dẹp sau khi thành công
      setIsModalOpen(false);
      form.resetFields();
      setPosterFile(null);
      setBannerFile(null);
      setEditingMovieId(null);
      
      // TODO: Gọi hàm fetch lại danh sách phim ở đây để cập nhật UI
      
    } catch (error: any) {
      message.error(error.message || "Đã xảy ra lỗi khi lưu phim!");
    } finally {
      setLoading(false);
    }
  };

  // Nếu không phải Admin, có thể chặn hiển thị giao diện này luôn
  if (!isAdmin && process.env.NODE_ENV !== "development") {
    // (Bỏ qua check nếu đang làm dev để bạn dễ test, lúc thật thì bỏ dòng && kia đi)
    // return <div className="p-10 text-center text-red-500 text-xl font-bold">Bạn không có quyền truy cập trang này.</div>;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#4a3426]">Quản lý Phim</h2>
        {/* Nút Thêm Mới chỉ hiện cho Admin */}
        {isAdmin && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="large"
            onClick={openCreateModal}
            style={{ backgroundColor: '#14b8a6' }}
          >
            Thêm phim mới
          </Button>
        )}
      </div>

      {/* TẠM THỜI CHƯA CÓ BẢNG DANH SÁCH */}
      <div className="p-10 border-2 border-dashed border-gray-300 rounded-xl text-center text-gray-500 flex flex-col items-center gap-4">
        <span>Khu vực hiển thị danh sách phim Admin (Table)</span>
        
        {/* DUMMY BUTTON ĐỂ BẠN TEST CHỨC NĂNG SỬA */}
        <Button 
          icon={<EditOutlined />} 
          onClick={() => openEditModal({
            id: "fake-id-123", // Thay bằng id thật
            title: "Avengers: Endgame",
            durationMin: 181,
            genre: "ACTION",
            language: "ENGLISH",
            ageRestriction: "C18",
            releaseDate: "2019-04-26"
          })}
        >
          Test thử nút Sửa phim (Dummy Data)
        </Button>
      </div>

      <Modal
        title={
          <span className="text-xl text-[#4a3426]">
            {editingMovieId ? "Chỉnh sửa phim" : "Thêm phim chiếu rạp mới"}
          </span>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={800}
        centered
        destroyOnClose // Xóa dữ liệu cũ khi đóng modal
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="title" label="Tên phim" rules={[{ required: true, message: "Nhập tên phim" }]}>
                <Input size="large" placeholder="VD: Avengers: Endgame" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="durationMin" label="Thời lượng (Phút)" rules={[{ required: true, message: "Nhập thời lượng" }]}>
                <InputNumber size="large" min={30} className="w-full" placeholder="VD: 120" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="genre" label="Thể loại" rules={[{ required: true }]}>
                <Select size="large" options={[
                  { label: "Hành động", value: "ACTION" },
                  { label: "Hài hước", value: "COMEDY" },
                  { label: "Kinh dị", value: "HORROR" },
                  { label: "Khoa học viễn tưởng", value: "SCIFI" },
                  { label: "Tình cảm", value: "ROMANCE" }
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="language" label="Ngôn ngữ" rules={[{ required: true }]}>
                <Select size="large" options={[
                  { label: "Tiếng Anh", value: "ENGLISH" },
                  { label: "Tiếng Việt", value: "VIETNAMESE" },
                  { label: "Tiếng Hàn", value: "KOREAN" }
                ]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="ageRestriction" label="Giới hạn tuổi" rules={[{ required: true }]}>
                <Select size="large" options={[
                  { label: "P (Mọi lứa tuổi)", value: "P" },
                  { label: "C13 (Từ 13 tuổi)", value: "C13" },
                  { label: "C16 (Từ 16 tuổi)", value: "C16" },
                  { label: "C18 (Từ 18 tuổi)", value: "C18" }
                ]} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="releaseDate" label="Ngày khởi chiếu" rules={[{ required: true }]}>
                <DatePicker size="large" className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="trailerUrl" label="Link Trailer (YouTube)">
                <Input size="large" placeholder="https://youtube.com/..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="directors" label="Đạo diễn (Nhập và nhấn Enter)" rules={[{ required: true }]}>
                <Select mode="tags" size="large" placeholder="Nhập tên đạo diễn..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="actors" label="Diễn viên (Nhập và nhấn Enter)" rules={[{ required: true }]}>
                <Select mode="tags" size="large" placeholder="Nhập tên diễn viên..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Mô tả phim">
            <Input.TextArea rows={4} placeholder="Nội dung tóm tắt của phim..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              {/* Nếu là Edit thì KHÔNG required, nếu là Add thì REQUIRED */}
              <Form.Item label="Poster (Ảnh dọc)" required={!editingMovieId}>
                <Upload 
                  beforeUpload={(file) => { setPosterFile(file); return false; }} 
                  maxCount={1}
                  accept="image/*"
                  listType="picture"
                >
                  <Button icon={<UploadOutlined />}>
                    {editingMovieId ? "Chọn Poster Mới (Bỏ qua nếu giữ nguyên)" : "Chọn ảnh Poster"}
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Banner (Ảnh ngang)" required={!editingMovieId}>
                <Upload 
                  beforeUpload={(file) => { setBannerFile(file); return false; }} 
                  maxCount={1}
                  accept="image/*"
                  listType="picture"
                >
                  <Button icon={<UploadOutlined />}>
                    {editingMovieId ? "Chọn Banner Mới (Bỏ qua nếu giữ nguyên)" : "Chọn ảnh Banner"}
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end mt-4">
            <Button size="large" onClick={() => setIsModalOpen(false)} className="mr-4">Hủy</Button>
            <Button type="primary" htmlType="submit" size="large" loading={loading} style={{ backgroundColor: '#14b8a6' }}>
              {editingMovieId ? "Lưu thay đổi" : "Xác nhận Thêm"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
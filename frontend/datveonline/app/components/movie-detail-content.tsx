"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  App, Button, Modal, Form, Input, InputNumber, 
  Select, DatePicker, Upload, Row, Col, Popconfirm 
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import { MovieItem } from "../data/cgv-template";
import { localizeHref } from "../lib/i18n";
import { useDictionary, useLocale } from "./locale-provider";
import { useAuthSession } from "./auth-session-provider";
import { 
  getMovieByIdApi, 
  deleteMovieApi, 
  updateMovieApi, 
  uploadMovieImagesApi 
} from "../lib/cinema-api";

export function MovieDetailContent({ movie }: { movie: MovieItem }) {
  const locale = useLocale();
  const dictionary = useDictionary();
  const router = useRouter();
  const { message } = App.useApp();

  // 1. Kiểm tra quyền Admin
  const { token, user } = useAuthSession();
  // Bộ dịch độ tuổi ra tiếng Việt
  const ageLabels: Record<string, string> = {
    "P": "P (Mọi lứa tuổi)",
    "C13": "C13 (Từ 13 tuổi)",
    "C16": "C16 (Từ 16 tuổi)",
    "C18": "C18 (Từ 18 tuổi)",
  };
  const isAdmin = String(user?.role).toUpperCase().includes("ADMIN");

  // 2. State cho tính năng Sửa Phim Inline
  const [rawMovie, setRawMovie] = useState<any>(null); // Lưu dữ liệu gốc để đổ vào Form
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // ... các state cũ (rawMovie, isEditModalOpen, v.v.)
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);

  // Hàm chuyển đổi link YouTube thường thành link nhúng (Embed) có tự động phát (autoplay)
  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
    }
    return url; // Trả về link gốc nếu không khớp định dạng YouTube
  };

  // 3. Tự động lấy dữ liệu gốc của phim nếu là Admin
  useEffect(() => {
    if (isAdmin && movie.id) {
      getMovieByIdApi(movie.id)
        .then((data) => setRawMovie(data))
        .catch((err) => console.error("Lỗi lấy thông tin phim:", err));
    }
  }, [isAdmin, movie.id]);

  // ==========================
  // CÁC HÀM XỬ LÝ CỦA ADMIN
  // ==========================
  const openEditModal = () => {
    form.setFieldsValue({
      ...rawMovie,
      releaseDate: rawMovie?.releaseDate ? dayjs(rawMovie.releaseDate) : null,
    });
    setPosterFile(null);
    setBannerFile(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (values: any) => {
    setSubmitting(true);
    try {
      const payload = {
        title: values.title,
        durationMin: values.durationMin,
        genre: values.genre,
        language: values.language,
        ageRestriction: values.ageRestriction,
        // 🔥 Thêm || "" để tránh gửi undefined xuống Java
        trailerUrl: values.trailerUrl || "",
        description: values.description || "",
        releaseDate: values.releaseDate ? values.releaseDate.format("YYYY-MM-DD") : null,
        directors: values.directors || [],
        actors: values.actors || [],
        status: values.status,
        featured: values.featured,
      };
      // Gửi text
      await updateMovieApi(token!, movie.id, payload);
      
      // Gửi ảnh nếu có thay đổi
      if (posterFile || bannerFile) {
        await uploadMovieImagesApi(token!, movie.id, posterFile as any, bannerFile as any);
      }

      message.success("Đã cập nhật phim thành công!");
      setIsEditModalOpen(false);
      window.location.reload(); // Tải lại trang để thấy dữ liệu mới nhất
    } catch (err: any) {
      message.error(err.message || "Lỗi khi lưu phim");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFeatured = async () => {
    if (!rawMovie) return;
    try {
      const payload = { ...rawMovie, featured: !rawMovie.featured };
      await updateMovieApi(token!, movie.id, payload);
      setRawMovie(payload);
      message.success(payload.featured ? "Đã đưa phim lên Nổi bật!" : "Đã gỡ phim khỏi Nổi bật!");
    } catch (err: any) {
      message.error("Lỗi: " + err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMovieApi(token!, movie.id);
      message.success("Đã xóa phim vĩnh viễn!");
      router.push(locale === "vi" ? "/phim" : "/en/phim");
    } catch (err: any) {
      message.error("Lỗi khi xóa phim: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* PHẦN 1: THÔNG TIN CHI TIẾT PHIM */}
      <section className="cinema-paper overflow-hidden rounded-[28px] p-6 md:p-8 relative">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* CỘT TRÁI: ẢNH POSTER */}
          <div className="w-full md:w-[300px] shrink-0">
            <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-4 border-white bg-gray-100">
              {movie.posterUrl && (
                <Image
                  src={movie.posterUrl}
                  alt={movie.title}
                  fill
                  priority={true}
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-cover" 
                />
              )}
            </div>
          </div>

          {/* CỘT PHẢI: TEXT CHI TIẾT */}
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="rounded-md bg-[#a61d24] px-3 py-1 text-sm font-bold text-white uppercase">
                {movie.rating}
              </span>
              <span className="rounded-md bg-[#f0dfb1] px-3 py-1 text-sm font-semibold text-[#4a3426]">
                {movie.bookingLabel}
              </span>
              {movie.formats.map((format) => (
                <span
                  key={format}
                  className="rounded-md border border-[#e4d1b4] px-3 py-1 text-sm font-medium text-[#4a3426]"
                >
                  {format}
                </span>
              ))}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-[#4a3426] uppercase">
              {movie.title} {movie.rating && `(${movie.rating})`}
            </h1>
            <p className="mt-3 leading-7 text-[#6d5a46] italic">
              "{movie.synopsis}"
            </p>
            
            <div className="mt-6 space-y-3 text-[15px] text-[#4a3426]">
              <p><strong className="inline-block w-28">{dictionary.movieDetail.director}:</strong> {movie.director}</p>
              <p><strong className="inline-block w-28">{dictionary.movieDetail.cast}:</strong> {movie.cast.join(", ")}</p>
              <p><strong className="inline-block w-28">Thể loại:</strong> {movie.genre}</p>
              <p><strong className="inline-block w-28">Khởi chiếu:</strong> {movie.release}</p>
              <p><strong className="inline-block w-28">Thời lượng:</strong> {movie.duration}</p>
              <p><strong className="inline-block w-28">Ngôn ngữ:</strong> {movie.language}</p>
              <p>
                <strong className="inline-block w-28">Rated:</strong> 
                <span className="font-bold text-[#a61d24]">
                  {ageLabels[movie.rating] || movie.rating}
                </span>
              </p>
            </div>
            {/* KHU VỰC NÚT BẤM (CẢ KHÁCH VÀ ADMIN) */}
            <div className="mt-8 flex flex-wrap gap-4 items-center">
              {/* NÚT TRAILER */}
              {/* NÚT TRAILER */}
              {movie.trailerUrl ? (
                <button
                  onClick={() => setIsTrailerModalOpen(true)} // 🔥 MỞ POPUP TẠI ĐÂY
                  className="inline-block rounded-xl border-2 border-[#c89a2b] px-8 py-2.5 font-semibold text-[#4a3426] cursor-pointer hover:bg-[#fbf6ed] transition duration-200"
                >
                  Xem Trailer
                </button>
              ) : (
                <span className="inline-block rounded-xl border-2 border-gray-300 px-8 py-2.5 font-semibold text-gray-400 cursor-not-allowed">
                  Chưa có Trailer
                </span>
              )}
              <Link
                href={localizeHref(
                  `/dat-ve/${movie.slug}?cinema=${movie.showtimes[0]?.cinemaId ?? ""}&time=${movie.showtimes[0]?.times[0] ?? ""}`,
                  locale,
                )}
                className="rounded-xl bg-[#a61d24] px-8 py-2.5 font-bold text-white hover:bg-[#8a181e] transition duration-200 shadow-md"
              >
                {dictionary.movieDetail.bookNow}
              </Link>

              {/* 🔥 BẢNG ĐIỀU KHIỂN NHANH DÀNH RIÊNG CHO ADMIN 🔥 */}
              {isAdmin && rawMovie && (
                <div className="flex flex-wrap gap-2 items-center p-2 sm:ml-auto bg-[#fffaf4] rounded-xl border-2 border-dashed border-[#e4d1b4]">
                  <span className="text-sm font-bold text-[#a61d24] ml-2 mr-1">Tác vụ Admin:</span>
                  <Button type="primary" onClick={openEditModal} className="bg-gray-800 hover:bg-black">
                    Sửa
                  </Button>
                  <Button onClick={toggleFeatured}>
                    {rawMovie.featured ? "Bỏ nổi bật" : "Đưa nổi bật"}
                  </Button>
                  <Popconfirm 
                    title="Xóa vĩnh viễn phim này?" 
                    description="Bạn có chắc chắn muốn xóa không?" 
                    onConfirm={handleDelete}
                    okText="Xóa ngay"
                    cancelText="Hủy"
                  >
                    <Button danger>Xóa</Button>
                  </Popconfirm>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* PHẦN 2: LỊCH CHIẾU VÀ ĐIỂM NHẤN */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="cinema-paper rounded-[28px] p-6">
          <h2 className="cinema-section-title text-3xl text-[#4a3426]">{dictionary.movieDetail.showtimes}</h2>
          <div className="mt-6 space-y-4">
            {movie.showtimes.map((showtime) => (
              <div key={`${showtime.cinemaId}-${showtime.room}`} className="rounded-[22px] border border-[#ead8c1] bg-[#fffaf4] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-bold text-[#4a3426]">{showtime.cinemaName}</h3>
                      <span className="rounded-full bg-[#a61d24] px-3 py-1 text-sm text-white">{showtime.dateLabel}</span>
                    </div>
                    <p className="mt-2 text-[#6d5a46]">{showtime.room}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {showtime.times.map((time) => (
                      <Link
                        key={`${showtime.cinemaId}-${time}`}
                        href={localizeHref(`/dat-ve/${movie.slug}?cinema=${showtime.cinemaId}&time=${time}`, locale)}
                        className="rounded-xl border border-[#e4d1b4] bg-white px-4 py-2 text-sm font-semibold text-[#4a3426]"
                      >
                        {time}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="cinema-paper rounded-[28px] p-6">
            <h3 className="text-2xl font-bold text-[#4a3426]">{dictionary.movieDetail.highlights}</h3>
            <div className="mt-4 space-y-3 text-[#6d5a46]">
              {dictionary.movieDetail.highlightItems.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* 🔥 MODAL SỬA PHIM TRỰC TIẾP TRÊN TRANG CHI TIẾT 🔥 */}
      <Modal
        open={isEditModalOpen}
        title="Chỉnh sửa thông tin phim"
        onCancel={() => setIsEditModalOpen(false)}
        onOk={() => form.submit()}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        confirmLoading={submitting}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSaveEdit} className="mt-4">
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="title" label="Tên phim" rules={[{ required: true }]}>
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="durationMin" label="Thời lượng (Phút)" rules={[{ required: true }]}>
                <InputNumber size="large" min={30} className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="genre" label="Thể loại" rules={[{ required: true }]}>
                <Select size="large" options={[{ label: "Hành động", value: "ACTION" }, { label: "Hài hước", value: "COMEDY" }, { label: "Khoa học viễn tưởng", value: "SCI_FI" }]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="language" label="Ngôn ngữ" rules={[{ required: true }]}>
                <Select size="large" options={[{ label: "Tiếng Anh", value: "ENGLISH" }, { label: "Tiếng Việt", value: "VIETNAMESE" }]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="ageRestriction" label="Giới hạn tuổi" rules={[{ required: true }]}>
                <Select size="large" options={[{ label: "P", value: "P" }, { label: "C13", value: "C13" }, { label: "C16", value: "C16" }, { label: "C18", value: "C18" }]} />
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
              <Form.Item name="trailerUrl" label="Link Trailer">
                <Input size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="directors" label="Đạo diễn" rules={[{ required: true }]}>
                <Select mode="tags" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="actors" label="Diễn viên" rules={[{ required: true }]}>
                <Select mode="tags" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Đổi Poster (Ảnh dọc)">
                <Upload beforeUpload={(f) => { setPosterFile(f); return false; }} maxCount={1} accept="image/*" listType="picture">
                  <Button icon={<UploadOutlined />}>Chọn ảnh mới</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Đổi Banner (Ảnh ngang)">
                <Upload beforeUpload={(f) => { setBannerFile(f); return false; }} maxCount={1} accept="image/*" listType="picture">
                  <Button icon={<UploadOutlined />}>Chọn ảnh mới</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
                <Select size="large" options={[{ value: "NOW_SHOWING", label: "Đang chiếu" }, { value: "COMING_SOON", label: "Sắp chiếu" }, { value: "STOPPED", label: "Ngừng chiếu" }]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="featured" label="Nổi bật" rules={[{ required: true }]}>
                <Select size="large" options={[{ value: true, label: "Có" }, { value: false, label: "Không" }]} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 🔥 MODAL PHÁT TRAILER YOUTUBE 🔥 */}
      <Modal
        title={movie.title}
        open={isTrailerModalOpen}
        onCancel={() => setIsTrailerModalOpen(false)}
        footer={null} // Ẩn nút OK/Cancel mặc định
        width={850} // Cho chiều ngang to ra xem cho sướng
        centered // Căn giữa màn hình
        destroyOnClose // CỰC KỲ QUAN TRỌNG: Tắt modal là video tự dừng, không bị phát tiếng nền
      >
        <div className="relative w-full pt-[56.25%] rounded-lg overflow-hidden bg-black">
          {/* pt-[56.25%] là tỷ lệ vàng 16:9 cho video */}
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={getYouTubeEmbedUrl(movie.trailerUrl)}
            title="Trailer"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      </Modal>
    </div>
  );
}
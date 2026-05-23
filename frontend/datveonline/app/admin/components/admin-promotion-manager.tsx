"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  message,
  Popconfirm,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  DatePicker,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuthSession } from "../../components/auth-session-provider";

const { RangePicker } = DatePicker;

interface Promotion {
  id: string;
  title: string;
  description: string;
  discountCode: string;
  discountPercent: number;
  target: "TICKET" | "CONCESSION" | "ALL";
  validFrom: string;
  validUntil: string;
  minPurchaseAmount: number;
  maxDiscountAmount: number;
  usageLimit: number;
  usedCount: number;
  active: boolean;

  requiredRewardPoints: number;
  requiredMemberTier: "BASIC" | "SILVER" | "GOLD" | "PLATINUM";
  isBirthdayPromo: boolean;
}

export function AdminPromotionManager({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { token } = useAuthSession();

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Promotion | null>(null);
  const [form] = Form.useForm();

  const fetchPromotions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(
        "http://localhost:9090/cinema/promotions/admin/all",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (res.ok && data.code === 1000) {
        setPromotions(data.result);
      } else {
        throw new Error(data.message || "Lỗi tải dữ liệu khuyến mãi");
      }
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && open) {
      fetchPromotions();
    }
  }, [token, open]);

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      active: true,
      target: "ALL",
      minPurchaseAmount: 0,
      maxDiscountAmount: 0,
      usageLimit: 100,

      requiredRewardPoints: 0,
      requiredMemberTier: "BASIC",
      isBirthdayPromo: false,
    });
    setIsModalVisible(true);
  };

  const handleEdit = (record: Promotion) => {
    setEditingItem(record);

    // Convert thời gian từ String của Backend sang đối tượng dayjs cho DatePicker của Antd
    const dateRange = [
      record.validFrom ? dayjs(record.validFrom) : null,
      record.validUntil ? dayjs(record.validUntil) : null,
    ];

    form.setFieldsValue({
      ...record,
      dateRange,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:9090/cinema/promotions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.code === 1000) {
        message.success("Xóa mã khuyến mãi thành công!");
        fetchPromotions();
      } else {
        throw new Error(data.message || "Không thể xóa mã này");
      }
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const handleSave = async (values: any) => {
    if (!token) return;
    try {
      // Format lại ngày tháng để gửi về Backend (Chuẩn "yyyy-MM-dd HH:mm:ss")
      const [fromDate, untilDate] = values.dateRange || [];
      const payload = {
        ...values,
        validFrom: fromDate ? fromDate.format("YYYY-MM-DD HH:mm:ss") : null,
        validUntil: untilDate ? untilDate.format("YYYY-MM-DD HH:mm:ss") : null,
      };

      // Xóa trường dateRange tạm thời khỏi payload trước khi gởi đi
      delete payload.dateRange;

      const url = editingItem
        ? `http://localhost:9090/cinema/promotions/${editingItem.id}`
        : "http://localhost:9090/cinema/promotions";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.code === 1000) {
        message.success(
          editingItem ? "Cập nhật mã thành công!" : "Tạo mã mới thành công!",
        );
        setIsModalVisible(false);
        fetchPromotions();
      } else {
        throw new Error(data.message || "Lưu thất bại");
      }
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN").format(value) + "đ";

  const columns = [
    {
      title: "Mã Code",
      dataIndex: "discountCode",
      key: "discountCode",
      render: (code: string) => (
        <Tag color="red" className="font-bold text-sm tracking-wider">
          {code}
        </Tag>
      ),
    },
    {
      title: "Chương trình",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: Promotion) => (
        <div>
          <Typography.Text strong>{text}</Typography.Text>
          <div className="text-xs text-gray-500 mt-1">
            Giảm{" "}
            <strong className="text-[#a61d24]">
              {record.discountPercent}%
            </strong>
            {record.maxDiscountAmount > 0 &&
              ` (Tối đa ${formatCurrency(record.maxDiscountAmount)})`}
          </div>
        </div>
      ),
    },
    {
      title: "Áp dụng cho",
      dataIndex: "target",
      key: "target",
      render: (target: string) => {
        let label = "Toàn bộ HĐ";
        let color = "purple";
        if (target === "TICKET") {
          label = "Vé Phim";
          color = "blue";
        }
        if (target === "CONCESSION") {
          label = "Bắp Nước";
          color = "orange";
        }
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Thời hạn",
      key: "validity",
      render: (_: any, record: Promotion) => {
        const isExpired = dayjs().isAfter(dayjs(record.validUntil));
        return (
          <div className="text-xs">
            <div className="text-gray-500">
              {dayjs(record.validFrom).format("DD/MM/YYYY")} -
            </div>
            <div
              className={
                isExpired
                  ? "text-red-500 font-semibold line-through"
                  : "text-[#4a3426] font-semibold"
              }
            >
              {dayjs(record.validUntil).format("DD/MM/YYYY")}
            </div>
          </div>
        );
      },
    },
    {
      title: "Lượt dùng",
      key: "usage",
      render: (_: any, record: Promotion) => (
        <div className="text-sm">
          <strong className="text-[#14b8a6]">{record.usedCount}</strong> /{" "}
          {record.usageLimit}
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      render: (active: boolean) => (
        <Tag color={active ? "success" : "default"}>
          {active ? "Hoạt động" : "Tạm khóa"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_: any, record: Promotion) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="text-blue-600 hover:bg-blue-50"
          />
          <Popconfirm
            title="Xóa mã này?"
            description="Không thể phục hồi sau khi xóa!"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              className="hover:bg-red-50"
            />
          </Popconfirm>
        </Space>
      ),
    },
    {
      title: "Điều kiện nhận mã",
      key: "conditions",
      render: (_: any, record: Promotion) => (
        <Space direction="vertical" size={4}>
          <Tag color="cyan">Điểm: {record.requiredRewardPoints || 0}</Tag>

          <Tag
            color={
              record.requiredMemberTier === "PLATINUM"
                ? "red"
                : record.requiredMemberTier === "GOLD"
                  ? "gold"
                  : record.requiredMemberTier === "SILVER"
                    ? "blue"
                    : "default"
            }
          >
            Hạng: {record.requiredMemberTier || "BASIC"}
          </Tag>

          {record.isBirthdayPromo && <Tag color="magenta">Quà sinh nhật</Tag>}
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className="pt-2">
          <Typography.Title level={3} style={{ margin: 0, color: "#4a3426" }}>
            Quản lý Khuyến Mãi (Promotion)
          </Typography.Title>
          <Typography.Text
            type="secondary"
            className="font-normal text-sm block mt-1"
          >
            Cài đặt các mã giảm giá, voucher và điều kiện áp dụng
          </Typography.Text>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1200}
      centered
      destroyOnClose
      footer={[
        <Button
          key="back"
          onClick={onClose}
          size="large"
          className="px-8 font-semibold"
        >
          Quay lại
        </Button>,
      ]}
    >
      <div className="flex justify-end mb-4 mt-2">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          size="large"
          className="bg-[#a61d24]"
        >
          Tạo mã mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={promotions}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 6 }}
        bordered
        scroll={{ x: "max-content" }}
      />

      <Modal
        title={
          editingItem ? "Chỉnh sửa mã khuyến mãi" : "Tạo mã khuyến mãi mới"
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        okText="Lưu lại"
        cancelText="Hủy bỏ"
        okButtonProps={{ className: "bg-[#a61d24]" }}
        centered
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="mt-4"
        >
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="title"
                label="Tên chương trình"
                rules={[{ required: true, message: "Nhập tên chương trình!" }]}
              >
                <Input
                  placeholder="VD: Tri ân khách hàng thân thiết"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="discountCode"
                label="Mã Code (Viết liền, không dấu)"
                rules={[{ required: true, message: "Nhập mã code!" }]}
              >
                <Input
                  placeholder="VD: KCTSUMMER"
                  size="large"
                  className="uppercase font-bold"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={10}>
              <Form.Item
                name="target"
                label="Phạm vi áp dụng"
                rules={[{ required: true }]}
              >
                <Select size="large">
                  <Select.Option value="ALL">Toàn bộ hóa đơn</Select.Option>
                  <Select.Option value="TICKET">
                    Chỉ giảm tiền Vé phim
                  </Select.Option>
                  <Select.Option value="CONCESSION">
                    Chỉ giảm tiền Bắp nước
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item
                name="dateRange"
                label="Thời gian diễn ra"
                rules={[
                  {
                    required: true,
                    message: "Chọn thời gian bắt đầu và kết thúc!",
                  },
                ]}
              >
                <RangePicker
                  showTime
                  format="YYYY-MM-DD HH:mm:ss"
                  size="large"
                  className="w-full"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="discountPercent"
                label="% Giảm giá"
                rules={[
                  { required: true, message: "Nhập % giảm!" },
                  {
                    type: "number",
                    min: 1,
                    max: 100,
                    message: "Phần trăm giảm giá chỉ được từ 1% đến 100%!",
                  },
                ]}
              >
                <InputNumber
                  size="large"
                  min={1}
                  max={100}
                  addonAfter="%"
                  className="w-full"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="minPurchaseAmount"
                label="Đơn tối thiểu (VNĐ)"
                rules={[{ required: true }]}
              >
                <InputNumber
                  size="large"
                  min={0}
                  step={10000}
                  className="w-full"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value!.replace(/,/g, "") as any}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="maxDiscountAmount"
                label="Giảm tối đa (VNĐ)"
                rules={[{ required: true }]}
              >
                <InputNumber
                  size="large"
                  min={0}
                  step={10000}
                  className="w-full"
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value!.replace(/,/g, "") as any}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="usageLimit"
                label="Tổng số lượt sử dụng tối đa"
                rules={[{ required: true }]}
              >
                <InputNumber size="large" min={1} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="active"
                label="Trạng thái khả dụng"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Cho phép dùng"
                  unCheckedChildren="Đang khóa"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="requiredRewardPoints"
                label="Điểm thưởng cần đổi"
                rules={[{ required: true }]}
              >
                <InputNumber
                  size="large"
                  min={0}
                  step={10}
                  className="w-full"
                  placeholder="VD: 100"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="requiredMemberTier"
                label="Hạng thành viên yêu cầu"
                rules={[{ required: true }]}
              >
                <Select size="large">
                  <Select.Option value="BASIC">BASIC</Select.Option>
                  <Select.Option value="SILVER">SILVER</Select.Option>
                  <Select.Option value="GOLD">GOLD</Select.Option>
                  <Select.Option value="PLATINUM">PLATINUM</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="isBirthdayPromo"
                label="Quà sinh nhật"
                valuePropName="checked"
              >
                <Switch checkedChildren="Có" unCheckedChildren="Không" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Điều kiện/Mô tả hiển thị cho khách"
          >
            <Input.TextArea
              rows={2}
              placeholder="VD: Nhập mã để được giảm ngay 20% cho các sản phẩm combo bắp nước..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
}

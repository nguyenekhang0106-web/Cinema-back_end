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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
} from "@ant-design/icons";

// Lấy Token chuẩn xác từ hệ thống
import { useAuthSession } from "../../components/auth-session-provider";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_CINEMA_API_URL ?? "http://localhost:9090/cinema"
).replace(/\/$/, "");

interface Concession {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: "POPCORN" | "DRINK" | "COMBO" | "SNACK";
  active: boolean;
}

// 🔥 Chỉnh sửa Component nhận Props open và onClose để làm Popup
export function AdminConcessionManager({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { token } = useAuthSession();

  const [concessions, setConcessions] = useState<Concession[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Concession | null>(null);
  const [form] = Form.useForm();

  const fetchConcessions = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/concessions/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.code === 1000) {
        setConcessions(data.result);
      } else {
        throw new Error(data.message || "Lỗi tải dữ liệu");
      }
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Chỉ tự động tải dữ liệu khi Popup được MỞ lên
  useEffect(() => {
    if (token && open) {
      fetchConcessions();
    }
  }, [token, open]);

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ active: true, category: "POPCORN" });
    setIsModalVisible(true);
  };

  const handleEdit = (record: Concession) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/concessions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.code === 1000) {
        message.success("Xóa món thành công!");
        fetchConcessions();
      } else {
        throw new Error(data.message || "Không thể xóa món này");
      }
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const handleSave = async (values: any) => {
    if (!token) return;
    try {
      const url = editingItem
        ? `${API_BASE_URL}/concessions/${editingItem.id}`
        : `${API_BASE_URL}/concessions`;
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (res.ok && data.code === 1000) {
        message.success(
          editingItem ? "Cập nhật thành công!" : "Thêm mới thành công!",
        );
        setIsModalVisible(false);
        fetchConcessions();
      } else {
        throw new Error(data.message || "Lưu thất bại");
      }
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value) + "đ";
  };

  const columns = [
    {
      title: "Ảnh",
      dataIndex: "imageUrl",
      key: "imageUrl",
      width: 100,
      render: (url: string) =>
        url ? (
          <img
            src={url}
            alt="img"
            className="w-12 h-12 object-cover rounded-md shadow-sm border border-gray-200"
          />
        ) : (
          <div className="w-12 h-12 flex items-center justify-center bg-gray-100 text-gray-400 rounded-md border border-gray-200">
            <PictureOutlined />
          </div>
        ),
    },
    {
      title: "Tên món",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Concession) => (
        <div>
          <Typography.Text strong>{text}</Typography.Text>
          <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
            {record.description}
          </div>
        </div>
      ),
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      render: (cat: string) => {
        let color = "default";
        if (cat === "POPCORN") color = "gold";
        if (cat === "DRINK") color = "blue";
        if (cat === "COMBO") color = "volcano";
        if (cat === "SNACK") color = "green";
        return <Tag color={color}>{cat}</Tag>;
      },
    },
    {
      title: "Giá bán",
      dataIndex: "price",
      key: "price",
      render: (price: number) => (
        <span className="font-semibold text-[#a61d24]">
          {formatCurrency(price)}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      render: (active: boolean) => (
        <Tag color={active ? "success" : "default"}>
          {active ? "Đang bán" : "Ngừng bán"}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 150,
      render: (_: any, record: Concession) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="text-blue-600 hover:bg-blue-50"
          />
          <Popconfirm
            title="Xóa món này?"
            description="Bạn có chắc chắn muốn xóa món này không?"
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
  ];

  return (
    // 🔥 BIẾN TOÀN BỘ GIAO DIỆN THÀNH POPUP (MODAL)
    <Modal
      title={
        <div className="pt-2">
          <Typography.Title level={3} style={{ margin: 0, color: "#4a3426" }}>
            Quản lý Bắp Nước (Concession)
          </Typography.Title>
          <Typography.Text
            type="secondary"
            className="font-normal text-sm block mt-1"
          >
            Thêm, sửa, xóa và quản lý danh sách đồ ăn thức uống tại rạp
          </Typography.Text>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1100} // Chiều rộng Popup
      centered
      destroyOnClose
      footer={[
        // 🔥 NÚT QUAY LẠI
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
          Thêm món mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={concessions}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 5 }}
        bordered
      />

      {/* Popup lồng Popup (Form thêm/sửa món) */}
      <Modal
        title={editingItem ? "Chỉnh sửa món" : "Thêm món mới"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        okText="Lưu lại"
        cancelText="Hủy bỏ"
        okButtonProps={{ className: "bg-[#a61d24]" }}
        centered
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="mt-4"
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="name"
                label="Tên món"
                rules={[{ required: true, message: "Vui lòng nhập tên món!" }]}
              >
                <Input placeholder="VD: Combo Bắp Nước 1" size="large" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="category"
                label="Danh mục"
                rules={[{ required: true, message: "Chọn danh mục!" }]}
              >
                <Select size="large">
                  <Select.Option value="POPCORN">Bắp (Popcorn)</Select.Option>
                  <Select.Option value="DRINK">Nước (Drink)</Select.Option>
                  <Select.Option value="COMBO">Combo</Select.Option>
                  <Select.Option value="SNACK">Đồ ăn vặt (Snack)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Giá bán (VNĐ)"
                rules={[{ required: true, message: "Vui lòng nhập giá bán!" }]}
              >
                <InputNumber
                  className="w-full"
                  size="large"
                  min={0}
                  step={1000}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value!.replace(/,/g, "") as any}
                  placeholder="VD: 85000"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="active"
                label="Trạng thái kinh doanh"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Đang bán"
                  unCheckedChildren="Ngừng bán"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="imageUrl" label="Đường dẫn ảnh (URL)">
            <Input
              placeholder="VD: https://domain.com/bap-rang.jpg"
              size="large"
            />
          </Form.Item>

          <Form.Item name="description" label="Mô tả chi tiết">
            <Input.TextArea
              rows={3}
              placeholder="VD: Bao gồm 1 bắp phô mai và 2 nước ngọt cỡ lớn..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
}

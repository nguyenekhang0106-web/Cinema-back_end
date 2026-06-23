"use client";

import {
  CalendarOutlined,
  EnvironmentOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Card,
  Col,
  Empty,
  Radio,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import { useDictionary } from "./locale-provider";

export function QuickBookingPanel() {
  const dictionary = useDictionary();
  const [ticketType, setTicketType] = useState("by-movie");

  return (
    <Card
      bordered={false}
      className="cinema-paper rounded-[24px]"
      styles={{ body: { padding: 24 } }}
    >
      <Space direction="vertical" size={18} className="w-full">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <Typography.Title level={4} style={{ margin: 0, color: "#4a3426" }}>
              {dictionary.quickBooking.title}
            </Typography.Title>
            <Typography.Text style={{ color: "#7b6a58" }}>
              {dictionary.quickBooking.description}
            </Typography.Text>
          </div>
          <Radio.Group
            className="quick-booking-toggle w-full md:w-auto shrink-0 flex"
            value={ticketType}
            onChange={(event) => setTicketType(event.target.value)}
            buttonStyle="solid"
          >
            {/* Thêm flex-1 text-center để 2 nút chia đều 50/50 chiều ngang trên điện thoại */}
            <Radio.Button className="flex-1 text-center" value="by-movie">
              {dictionary.quickBooking.byMovie}
            </Radio.Button>
            <Radio.Button className="flex-1 text-center" value="by-cinema">
              {dictionary.quickBooking.byCinema}
            </Radio.Button>
          </Radio.Group>
        </div>

        <div className="rounded-2xl border border-[#ead8c1] bg-[#fff9f2] p-4">
          <Row gutter={[12, 12]}>
            <Col xs={24} md={12} lg={6}>
              <Select
                disabled
                size="large"
                className="w-full"
                placeholder={dictionary.quickBooking.selectMovie}
              />
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Select
                disabled
                size="large"
                className="w-full"
                placeholder={dictionary.quickBooking.selectCinema}
                suffixIcon={<EnvironmentOutlined />}
              />
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Select
                disabled
                size="large"
                className="w-full"
                placeholder={dictionary.quickBooking.selectDate}
                suffixIcon={<CalendarOutlined />}
              />
            </Col>
            <Col xs={24} md={12} lg={6}>
              <Select
                disabled
                size="large"
                className="w-full"
                placeholder={dictionary.quickBooking.selectFormat}
              />
            </Col>
          </Row>
          <div className="mt-4">
            <Alert
              type="info"
              showIcon
              icon={<ApiOutlined />}
              message={dictionary.quickBooking.integrationTitle}
              description={dictionary.quickBooking.integrationDescription}
            />
          </div>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Space wrap>
              <Tag color="gold">2D</Tag>
              <Tag color="red">IMAX</Tag>
              <Tag color="blue">4DX</Tag>
              <Tag color="purple">Gold Class</Tag>
            </Space>
            <Tag color="processing">{dictionary.quickBooking.backendHint}</Tag>
          </div>
          <div className="mt-4 rounded-2xl border border-dashed border-[#d7c0a0] bg-white/70 p-4">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={dictionary.quickBooking.integrationDescription}
            />
          </div>
        </div>
      </Space>
    </Card>
  );
}

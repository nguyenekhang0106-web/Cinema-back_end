"use client";

import { Alert, Button, Card, Col, Form, Input, Radio, Row, Space, Typography } from "antd";
import { ApiOutlined } from "@ant-design/icons";
import { formatCurrency } from "../lib/i18n";
import { useDictionary, useLocale } from "./locale-provider";

export function CheckoutClient({
  movieTitle,
  cinemaName,
  time,
  seats,
  total,
}: {
  movieTitle: string;
  cinemaName: string;
  time: string;
  seats: string[];
  total: number;
}) {
  const locale = useLocale();
  const dictionary = useDictionary();

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={15}>
        <Card bordered={false} className="cinema-paper rounded-[28px]">
          <Typography.Title level={2} style={{ marginTop: 0, color: "#4a3426" }}>
            {dictionary.checkout.title}
          </Typography.Title>
          <Alert
            className="mb-5"
            type="info"
            showIcon
            icon={<ApiOutlined />}
            message={dictionary.checkout.integrationTitle}
            description={dictionary.checkout.integrationDescription}
          />
          <Form layout="vertical">
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="fullName" label={dictionary.checkout.fullName}>
                  <Input size="large" placeholder="Nguyen Van A" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="phone" label={dictionary.checkout.phone}>
                  <Input size="large" placeholder="0909 000 000" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="email" label={dictionary.checkout.email}>
              <Input size="large" placeholder="ban@kctcinema.vn" />
            </Form.Item>
            <Form.Item
              name="payment"
              label={dictionary.checkout.paymentMethod}
              initialValue="card"
            >
              <Radio.Group className="w-full">
                <Space direction="vertical" className="w-full">
                  <Radio value="card">{dictionary.checkout.card}</Radio>
                  <Radio value="momo">{dictionary.checkout.wallet}</Radio>
                  <Radio value="counter">{dictionary.checkout.counter}</Radio>
                </Space>
              </Radio.Group>
            </Form.Item>
            <Button size="large" type="primary" disabled>
              {dictionary.checkout.integrationButton}
            </Button>
          </Form>
        </Card>
      </Col>
      <Col xs={24} lg={9}>
        <Card bordered={false} className="cinema-paper rounded-[28px]">
          <Typography.Title level={4} style={{ marginTop: 0, color: "#4a3426" }}>
            {dictionary.checkout.orderSummary}
          </Typography.Title>
          <Space direction="vertical" size={10} className="w-full">
            <Typography.Text strong>{movieTitle}</Typography.Text>
            <Typography.Text>{cinemaName}</Typography.Text>
            <Typography.Text>
              {dictionary.checkout.showtime}: {time}
            </Typography.Text>
            <Typography.Text>
              {dictionary.checkout.seats}: {seats.join(", ")}
            </Typography.Text>
            <Typography.Text>
              {dictionary.checkout.total}: <strong>{formatCurrency(locale, total)}</strong>
            </Typography.Text>
          </Space>
        </Card>
      </Col>
    </Row>
  );
}

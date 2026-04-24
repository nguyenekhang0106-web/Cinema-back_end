"use client";

import { Card, Col, Row, Space, Tag, Typography } from "antd";
import { useDictionary } from "./locale-provider";

export function TemplatePage(props: {
  title: string;
  description: string;
  eyebrow: string;
}) {
  const dictionary = useDictionary();

  return (
    <div className="space-y-8">
      <Card bordered={false} className="cinema-hero-banner rounded-[28px] text-white">
        <Space direction="vertical" size={18} className="w-full">
          <Tag color="gold">{props.eyebrow}</Tag>
          <Typography.Title level={1} style={{ color: "#fff", margin: 0 }}>
            {props.title}
          </Typography.Title>
          <Typography.Paragraph
            style={{
              color: "rgba(255,255,255,0.82)",
              fontSize: 16,
              maxWidth: 760,
              marginBottom: 0,
            }}
          >
            {props.description}
          </Typography.Paragraph>
        </Space>
      </Card>

      <Row gutter={[24, 24]}>
        {dictionary.pages.placeholderCards.map((item) => (
          <Col xs={24} md={8} key={item.title}>
            <Card bordered={false} className="cinema-paper h-full rounded-[24px]">
              <Typography.Title level={4} style={{ color: "#4a3426" }}>
                {item.title}
              </Typography.Title>
              <Typography.Paragraph style={{ color: "#6d5a46", marginBottom: 0 }}>
                {item.desc}
              </Typography.Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

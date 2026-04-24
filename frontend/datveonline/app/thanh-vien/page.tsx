"use client";

import { GiftOutlined, ProfileOutlined, StarOutlined } from "@ant-design/icons";
import { Card, Col, Row, Space, Tag, Typography } from "antd";
import { useDictionary } from "../components/locale-provider";
import { SiteShell } from "../components/site-shell";

export default function MemberPage() {
  const dictionary = useDictionary();

  return (
    <div className="cinema-page">
      <SiteShell>
        <main className="cinema-shell px-4 py-8 sm:px-6">
          <Card bordered={false} className="cinema-paper rounded-[28px]">
            <Tag color="gold">{dictionary.pages.member.eyebrow}</Tag>
            <Typography.Title level={1} style={{ color: "#4a3426" }}>
              {dictionary.pages.member.title}
            </Typography.Title>
            <Typography.Paragraph style={{ color: "#6d5a46", marginBottom: 0 }}>
              {dictionary.pages.member.description}
            </Typography.Paragraph>
          </Card>
          <Row gutter={[24, 24]} className="mt-8">
            {[
              {
                icon: <StarOutlined style={{ color: "#c89a2b", fontSize: 24 }} />,
                ...dictionary.pages.member.features[0],
              },
              {
                icon: <GiftOutlined style={{ color: "#a61d24", fontSize: 24 }} />,
                ...dictionary.pages.member.features[1],
              },
              {
                icon: <ProfileOutlined style={{ color: "#a61d24", fontSize: 24 }} />,
                ...dictionary.pages.member.features[2],
              },
            ].map((item) => (
              <Col xs={24} md={8} key={item.title}>
                <Card bordered={false} className="cinema-paper rounded-[24px] h-full">
                  <Space direction="vertical" size={12}>
                    {item.icon}
                    <Typography.Title level={4} style={{ margin: 0, color: "#4a3426" }}>
                      {item.title}
                    </Typography.Title>
                    <Typography.Paragraph style={{ color: "#6d5a46", marginBottom: 0 }}>
                      {item.desc}
                    </Typography.Paragraph>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </main>
      </SiteShell>
    </div>
  );
}

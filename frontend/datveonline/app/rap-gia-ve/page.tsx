"use client";

import { EnvironmentOutlined } from "@ant-design/icons";
import { Button, Card, List, Space, Tag, Typography } from "antd";
import { useDictionary, useLocale } from "../components/locale-provider";
import { SiteShell } from "../components/site-shell";
import { getLocalizedCinemas } from "../lib/localized-data";

export default function CinemaPricingPage() {
  const locale = useLocale();
  const dictionary = useDictionary();
  const cinemas = getLocalizedCinemas(locale);

  return (
    <div className="cinema-page">
      <SiteShell>
        <main className="cinema-shell px-4 py-8 sm:px-6">
          <Card bordered={false} className="cinema-paper rounded-[28px]">
            <Tag color="red">{dictionary.pages.cinemas.eyebrow}</Tag>
            <Typography.Title level={1} style={{ color: "#4a3426" }}>
              {dictionary.pages.cinemas.title}
            </Typography.Title>
            <Typography.Paragraph style={{ color: "#6d5a46", marginBottom: 0 }}>
              {dictionary.pages.cinemas.description}
            </Typography.Paragraph>
          </Card>
          <List
            className="mt-8"
            itemLayout="vertical"
            dataSource={cinemas}
            renderItem={(cinema) => (
              <List.Item key={cinema.id}>
                <Card bordered={false} className="cinema-paper rounded-[24px]">
                  <Space direction="vertical" size={14} className="w-full">
                    <div>
                      <Typography.Title level={3} style={{ margin: 0, color: "#4a3426" }}>
                        {cinema.name}
                      </Typography.Title>
                      <Typography.Paragraph style={{ color: "#6d5a46", margin: "8px 0 0" }}>
                        <EnvironmentOutlined /> {cinema.address}
                      </Typography.Paragraph>
                    </div>
                    <Space wrap>
                      {cinema.features.map((feature) => (
                        <Tag key={feature} color="gold">
                          {feature}
                        </Tag>
                      ))}
                    </Space>
                    <Typography.Text style={{ color: "#8c6b45" }}>
                      {dictionary.pages.cinemas.showtimeHint}
                    </Typography.Text>
                    <Space wrap>
                      {cinema.showtimes.map((time) => (
                        <Button key={`${cinema.id}-${time}`} disabled>
                          {time}
                        </Button>
                      ))}
                    </Space>
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        </main>
      </SiteShell>
    </div>
  );
}

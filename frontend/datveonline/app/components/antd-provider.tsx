"use client";

import { App, ConfigProvider } from "antd";

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#a61d24",
          colorInfo: "#a61d24",
          colorWarning: "#c89a2b",
          colorSuccess: "#2f7d32",
          colorTextBase: "#1f1f1f",
          colorBgBase: "#fffdfa",
          colorBorderSecondary: "#e9d8bf",
          borderRadius: 14,
          fontFamily:
            "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
        },
        components: {
          Layout: {
            headerBg: "transparent",
            bodyBg: "transparent",
            footerBg: "transparent",
          },
          Menu: {
            itemBg: "transparent",
            itemColor: "#4a3426",
            itemHoverColor: "#a61d24",
            itemSelectedColor: "#a61d24",
            horizontalItemSelectedColor: "#a61d24",
            horizontalItemHoverColor: "#a61d24",
            itemActiveBg: "transparent",
          },
          Tabs: {
            itemColor: "#6b7280",
            itemSelectedColor: "#a61d24",
            itemHoverColor: "#a61d24",
            inkBarColor: "#a61d24",
          },
          Card: {
            bodyPadding: 20,
          },
          Button: {
            fontWeight: 700,
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}

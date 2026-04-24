import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import localFont from "next/font/local";
import "antd/dist/reset.css";
import "./globals.css";
import { AntdProvider } from "./components/antd-provider";
import { AuthSessionProvider } from "./components/auth-session-provider";
import { ChatWidget } from "./components/chat-widget";
import { LanguageHtmlUpdater } from "./components/language-html-updater";
import { LocaleProvider } from "./components/locale-provider";

const geistSans = localFont({
  src: "../node_modules/next/dist/next-devtools/server/font/geist-latin-ext.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "../node_modules/next/dist/next-devtools/server/font/geist-mono-latin-ext.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "KCT Cinema | Dat ve xem phim online",
  description:
    "Template front-end dat ve xem phim online duoc xay dung bang Next.js va Ant Design, lay cam hung tu giao dien CGV.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        <LocaleProvider locale="vi">
          <AuthSessionProvider>
            <LanguageHtmlUpdater />
            <AntdRegistry>
              <AntdProvider>
                {children}
                <ChatWidget />
              </AntdProvider>
            </AntdRegistry>
          </AuthSessionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

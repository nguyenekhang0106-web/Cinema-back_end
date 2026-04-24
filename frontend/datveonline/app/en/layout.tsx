import type { Metadata } from "next";
import { AuthSessionProvider } from "../components/auth-session-provider";
import { LanguageHtmlUpdater } from "../components/language-html-updater";
import { LocaleProvider } from "../components/locale-provider";

export const metadata: Metadata = {
  title: "KCT Cinema | Online Movie Booking",
  description:
    "English version of the KCT Cinema ticket booking front-end built with Next.js and Ant Design.",
};

export default function EnglishLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LocaleProvider locale="en">
      <AuthSessionProvider>
        <LanguageHtmlUpdater />
        {children}
      </AuthSessionProvider>
    </LocaleProvider>
  );
}

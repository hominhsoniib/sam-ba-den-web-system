import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NEXUS Enterprise — Hệ Sinh Thái Quản Trị Doanh Nghiệp Số",
  description:
    "Một hệ sinh thái, một nguồn dữ liệu, một hệ điều hành doanh nghiệp — kết nối kế hoạch, ngân sách, vận hành, CRM, DMS, nhân sự, dữ liệu và AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="bg-paper text-ink font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

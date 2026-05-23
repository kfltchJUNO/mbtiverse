import type { Metadata } from "next";
import { Inter } from "next/font/google";
// @ts-ignore
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MBTIverse 🎭",
  description: "실시간으로 업데이트되는 16가지 MBTI 유형별 꿀잼 썰 모음!",
  openGraph: {
    title: "MBTIverse 🎭 - MBTI 과몰입러를 위한 꿀잼 공간",
    description: "카톡 안 읽씹할 때? 갑자기 약속 취소될 때? 16가지 MBTI 유형별 리얼 반응을 지금 확인해보세요!",
    siteName: "MBTIverse",
    locale: "ko_KR",
    type: "website",
    // 💡 JPG 포맷을 인식할 수 있도록 메타데이터에 강제 주입합니다.
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "MBTIverse 대표 이미지",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
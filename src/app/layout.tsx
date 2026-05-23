import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script"; // 💡 Script 임포트 추가
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
      <head>
        {/* 💡 구글 애드센스 스크립트 추가 */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4585319125929329"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
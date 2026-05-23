import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// 💡 브라우저 탭 텍스트 및 카카오톡 공유 미리보기(Open Graph) 설정
export const metadata: Metadata = {
  title: "MBTIverse 🎭",
  description: "실시간으로 업데이트되는 16가지 MBTI 유형별 꿀잼 썰 모음!",
  openGraph: {
    title: "MBTIverse 🎭 - MBTI 과몰입러를 위한 꿀잼 썰",
    description: "카톡 안 읽씹할 때? 갑자기 약속 취소될 때? 16가지 MBTI 유형별 리얼 반응을 지금 확인해보세요!",
    // url: "https://본인의-vercel-도메인.vercel.app", // 나중에 본인의 실제 주소로 바꿔주세요!
    siteName: "MBTIverse",
    locale: "ko_KR",
    type: "website",
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
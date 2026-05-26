"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../lib/firebase";
import { ALL_CHARACTERS } from "../lib/characters";
import type { UserProfile } from "../hooks/useAuthGuard";

interface ChatBannerProps {
  profile: UserProfile | null;
}

// 미리 보여줄 캐릭터 슬롯 (좌우 스크롤용 프리뷰 — 랜덤 6인)
const PREVIEW_CHARS = [...ALL_CHARACTERS].sort(() => Math.random() - 0.5).slice(0, 6);

export default function ChatBanner({ profile }: ChatBannerProps) {
  const router = useRouter();
  const [imageMap, setImageMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadImages() {
      try {
        const snap = await getDocs(collection(db, "character_profiles"));
        const map: Record<string, string> = {};
        snap.docs.forEach(d => {
          const data = d.data();
          if (data.imageUrl) map[d.id] = data.imageUrl;
        });
        setImageMap(map);
      } catch {}
    }
    loadImages();
  }, []);

  return (
    <div
      onClick={() => router.push("/chat")}
      className="group relative cursor-pointer rounded-2xl overflow-hidden border border-indigo-500/30 hover:border-indigo-400/60 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-900/30 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950"
    >
      {/* 배경 글로우 */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative p-5">
        {/* 상단: 라벨 + 스텔라 잔액 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-bold tracking-wider uppercase">LIVE · 16 Characters</span>
          </div>
          <span className="text-amber-400 text-sm font-black">
            {profile?.stella || 0} ⭐
          </span>
        </div>

        {/* 메인 텍스트 */}
        <h2 className="text-white font-black text-xl mb-1 leading-tight">
          AI 캐릭터와 대화하기
        </h2>
        <p className="text-white/50 text-xs mb-4">
          16가지 MBTI 캐릭터와 실시간 1:1 채팅 · 맞춤 사진 요청 가능
        </p>

        {/* 캐릭터 아바타 프리뷰 */}
        <div className="flex items-center gap-2 mb-4 overflow-hidden">
          <div className="flex -space-x-2">
            {PREVIEW_CHARS.slice(0, 5).map((char) => (
              <div
                key={char.id}
                className={`w-9 h-9 rounded-full border-2 border-slate-900 overflow-hidden bg-gradient-to-br ${char.gradient} flex items-center justify-center flex-shrink-0`}
              >
                {imageMap[char.id] ? (
                  <img src={imageMap[char.id]} alt={char.name} className="w-full h-full object-cover object-top" />
                ) : (
                  <span className="text-base">{char.emoji}</span>
                )}
              </div>
            ))}
            <div className="w-9 h-9 rounded-full border-2 border-slate-900 bg-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-white/60 text-xs font-bold">+11</span>
            </div>
          </div>
          <span className="text-white/30 text-xs ml-1">재신, 지한, 시아 외 13인</span>
        </div>

        {/* 하단: CTA */}
        <div className="flex items-center justify-between">
          <div className="flex gap-3 text-xs text-white/40">
            <span>💬 매일 5회 무료</span>
            <span>📸 사진 요청 50⭐</span>
          </div>
          <span className="text-indigo-400 font-bold text-sm group-hover:text-indigo-300 transition-colors">
            캐릭터 선택 →
          </span>
        </div>
      </div>
    </div>
  );
}
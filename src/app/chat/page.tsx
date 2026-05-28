"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, getDocs, doc, getDoc, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { ALL_CHARACTERS, MALE_CHARACTERS, FEMALE_CHARACTERS, type Character } from "../../lib/characters";

type GenderTab = "all" | "male" | "female";

// 캐릭터 카드 컴포넌트
function CharacterCard({
  character,
  imageUrl,
  messageCount,
  rank,
}: {
  character: Character;
  imageUrl?: string;
  messageCount: number;
  rank?: number;
}) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/chat/${character.id}`)}
      className="group relative cursor-pointer rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
      {/* 배경 그라디언트 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${character.gradient} opacity-90`} />

      {/* 인기 랭킹 배지 */}
      {rank && rank <= 3 && (
        <div className={`absolute top-3 left-3 z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-lg
          ${rank === 1 ? "bg-yellow-400 text-yellow-900" : rank === 2 ? "bg-slate-300 text-slate-700" : "bg-amber-600 text-amber-100"}`}>
          {rank}
        </div>
      )}

      {/* 캐릭터 이미지 or 이모지 플레이스홀더 */}
      <div className="relative h-52 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={character.name}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-7xl opacity-60 group-hover:scale-110 transition-transform duration-300">
              {character.emoji}
            </span>
          </div>
        )}
        {/* 하단 그라디언트 오버레이 */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      {/* 캐릭터 정보 */}
      <div className="relative p-4">
        <div className="flex items-end justify-between mb-1">
          <div>
            <span className="text-white/50 text-xs font-mono tracking-widest">{character.id}</span>
            <h3 className="text-white font-black text-lg leading-tight">
              {character.name}
              <span className="text-white/40 text-xs font-normal ml-1.5">{character.romanName}</span>
            </h3>
          </div>
          <span className="text-2xl">{character.emoji}</span>
        </div>

        <p className="text-white/60 text-xs mb-3 leading-relaxed line-clamp-1">
          {character.job}
        </p>

        <p className="text-white/80 text-xs leading-relaxed line-clamp-2 mb-3">
          {character.appeal}
        </p>

        {/* 태그 */}
        <div className="flex flex-wrap gap-1 mb-3">
          {character.tags.filter(t => !["남성","여성"].includes(t) && t !== character.id).slice(0, 2).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-white/10 rounded-full text-white/60 text-[10px] font-medium">
              #{tag}
            </span>
          ))}
        </div>

        {/* 대화 수 */}
        <div className="flex items-center justify-between">
          <span className="text-white/40 text-[10px]">
            💬 {messageCount.toLocaleString()}번의 대화
          </span>
          <span className={`text-xs font-bold ${character.accentColor} group-hover:underline`}>
            대화하기 →
          </span>
        </div>
      </div>
    </div>
  );
}

// 인기 랭킹 TOP3 배너
function RankingBanner({
  rankings,
  imageMap,
}: {
  rankings: { character: Character; count: number; rank: number }[];
  imageMap: Record<string, string>;
}) {
  if (rankings.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🏆</span>
        <h2 className="text-white font-black text-lg">이번 주 인기 랭킹</h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {rankings.slice(0, 3).map(({ character, count, rank }) => (
          <Link
            key={character.id}
            href={`/chat/${character.id}`}
            className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-all hover:-translate-y-0.5"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${character.gradient}`} />
            <div className="relative p-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex-shrink-0 overflow-hidden border-2
                ${rank === 1 ? "border-yellow-400" : rank === 2 ? "border-slate-300" : "border-amber-600"}`}>
                {imageMap[character.id] ? (
                  <img src={imageMap[character.id]} alt={character.name} className="w-full h-full object-cover object-top" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/10 text-sm">{character.emoji}</div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-black
                    ${rank === 1 ? "text-yellow-400" : rank === 2 ? "text-slate-300" : "text-amber-500"}`}>
                    #{rank}
                  </span>
                  <span className="text-white font-bold text-sm truncate">{character.name}</span>
                </div>
                <p className="text-white/40 text-[10px]">{count.toLocaleString()}회</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ChatSelectPage() {
  const { user, profile, loading, loginWithGoogle } = useAuthGuard();
  const router = useRouter();
  const [genderTab, setGenderTab] = useState<GenderTab>("all");
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});
  const [rankings, setRankings] = useState<{ character: Character; count: number; rank: number }[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // 로그인 체크
  useEffect(() => {
    if (!loading && !user) {
      alert("로그인이 필요한 서비스입니다.");
      router.push("/");
    }
  }, [loading, user, router]);

  // 캐릭터 이미지 + 메시지 카운트 로드
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      setDataLoading(true);
      try {
        // 1. 캐릭터 이미지 로드 (Firestore character_profiles 컬렉션)
        const imgSnap = await getDocs(collection(db, "character_profiles"));
        const imgs: Record<string, string> = {};
        imgSnap.docs.forEach(d => {
          const data = d.data();
          if (data.imageUrl) imgs[d.id] = data.imageUrl;
        });
        setImageMap(imgs);

        // 2. character_stats에서 직접 집계 (경량)
        const statsSnap = await getDocs(collection(db, "character_stats"));
        const counts: Record<string, number> = {};
        statsSnap.docs.forEach(d => {
          counts[d.id] = d.data().messageCount || 0;
        });
        setMessageCounts(counts);

        // 3. 랭킹 산출
        const ranked = ALL_CHARACTERS
          .map(c => ({ character: c, count: counts[c.id] || 0 }))
          .sort((a, b) => b.count - a.count)
          .map((item, idx) => ({ ...item, rank: idx + 1 }));
        setRankings(ranked);

      } catch (err) {
        console.error("데이터 로드 실패:", err);
      }
      setDataLoading(false);
    }

    loadData();
  }, [user]);

  const displayCharacters =
    genderTab === "all" ? ALL_CHARACTERS :
    genderTab === "male" ? MALE_CHARACTERS : FEMALE_CHARACTERS;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* 헤더 */}
      <div className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="text-white/50 hover:text-white text-sm transition">
            ← 홈
          </button>
          <h1 className="text-white font-black text-lg">💬 캐릭터 채팅</h1>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-sm font-bold">{profile?.stella || 0} ⭐</span>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* 인기 랭킹 배너 */}
        {!dataLoading && <RankingBanner rankings={rankings} imageMap={imageMap} />}

        {/* 성별 탭 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-black text-xl">16인의 캐릭터</h2>
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
            {(["all", "male", "female"] as GenderTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setGenderTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  genderTab === tab
                    ? "bg-white text-slate-900"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {tab === "all" ? "전체" : tab === "male" ? "👦 남성" : "👩 여성"}
              </button>
            ))}
          </div>
        </div>

        {/* 캐릭터 그리드 */}
        {dataLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/5 animate-pulse h-72" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayCharacters.map(character => {
              const rankItem = rankings.find(r => r.character.id === character.id);
              return (
                <CharacterCard
                  key={character.id}
                  character={character}
                  imageUrl={imageMap[character.id]}
                  messageCount={messageCounts[character.id] || 0}
                  rank={rankItem?.rank}
                />
              );
            })}
          </div>
        )}

        {/* 스텔라 안내 */}
        <div className="mt-10 p-5 rounded-2xl bg-white/5 border border-white/10 text-center">
          <p className="text-white/50 text-sm">
            매일 <span className="text-white font-bold">5회 무료</span> 대화 제공 ·
            이후 <span className="text-amber-400 font-bold">2⭐/회</span> ·
            맞춤 사진 요청 <span className="text-amber-400 font-bold">50⭐</span>
          </p>
          <p className="text-white/30 text-xs mt-1">현재 잔액: {profile?.stella || 0} ⭐</p>
        </div>
      </main>
    </div>
  );
}
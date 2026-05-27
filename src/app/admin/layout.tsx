"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '../../hooks/useAuthGuard';

const voiceData = {
  ENFJ: { speed: 25, speedLabel: "Slower", stability: 75, stabilityLabel: "More Stable", similarity: 85, similarityLabel: "High", exaggeration: 15, note: "Warm, empathetic, leading, clear pronunciation. Avoid overly dramatic tone." },
  ENFP: { speed: 65, speedLabel: "Faster", stability: 40, stabilityLabel: "Variable", similarity: 70, similarityLabel: "Medium High", exaggeration: 60, note: "Energetic, bright, dynamic pacing. Capture enthusiastic inflections." },
  ENTJ: { speed: 55, speedLabel: "Slightly Fast", stability: 85, stabilityLabel: "Very Stable", similarity: 80, similarityLabel: "High", exaggeration: 25, note: "Confident, authoritative, steady and clear. Professional tone." },
  ENTP: { speed: 70, speedLabel: "Faster", stability: 45, stabilityLabel: "Variable", similarity: 75, similarityLabel: "Medium High", exaggeration: 55, note: "Witty, engaging, slightly provocative tone. Varied pitch." },
  ESFJ: { speed: 45, speedLabel: "Moderate", stability: 80, stabilityLabel: "Stable", similarity: 85, similarityLabel: "High", exaggeration: 20, note: "Friendly, welcoming, harmonious and polite." },
  ESFP: { speed: 60, speedLabel: "Slightly Fast", stability: 35, stabilityLabel: "Highly Variable", similarity: 65, similarityLabel: "Medium", exaggeration: 70, note: "Excited, dramatic, highly expressive. Use lively intonations." },
  ESTJ: { speed: 50, speedLabel: "Moderate", stability: 90, stabilityLabel: "Very Stable", similarity: 80, similarityLabel: "High", exaggeration: 10, note: "Direct, factual, organized and commanding. No unnecessary emotion." },
  ESTP: { speed: 65, speedLabel: "Faster", stability: 50, stabilityLabel: "Moderate", similarity: 70, similarityLabel: "Medium High", exaggeration: 45, note: "Action-oriented, bold, persuasive and casual." },
  INFJ: { speed: 20, speedLabel: "Slower", stability: 70, stabilityLabel: "Stable", similarity: 90, similarityLabel: "Very High", exaggeration: 10, note: "Deep, insightful, calm and gentle. Reflective pausing." },
  INFP: { speed: 30, speedLabel: "Slower", stability: 55, stabilityLabel: "Moderate", similarity: 85, similarityLabel: "High", exaggeration: 20, note: "Soft, dreamy, sincere. Slight emotional vulnerability in tone." },
  INTJ: { speed: 40, speedLabel: "Moderate Slow", stability: 85, stabilityLabel: "Very Stable", similarity: 90, similarityLabel: "Very High", exaggeration: 5, note: "Analytical, detached, precise and intellectual." },
  INTP: { speed: 50, speedLabel: "Moderate", stability: 60, stabilityLabel: "Moderate", similarity: 80, similarityLabel: "High", exaggeration: 15, note: "Thoughtful, slightly hesitant pauses, logical explanation tone." },
  ISFJ: { speed: 35, speedLabel: "Slower", stability: 85, stabilityLabel: "Very Stable", similarity: 85, similarityLabel: "High", exaggeration: 10, note: "Nurturing, soft-spoken, reliable and warm." },
  ISFP: { speed: 35, speedLabel: "Slower", stability: 65, stabilityLabel: "Moderate", similarity: 80, similarityLabel: "High", exaggeration: 15, note: "Gentle, easy-going, quiet aesthetic appreciation tone." },
  ISTJ: { speed: 45, speedLabel: "Moderate", stability: 95, stabilityLabel: "Extremely Stable", similarity: 85, similarityLabel: "High", exaggeration: 0, note: "Factual, traditional, monotone-leaning, extremely clear." },
  ISTP: { speed: 55, speedLabel: "Slightly Fast", stability: 75, stabilityLabel: "Stable", similarity: 75, similarityLabel: "Medium High", exaggeration: 5, note: "Cool, detached, efficient and straightforward." },
};

const NAV_ITEMS = [
  { label: "Generator", emoji: "⚙️", path: "/admin" },
  { label: "Requests", emoji: "📸", path: "/admin/photo-requests" },
  { label: "Chars",    emoji: "🎭", path: "/admin/character-profiles" },
  { label: "Images",  emoji: "🖼️", path: "/admin/post-images" },
  { label: "Tests",   emoji: "🧪", path: "/admin/test-builder" },
  { label: "Stella",  emoji: "⭐", path: "/admin/stella" },
  { label: "AutoPic", emoji: "🤖", path: "/admin/auto-photos" },
  { label: "MBTI", emoji: "🎭", path: "/admin/mbti-assets" },
  { label: "Scripts", emoji: "📄", path: "/scripts" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, isAdmin, logout } = useAuthGuard();
  const router = useRouter();
  const [selectedMBTI, setSelectedMBTI] = useState<keyof typeof voiceData>("ENFJ");

  // 사이드바 토글 상태
  // 데스크탑: 기본 열림 / 모바일: 기본 닫힘
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // 음성 가이드라인 섹션 접기/펴기 (모바일용)
  const [voiceOpen, setVoiceOpen] = useState(true);

  useEffect(() => {
    if (!loading && user !== undefined) {
      if (!user || !isAdmin) {
        alert("관리자 권한이 없습니다.");
        router.push('/');
      }
    }
  }, [loading, user, isAdmin, router]);

  // 라우트 변경 시 모바일 사이드바 자동 닫기
  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const currentGuide = voiceData[selectedMBTI];

  const SidebarContent = () => (
    <div className="flex flex-col gap-5 h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-white">Voice Guidelines</h2>
        {/* 모바일에서만 닫기 버튼 표시 */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
        >
          ✕
        </button>
      </div>

      {/* MBTI 선택 */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Select MBTI Type
        </label>
        <select
          value={selectedMBTI}
          onChange={(e) => setSelectedMBTI(e.target.value as keyof typeof voiceData)}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500 text-sm"
        >
          {Object.keys(voiceData).map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* 음성 가이드라인 접기/펴기 */}
      <div>
        <button
          onClick={() => setVoiceOpen(v => !v)}
          className="w-full flex items-center justify-between text-sm font-bold text-slate-300 hover:text-white transition mb-3"
        >
          <span>📊 Voice Settings</span>
          <span className="text-slate-500 text-xs">{voiceOpen ? "▲ 접기" : "▼ 펼치기"}</span>
        </button>

        {voiceOpen && (
          <div className="space-y-4">
            {[
              { label: "Speed", value: currentGuide.speed, sub: currentGuide.speedLabel, color: "bg-amber-300" },
              { label: "Stability", value: currentGuide.stability, sub: currentGuide.stabilityLabel, color: "bg-teal-400" },
              { label: "Similarity", value: currentGuide.similarity, sub: currentGuide.similarityLabel, color: "bg-teal-400" },
              { label: "Exaggeration", value: currentGuide.exaggeration, sub: "Ratio", color: "bg-amber-300" },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">{label}</span>
                  <span className="font-bold text-slate-400">{selectedMBTI} · {sub}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3">
                  <div
                    className={`${color} h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 text-xs">
              <p className="font-bold mb-1 text-indigo-300">Notes ({selectedMBTI})</p>
              <p className="text-slate-400 leading-relaxed">{currentGuide.note}</p>
            </div>
          </div>
        )}
      </div>

      {/* 네비게이션 */}
      <div className="mt-auto pt-4 border-t border-slate-700">
        <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-3 font-bold">Navigation</p>
        <div className="grid grid-cols-4 gap-1.5">
          {NAV_ITEMS.map(({ label, emoji, path }) => (
            <button
              key={path}
              onClick={() => { router.push(path); setSidebarOpen(false); }}
              className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-700 transition text-slate-400 hover:text-indigo-400 cursor-pointer"
            >
              <span className="text-lg">{emoji}</span>
              <span className="text-[9px] font-bold">{label}</span>
            </button>
          ))}
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-700 transition text-slate-400 hover:text-red-400 cursor-pointer"
          >
            <span className="text-lg">➜</span>
            <span className="text-[9px] font-bold">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white">

      {/* ── 모바일 상단 헤더 (lg 미만에서만 표시) ── */}
      <header className="lg:hidden sticky top-0 z-30 bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-black text-indigo-400">MBTIverse Admin</h1>
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-sm font-bold text-slate-300 transition"
        >
          <span>☰</span>
          <span className="text-xs">메뉴</span>
        </button>
      </header>

      <div className="flex">
        {/* ── 데스크탑 사이드바 (lg 이상 항상 표시) ── */}
        <aside className="hidden lg:flex w-[360px] border-r border-slate-700 bg-slate-800 p-6 flex-col sticky top-0 h-screen overflow-y-auto flex-shrink-0">
          <SidebarContent />
        </aside>

        {/* ── 모바일 드로어 오버레이 ── */}
        {sidebarOpen && (
          <>
            {/* 배경 딤 */}
            <div
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            {/* 드로어 패널 (오른쪽에서 슬라이드) */}
            <div className="lg:hidden fixed top-0 right-0 z-50 w-[85vw] max-w-sm h-full bg-slate-800 border-l border-slate-700 p-5 overflow-y-auto">
              <SidebarContent />
            </div>
          </>
        )}

        {/* ── 메인 콘텐츠 ── */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto min-w-0">
          <header className="hidden lg:block mb-8 border-b border-slate-800 pb-4">
            <h1 className="text-3xl font-black text-indigo-400">MBTIverse Admin Panel</h1>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '../../../hooks/useAuthGuard';

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading, user, isAdmin, logout } = useAuthGuard();
  const router = useRouter();
  const [selectedMBTI, setSelectedMBTI] = useState<keyof typeof voiceData>("ENFJ");

  useEffect(() => {
    // loading 완료 + 로그인 상태 확인 후에만 권한 체크
    // user가 null이면 비로그인 → 홈으로
    // user가 있는데 isAdmin이 false면 → 일반 유저 → 홈으로
    if (!loading && user !== undefined) {
      if (!user || !isAdmin) {
        alert("관리자 권한이 없습니다.");
        router.push('/');
      }
    }
  }, [loading, user, isAdmin, router]);

  // loading 중이거나 아직 user 확인 전이면 스피너
  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const currentGuide = voiceData[selectedMBTI];

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-black text-indigo-400">MBTIverse Admin Panel</h1>
        </header>
        {children}
      </main>

      <aside className="w-[400px] border-l border-slate-700 bg-slate-800 p-6 flex flex-col gap-6 sticky top-0 h-screen overflow-y-auto">
        <h2 className="text-2xl font-bold">Voice Style Guidelines</h2>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select MBTI Type</label>
          <select
            value={selectedMBTI}
            onChange={(e) => setSelectedMBTI(e.target.value as keyof typeof voiceData)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white font-bold focus:outline-none focus:border-indigo-500"
          >
            {Object.keys(voiceData).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2 mt-2">
          <div className="flex justify-between text-sm">
            <span>Speed</span>
            <span className="font-bold">{selectedMBTI} ({currentGuide.speedLabel})</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-4">
            <div className="bg-amber-300 h-4 rounded-full transition-all duration-500" style={{ width: `${currentGuide.speed}%` }}></div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Stability</span>
            <span className="font-bold">{selectedMBTI} ({currentGuide.stabilityLabel})</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-4">
            <div className="bg-teal-400 h-4 rounded-full transition-all duration-500" style={{ width: `${currentGuide.stability}%` }}></div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Similarity</span>
            <span className="font-bold">{selectedMBTI} ({currentGuide.similarityLabel})</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-4">
            <div className="bg-teal-400 h-4 rounded-full transition-all duration-500" style={{ width: `${currentGuide.similarity}%` }}></div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Style Exaggeration</span>
            <span className="font-bold">Exaggerated Ratio</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-4">
            <div className="bg-amber-300 h-4 rounded-full transition-all duration-500" style={{ width: `${currentGuide.exaggeration}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-sm">
          <p className="font-bold mb-1 text-indigo-300">Voice Notes ({selectedMBTI})</p>
          <p className="text-slate-300">{currentGuide.note}</p>
        </div>

        <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/50 text-sm">
          <p className="font-bold mb-1">User Tip:</p>
          <p className="text-slate-300">This panel updates for the selected MBTI Type. Use these ratios for voice file generation!</p>
        </div>

        <div className="mt-auto grid grid-cols-4 gap-2 pt-6 border-t border-slate-700">
          <div onClick={() => router.push('/admin')} className="text-center text-xs flex flex-col items-center gap-1 cursor-pointer hover:text-indigo-400 transition">
            <span className="text-xl">⚙️</span> Generator
          </div>
          <div onClick={() => router.push('/admin/photo-requests')} className="text-center text-xs flex flex-col items-center gap-1 cursor-pointer hover:text-indigo-400 transition">
            <span className="text-xl">📸</span> Requests
          </div>
          <div onClick={() => router.push('/admin/character-profiles')} className="text-center text-xs flex flex-col items-center gap-1 cursor-pointer hover:text-indigo-400 transition">
            <span className="text-xl">🎭</span> Chars
          </div>
          <div onClick={() => router.push('/admin/post-images')} className="text-center text-xs flex flex-col items-center gap-1 cursor-pointer hover:text-indigo-400 transition">
            <span className="text-xl">🖼️</span> Images
          </div>
          <div onClick={() => router.push('/admin/test-builder')} className="text-center text-xs flex flex-col items-center gap-1 cursor-pointer hover:text-indigo-400 transition">
            <span className="text-xl">🧪</span> Tests
          </div>
          <div onClick={() => router.push('/admin/stella')} className="text-center text-xs flex flex-col items-center gap-1 cursor-pointer hover:text-indigo-400 transition">
            <span className="text-xl">⭐</span> Stella
          </div>
          <div onClick={() => router.push('/scripts')} className="text-center text-xs flex flex-col items-center gap-1 cursor-pointer hover:text-indigo-400 transition">
            <span className="text-xl">📄</span> Scripts
          </div>
          <div onClick={() => { logout(); router.push('/'); }} className="text-center text-xs flex flex-col items-center gap-1 cursor-pointer hover:text-red-400 transition">
            <span className="text-xl">➜</span> Logout
          </div>
        </div>
      </aside>
    </div>
  );
}
// src/app/admin/layout.tsx
import React from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* 메인 콘텐츠 영역 (Create Voice Script 폼 등이 위치) */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-black">MBTIverse Voice Script Generation Admin Panel</h1>
        </header>
        {children}
      </main>

      {/* 우측 고정 가이드라인 패널 (Personality Voice Style Guidelines) */}
      <aside className="w-[400px] border-l border-slate-700 bg-slate-800 p-6 flex flex-col gap-6 sticky top-0 h-screen">
        <h2 className="text-2xl font-bold">Personality Voice Style Guidelines</h2>
        
        {/* Speed 가이드 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Speed</span>
            <span className="font-bold">ENFJ (Slower)</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-4">
            <div className="bg-amber-300 h-4 rounded-full" style={{ width: '25%' }}></div>
          </div>
        </div>

        {/* Stability 가이드 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Stability</span>
            <span className="font-bold">ENFJ (More Stable)</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-4">
            <div className="bg-teal-400 h-4 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* Similarity 가이드 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Similarity</span>
            <span className="font-bold">ENFJ (High)</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-4">
            <div className="bg-teal-400 h-4 rounded-full" style={{ width: '85%' }}></div>
          </div>
        </div>

        {/* Style Exaggeration 가이드 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Style Exaggeration</span>
            <span className="font-bold">None/Exaggerated</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-4">
            <div className="bg-amber-300 h-4 rounded-full" style={{ width: '15%' }}></div>
          </div>
        </div>

        {/* Voice Notes */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-sm">
          <p className="font-bold mb-1">Voice Notes (ENFJ)</p>
          <p className="text-slate-300">Warm, empathetic, leading, clear pronunciation. Avoid overly dramatic tone.</p>
        </div>

        {/* User Tip */}
        <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/50 text-sm">
          <p className="font-bold mb-1">User Tip:</p>
          <p className="text-slate-300">This panel updates for the selected MBTI Type. Use these ratios for voice file generation!</p>
        </div>

        {/* 하단 내비게이션바 (이미지 하단 디자인 준수) */}
        <div className="mt-auto grid grid-cols-3 gap-2 pt-6 border-t border-slate-700">
          <div className="text-center text-xs flex flex-col items-center gap-1"><span className="text-xl">📄</span> Script Generation</div>
          <div className="text-center text-xs flex flex-col items-center gap-1"><span className="text-xl">⚙️</span> Admin Panel</div>
          <div className="text-center text-xs flex flex-col items-center gap-1"><span className="text-xl">➜</span> Logout</div>
        </div>
      </aside>
    </div>
  );
}
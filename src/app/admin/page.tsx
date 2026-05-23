"use client";

import { useState } from "react";
import { MbtiContent } from "../../lib/gemini";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminDashboard() {
  const [keyword, setKeyword] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<MbtiContent[]>([]);

  // 1. Gemini API 호출 로직 (대본 생성)
  const handleGenerate = async () => {
    if (!keyword) return alert("키워드를 입력해주세요.");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });
      const json = await res.json();
      
      if (json.success) {
        setResults(json.data.contents);
      } else {
        alert("오류: " + json.error);
      }
    } catch (error) {
      alert("서버 통신 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  // 2. 대본 복사 로직 (일레븐랩스용)
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("대본이 복사되었습니다. 일레븐랩스에 붙여넣으세요!");
  };

  // 3. Firebase DB 저장 로직 (라이브 발행)
  const handlePublish = async () => {
    if (!title) return alert("메인 화면에 노출될 제목을 입력해주세요!");
    if (results.length === 0) return alert("생성된 콘텐츠가 없습니다.");
    
    setIsSaving(true);
    try {
      await addDoc(collection(db, "posts"), {
        title,
        keyword,
        contents: results,
        createdAt: serverTimestamp(),
      });
      alert("🔥 성공적으로 라이브 서버에 발행되었습니다!");
      setTitle(""); // 다음 작업을 위해 제목란 비우기
    } catch (error) {
      console.error(error);
      alert("DB 저장 중 오류가 발생했습니다.");
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* 💡 기존 흰색 톤에서 다크 테마(어드민 레이아웃과 동일)에 맞춰 색상 변경 */}
      <div className="flex flex-col gap-4 mb-8 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm">
        
        {/* 키워드 및 대본 생성 영역 */}
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="주제 키워드 (예: 카톡 안 읽씹할 때)" 
            className="flex-1 p-4 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-500"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button 
            onClick={handleGenerate} 
            disabled={loading}
            className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "생성 중..." : "대본 생성"}
          </button>
        </div>

        {/* 결과가 있을 때만 나타나는 발행 영역 */}
        {results.length > 0 && (
          <div className="flex gap-4 mt-4 pt-6 border-t border-slate-700">
            <input 
              type="text" 
              placeholder="메인 화면에 보여줄 제목 (예: MBTI별 카톡 안 읽씹할 때)" 
              className="flex-1 p-4 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button 
              onClick={handlePublish} 
              disabled={isSaving}
              className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 shadow-md transition-colors whitespace-nowrap"
            >
              {isSaving ? "저장 중..." : "🚀 라이브 발행하기"}
            </button>
          </div>
        )}
      </div>

      {/* 16개 MBTI 결과 렌더링 카드 */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map((item) => (
            <div key={item.mbti} className="border border-slate-700 rounded-2xl p-6 shadow-sm bg-slate-800 flex flex-col h-full">
              <h3 className="text-xl font-black text-indigo-400 mb-4">{item.mbti}</h3>
              
              {/* 대본 출력 텍스트 박스: bg-slate-900 적용하여 글씨가 잘 보이도록 처리 */}
              <div className="flex-1 text-sm text-slate-200 whitespace-pre-wrap mb-4 bg-slate-900 p-4 rounded-xl border border-slate-700 h-48 overflow-y-auto leading-relaxed font-medium">
                {item.script}
              </div>
              
              <div className="flex flex-col gap-3 mt-auto">
                <button 
                  onClick={() => copyToClipboard(item.script)}
                  className="w-full bg-slate-700 text-white py-3 rounded-xl text-sm font-bold hover:bg-slate-600 transition-colors flex justify-center items-center gap-2"
                >
                  <span>📝</span> 대본 복사 (ElevenLabs)
                </button>
                
                <div className="text-xs text-slate-400 mt-2 p-3 bg-slate-900 rounded-xl border border-slate-700">
                  <strong className="block mb-1 text-indigo-300">Imagen 3 프롬프트:</strong>
                  <p className="line-clamp-3 leading-relaxed">{item.imagePrompt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
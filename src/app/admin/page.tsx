"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // 💡 추가
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminDashboard() {
  const router = useRouter(); // 💡 라우터 추가
  const [keyword, setKeyword] = useState("");
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState<"short" | "long">("short");
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleGenerate = async () => {
    if (!keyword) return alert("키워드를 입력해주세요.");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, type: contentType }), 
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("내용이 복사되었습니다.");
  };

  const handlePublish = async () => {
    if (!title) return alert("메인 화면에 노출될 제목을 입력해주세요!");
    if (results.length === 0) return alert("생성된 콘텐츠가 없습니다.");
    
    setIsSaving(true);
    try {
      await addDoc(collection(db, "posts"), {
        title,
        keyword,
        type: contentType,
        contents: results,
        createdAt: serverTimestamp(),
      });
      alert("🔥 성공적으로 라이브 서버에 발행되었습니다!");
      setTitle(""); 
    } catch (error) {
      console.error(error);
      alert("DB 저장 중 오류가 발생했습니다.");
    }
    setIsSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* 💡 홈으로 돌아가기 버튼 영역 추가 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-slate-100">콘텐츠 생성 스튜디오</h2>
        <button 
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg transition"
        >
          <span>🏠</span> 홈으로 돌아가기
        </button>
      </div>

      <div className="flex flex-col gap-4 mb-8 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm">
        
        {/* 콘텐츠 타입 선택 토글 */}
        <div className="flex gap-2 p-1 bg-slate-900 rounded-xl w-max border border-slate-700">
          <button 
            onClick={() => setContentType("short")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${contentType === "short" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
          >
            ⚡ 쇼츠 대본용
          </button>
          <button 
            onClick={() => setContentType("long")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${contentType === "long" ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
          >
            📚 아티클용
          </button>
        </div>

        <div className="flex gap-4 mt-2">
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
            className={`px-8 py-4 rounded-xl font-bold text-white transition-colors disabled:opacity-50 ${contentType === "short" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
          >
            {loading ? "생성 중..." : "콘텐츠 생성"}
          </button>
        </div>

        {results.length > 0 && (
          <div className="flex gap-4 mt-4 pt-6 border-t border-slate-700">
            <input 
              type="text" 
              placeholder="메인 화면에 보여줄 제목을 입력하세요." 
              className="flex-1 p-4 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button 
              onClick={handlePublish} 
              disabled={isSaving}
              className="bg-white text-slate-900 px-8 py-4 rounded-xl font-black hover:bg-slate-200 disabled:opacity-50 transition-colors"
            >
              {isSaving ? "저장 중..." : "🚀 라이브 발행하기"}
            </button>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map((item) => (
            <div key={item.mbti} className="border border-slate-700 rounded-2xl p-6 shadow-sm bg-slate-800 flex flex-col h-full">
              <h3 className={`text-xl font-black mb-4 ${contentType === "short" ? "text-indigo-400" : "text-emerald-400"}`}>{item.mbti}</h3>
              
              <div className="flex-1 text-sm text-slate-200 whitespace-pre-wrap mb-4 bg-slate-900 p-4 rounded-xl border border-slate-700 h-64 overflow-y-auto leading-relaxed font-medium">
                {item.script}
              </div>
              
              <div className="flex flex-col gap-3 mt-auto">
                <button 
                  onClick={() => copyToClipboard(item.script)}
                  className="w-full bg-slate-700 text-white py-3 rounded-xl text-sm font-bold hover:bg-slate-600"
                >
                  📝 내용 복사
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
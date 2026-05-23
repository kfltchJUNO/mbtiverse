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
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">MBTI 콘텐츠 생성 스튜디오 🔐</h1>
      
      <div className="flex flex-col gap-4 mb-8 bg-gray-50 p-6 rounded-lg border shadow-sm">
        {/* 키워드 및 대본 생성 영역 */}
        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="주제 키워드 (예: 카톡 안 읽씹할 때)" 
            className="flex-1 p-3 border rounded-md"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button 
            onClick={handleGenerate} 
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "생성 중..." : "대본 생성"}
          </button>
        </div>

        {/* 결과가 있을 때만 나타나는 발행 영역 */}
        {results.length > 0 && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200">
            <input 
              type="text" 
              placeholder="메인 화면에 보여줄 제목 (예: MBTI별 카톡 안 읽씹할 때)" 
              className="flex-1 p-3 border-2 border-green-300 rounded-md outline-none focus:border-green-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button 
              onClick={handlePublish} 
              disabled={isSaving}
              className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 shadow-md transition-colors whitespace-nowrap"
            >
              {isSaving ? "저장 중..." : "🚀 라이브 발행하기"}
            </button>
          </div>
        )}
      </div>

      {/* 16개 MBTI 결과 렌더링 카드 */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((item) => (
            <div key={item.mbti} className="border rounded-lg p-5 shadow-sm bg-white">
              <h3 className="text-xl font-bold text-blue-600 mb-3">{item.mbti}</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap mb-4 bg-gray-50 p-3 rounded h-32 overflow-y-auto">
                {item.script}
              </p>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => copyToClipboard(item.script)}
                  className="w-full bg-gray-900 text-white py-2 rounded text-sm hover:bg-gray-800 transition-colors"
                >
                  📝 대본 복사 (일레븐랩스용)
                </button>
                <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                  <strong className="block mb-1 text-gray-700">Imagen 3 프롬프트:</strong>
                  <p className="line-clamp-3">{item.imagePrompt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
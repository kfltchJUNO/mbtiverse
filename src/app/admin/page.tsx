"use client";

import { useState } from "react";
import { MbtiContent } from "@/lib/gemini";

export default function AdminDashboard() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MbtiContent[]>([]);

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
      if (json.success) setResults(json.data.contents);
      else alert("오류: " + json.error);
    } catch (error) {
      alert("서버 통신 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("대본이 복사되었습니다. 일레븐랩스에 붙여넣으세요!");
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">MBTI 콘텐츠 생성 스튜디오 🔐</h1>
      
      <div className="flex gap-4 mb-8 bg-gray-50 p-6 rounded-lg shadow-sm border">
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
          className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "생성 중..." : "대본 생성"}
        </button>
      </div>

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
                  className="w-full bg-gray-900 text-white py-2 rounded text-sm hover:bg-gray-800"
                >
                  📝 대본 복사 (일레븐랩스용)
                </button>
                <div className="text-xs text-gray-500 mt-2">
                  <strong>Imagen 3 프롬프트:</strong>
                  <p className="line-clamp-2 mt-1">{item.imagePrompt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminDashboard() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState<"short" | "long">("short");
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  
  // 💡 기존 발행된 포스트 목록 관리용
  const [publishedPosts, setPublishedPosts] = useState<any[]>([]);

  // 💡 컴포넌트 마운트 시 발행된 포스트 목록 불러오기
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    setPublishedPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

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
      if (json.success) setResults(json.data.contents);
      else alert("오류: " + json.error);
    } catch (error) {
      alert("서버 통신 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  const handlePublish = async () => {
    if (!title) return alert("메인 화면에 노출될 제목을 입력해주세요!");
    if (results.length === 0) return alert("생성된 콘텐츠가 없습니다.");
    
    setIsSaving(true);
    try {
      await addDoc(collection(db, "posts"), {
        title, keyword, type: contentType, contents: results, createdAt: serverTimestamp(),
      });
      alert("🔥 성공적으로 발행되었습니다!");
      setTitle("");
      setResults([]);
      fetchPosts(); // 목록 새로고침
    } catch (error) {
      alert("DB 저장 중 오류가 발생했습니다.");
    }
    setIsSaving(false);
  };

  // 💡 삭제 기능 추가
  const handleDelete = async (id: string) => {
    if (!confirm("정말 이 게시물을 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "posts", id));
      alert("삭제되었습니다.");
      fetchPosts(); // 목록 새로고침
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-slate-100">콘텐츠 생성 스튜디오</h2>
        <button onClick={() => router.push("/")} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg transition">
          🏠 홈으로 돌아가기
        </button>
      </div>

      <div className="flex flex-col gap-4 mb-8 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm">
        <div className="flex gap-2 p-1 bg-slate-900 rounded-xl w-max border border-slate-700">
          <button onClick={() => setContentType("short")} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${contentType === "short" ? "bg-indigo-600 text-white" : "text-slate-400"}`}>⚡ 쇼츠 대본용</button>
          <button onClick={() => setContentType("long")} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${contentType === "long" ? "bg-emerald-600 text-white" : "text-slate-400"}`}>📚 아티클용</button>
        </div>

        <div className="flex gap-4 mt-2">
          <input type="text" placeholder="주제 키워드" className="flex-1 p-4 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <button onClick={handleGenerate} disabled={loading} className={`px-8 py-4 rounded-xl font-bold text-white ${contentType === "short" ? "bg-indigo-600" : "bg-emerald-600"}`}>
            {loading ? "생성 중..." : "콘텐츠 생성"}
          </button>
        </div>

        {results.length > 0 && (
          <div className="flex gap-4 mt-4 pt-6 border-t border-slate-700">
            <input type="text" placeholder="제목 입력" className="flex-1 p-4 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl" value={title} onChange={(e) => setTitle(e.target.value)} />
            <button onClick={handlePublish} disabled={isSaving} className="bg-white text-slate-900 px-8 py-4 rounded-xl font-black hover:bg-slate-200">
              {isSaving ? "저장 중..." : "🚀 라이브 발행하기"}
            </button>
          </div>
        )}
      </div>

      {/* 💡 기존 발행된 포스트 목록 섹션 */}
      <div className="mb-12">
        <h3 className="text-lg font-bold text-slate-300 mb-4">현재 발행된 게시물</h3>
        <div className="space-y-3">
          {publishedPosts.map((post) => (
            <div key={post.id} className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
              <span className="font-medium text-slate-200">{post.title}</span>
              <button onClick={() => handleDelete(post.id)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                삭제
              </button>
            </div>
          ))}
        </div>
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map((item, idx) => (
            <div key={idx} className="border border-slate-700 rounded-2xl p-6 bg-slate-800">
              <h3 className="text-xl font-black mb-4 text-indigo-400">{item.mbti}</h3>
              <div className="h-48 overflow-y-auto bg-slate-900 p-4 rounded-xl border border-slate-700 text-slate-200 text-sm mb-4">{item.script}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
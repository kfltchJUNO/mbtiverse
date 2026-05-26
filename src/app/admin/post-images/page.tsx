"use client";

import { useState, useEffect } from "react";
import {
  collection, getDocs, doc, updateDoc,
  query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

export default function PostImagesPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    async function load() {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    load();
  }, []);

  const handleEdit = (post: any) => {
    setEditingId(post.id);
    setInputUrl(post.thumbnailUrl || "");
    setPreviewError(false);
  };

  const handleSave = async (postId: string) => {
    if (!inputUrl.trim()) return alert("이미지 URL을 입력해주세요.");
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "posts", postId), {
        thumbnailUrl: inputUrl.trim(),
        updatedAt: serverTimestamp(),
      });
      setPosts(prev =>
        prev.map(p => p.id === postId ? { ...p, thumbnailUrl: inputUrl.trim() } : p)
      );
      setEditingId(null);
      alert("✅ 썸네일이 저장되었습니다.");
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    }
    setIsSaving(false);
  };

  const handleRemove = async (postId: string) => {
    if (!confirm("썸네일을 삭제하시겠습니까?")) return;
    try {
      await updateDoc(doc(db, "posts", postId), { thumbnailUrl: "" });
      setPosts(prev =>
        prev.map(p => p.id === postId ? { ...p, thumbnailUrl: "" } : p)
      );
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const registeredCount = posts.filter(p => p.thumbnailUrl).length;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-100">리포트 썸네일 관리</h2>
          <p className="text-xs text-slate-400 mt-1">
            등록됨: <span className="text-emerald-400 font-bold">{registeredCount}</span> / {posts.length}
          </p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2">
          💡 각 리포트 카드·상세 페이지 상단에 표시됩니다
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-slate-500 bg-slate-800 rounded-2xl border border-slate-700">
          발행된 게시물이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const isEditing = editingId === post.id;
            const hasImage = !!post.thumbnailUrl;

            return (
              <div
                key={post.id}
                className={`bg-slate-800 rounded-2xl border p-4 transition ${
                  isEditing ? "border-indigo-500" : "border-slate-700"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* 썸네일 미리보기 */}
                  <div className="w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-slate-700 bg-slate-900 flex items-center justify-center">
                    {hasImage ? (
                      <img
                        src={post.thumbnailUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl opacity-30">🖼️</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-100 text-sm truncate flex-1">
                        {post.title}
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                        hasImage
                          ? "bg-emerald-900 text-emerald-400"
                          : "bg-slate-700 text-slate-500"
                      }`}>
                        {hasImage ? "✓ 등록됨" : "미등록"}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mb-2">
                      {post.keyword && `#${post.keyword} · `}
                      {post.createdAt?.toDate?.().toLocaleDateString("ko-KR") || ""}
                    </p>

                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="url"
                          value={inputUrl}
                          onChange={(e) => {
                            setInputUrl(e.target.value);
                            setPreviewError(false);
                          }}
                          placeholder="이미지 URL 입력"
                          className="w-full p-2.5 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                        />
                        {inputUrl && !previewError && (
                          <img
                            src={inputUrl}
                            alt="미리보기"
                            className="h-20 rounded-lg object-cover border border-slate-700"
                            onError={() => setPreviewError(true)}
                          />
                        )}
                        {previewError && (
                          <p className="text-red-400 text-xs">⚠️ 유효하지 않은 이미지 URL입니다.</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(post.id)}
                            disabled={isSaving || previewError || !inputUrl.trim()}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-40"
                          >
                            {isSaving ? "저장 중..." : "저장"}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-1.5 bg-slate-700 text-white rounded-lg text-xs font-bold transition"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(post)}
                          className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-indigo-300 rounded-lg text-xs font-bold transition border border-indigo-700"
                        >
                          {hasImage ? "✏️ 수정" : "➕ 썸네일 등록"}
                        </button>
                        {hasImage && (
                          <button
                            onClick={() => handleRemove(post.id)}
                            className="px-3 py-1.5 bg-red-900 hover:bg-red-800 text-red-400 rounded-lg text-xs font-bold transition border border-red-800"
                          >
                            🗑️ 삭제
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
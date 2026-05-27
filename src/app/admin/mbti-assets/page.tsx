// src/app/admin/mbti-assets/page.tsx
"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../../../lib/firebase";
import { useStorageUpload } from "../../../hooks/useStorageUpload";
import ImageUploader from "../../../components/ui/ImageUploader";

const MBTI_LIST = [
  "ENFJ","ENFP","ENTJ","ENTP",
  "ESFJ","ESFP","ESTJ","ESTP",
  "INFJ","INFP","INTJ","INTP",
  "ISFJ","ISFP","ISTJ","ISTP",
];

const DEFAULT_EMOJI: Record<string, string> = {
  ENFJ: "🌟", ENFP: "✨", ENTJ: "🔥", ENTP: "💡",
  ESFJ: "🌸", ESFP: "💃", ESTJ: "🏆", ESTP: "⚡",
  INFJ: "🔮", INFP: "🌙", INTJ: "🧠", INTP: "🔭",
  ISFJ: "🍀", ISFP: "🎨", ISTJ: "📋", ISTP: "🔧",
};

export default function MbtiAssetsPage() {
  const [assets, setAssets] = useState<Record<string, { emoji?: string; imageUrl?: string }>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputEmoji, setInputEmoji] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { uploadFile, uploadState, reset: resetUpload } = useStorageUpload();

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "mbti_assets"));
      const map: Record<string, any> = {};
      snap.docs.forEach(d => { map[d.id] = d.data(); });
      setAssets(map);
    }
    load();
  }, []);

  const handleEdit = (mbti: string) => {
    setEditingId(mbti);
    setInputEmoji(assets[mbti]?.emoji || DEFAULT_EMOJI[mbti] || "");
    setPendingFile(null);
    resetUpload();
  };

  const handleSave = async (mbti: string) => {
    setIsSaving(true);
    try {
      let imageUrl = assets[mbti]?.imageUrl || "";

      // 새 파일 있으면 업로드
      if (pendingFile) {
        // 기존 이미지 삭제
        if (imageUrl) {
          try { await deleteObject(ref(storage, imageUrl)); } catch {}
        }
        const ext = pendingFile.name.split(".").pop();
        const path = `mbti-assets/${mbti}_${Date.now()}.${ext}`;
        imageUrl = await uploadFile(pendingFile, path);
      }

      await setDoc(doc(db, "mbti_assets", mbti), {
        emoji: inputEmoji.trim() || DEFAULT_EMOJI[mbti],
        imageUrl,
        updatedAt: serverTimestamp(),
      });

      setAssets(prev => ({ ...prev, [mbti]: { emoji: inputEmoji.trim(), imageUrl } }));
      setEditingId(null);
      setPendingFile(null);
      alert(`✅ ${mbti} 에셋이 저장되었습니다.`);
    } catch (err: any) {
      alert("저장 실패: " + err.message);
    }
    setIsSaving(false);
  };

  const handleRemoveImage = async (mbti: string) => {
    if (!confirm("이미지를 삭제하시겠습니까? (이모지는 유지됩니다)")) return;
    try {
      const url = assets[mbti]?.imageUrl;
      if (url) { try { await deleteObject(ref(storage, url)); } catch {} }
      await setDoc(doc(db, "mbti_assets", mbti), {
        emoji: assets[mbti]?.emoji || DEFAULT_EMOJI[mbti],
        imageUrl: "",
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setAssets(prev => ({ ...prev, [mbti]: { ...prev[mbti], imageUrl: "" } }));
    } catch { alert("삭제 실패"); }
  };

  const registeredCount = Object.values(assets).filter(a => a.imageUrl).length;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-100">MBTI 에셋 관리</h2>
          <p className="text-xs text-slate-400 mt-1">
            포스트 상세 페이지의 MBTI별 이모지/이미지를 설정합니다
          </p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2">
          이미지 등록: <span className="text-emerald-400 font-bold">{registeredCount}</span> / 16
        </div>
      </div>

      {/* 안내 */}
      <div className="bg-indigo-900/30 border border-indigo-700/50 rounded-2xl p-4 mb-6 text-xs text-indigo-300 space-y-1">
        <p className="font-bold">📌 우선순위: 커스텀 이미지 → 커스텀 이모지 → 기본 이모지</p>
        <p>이미지를 등록하면 이미지가 표시되고, 없으면 이모지가 표시됩니다.</p>
        <p>이모지만 바꾸고 싶으면 이미지 없이 이모지만 수정하면 됩니다.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {MBTI_LIST.map(mbti => {
          const asset = assets[mbti];
          const isEditing = editingId === mbti;
          const hasImage = !!asset?.imageUrl;
          const currentEmoji = asset?.emoji || DEFAULT_EMOJI[mbti];

          return (
            <div
              key={mbti}
              className={`bg-slate-800 rounded-2xl border p-4 transition ${
                isEditing ? "border-indigo-500" : "border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {/* 현재 표시 아이콘 */}
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center flex-shrink-0">
                  {hasImage ? (
                    <img src={asset.imageUrl} alt={mbti} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{currentEmoji}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-100">{mbti}</span>
                    {hasImage && (
                      <span className="text-[10px] bg-emerald-900 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                        이미지
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs">현재: {currentEmoji}</p>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => handleEdit(mbti)}
                    className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-indigo-300 rounded-lg text-xs font-bold transition border border-indigo-700"
                  >
                    ✏️ 수정
                  </button>
                )}
              </div>

              {isEditing && (
                <div className="space-y-3 pt-3 border-t border-slate-700">
                  {/* 이모지 입력 */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1.5 block">
                      이모지 (이미지 없을 때 표시)
                    </label>
                    <input
                      type="text"
                      value={inputEmoji}
                      onChange={e => setInputEmoji(e.target.value)}
                      placeholder={DEFAULT_EMOJI[mbti]}
                      className="w-full p-2.5 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                      maxLength={4}
                    />
                  </div>

                  {/* 이미지 업로드 */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1.5 block">
                      커스텀 이미지 (선택)
                    </label>
                    <div className="max-w-[120px]">
                      <ImageUploader
                        currentImageUrl={asset?.imageUrl}
                        uploadState={uploadState}
                        onFileSelect={file => setPendingFile(file)}
                        onRemove={() => setPendingFile(null)}
                        label="이미지"
                        aspectClass="aspect-square"
                      />
                    </div>
                    {hasImage && !pendingFile && (
                      <button
                        onClick={() => handleRemoveImage(mbti)}
                        className="mt-1 text-red-400 text-xs hover:underline"
                      >
                        기존 이미지 삭제
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(mbti)}
                      disabled={isSaving || uploadState.isUploading}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition disabled:opacity-40"
                    >
                      {isSaving
                        ? uploadState.isUploading
                          ? `${uploadState.progress}%`
                          : "저장 중..."
                        : "저장"}
                    </button>
                    <button
                      onClick={() => { setEditingId(null); resetUpload(); }}
                      className="px-4 py-2 bg-slate-700 text-white rounded-xl font-bold text-xs transition"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
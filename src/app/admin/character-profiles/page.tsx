"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../../../lib/firebase";
import { useStorageUpload } from "../../../hooks/useStorageUpload";
import ImageUploader from "../../../components/ui/ImageUploader";
import { ALL_CHARACTERS, type Character } from "../../../lib/characters";

export default function CharacterProfilesPage() {
  const [profiles, setProfiles] = useState<Record<string, { imageUrl: string }>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { uploadFile, uploadState, reset: resetUpload } = useStorageUpload();

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "character_profiles"));
      const map: Record<string, { imageUrl: string }> = {};
      snap.docs.forEach(d => { map[d.id] = d.data() as any; });
      setProfiles(map);
    }
    load();
  }, []);

  const handleEdit = (id: string) => {
    setEditingId(id);
    setPendingFile(null);
    resetUpload();
  };

  const handleSave = async (id: string) => {
    if (!pendingFile) return alert("이미지를 선택해주세요.");
    setIsSaving(true);
    try {
      // 기존 이미지 삭제 시도
      const oldUrl = profiles[id]?.imageUrl;
      if (oldUrl) {
        try { await deleteObject(ref(storage, oldUrl)); } catch {}
      }

      // Storage 경로: characters/{MBTI}_{timestamp}.{ext}
      const ext = pendingFile.name.split(".").pop();
      const path = `characters/${id}_${Date.now()}.${ext}`;
      const downloadUrl = await uploadFile(pendingFile, path);

      await setDoc(doc(db, "character_profiles", id), {
        imageUrl: downloadUrl,
        updatedAt: serverTimestamp(),
      });

      setProfiles(prev => ({ ...prev, [id]: { imageUrl: downloadUrl } }));
      setEditingId(null);
      setPendingFile(null);
      alert(`✅ ${id} 이미지가 저장되었습니다.`);
    } catch (err: any) {
      alert("저장 실패: " + err.message);
    }
    setIsSaving(false);
  };

  const handleRemove = async (id: string) => {
    if (!confirm(`${id} 이미지를 삭제하시겠습니까?`)) return;
    try {
      const oldUrl = profiles[id]?.imageUrl;
      if (oldUrl) {
        try { await deleteObject(ref(storage, oldUrl)); } catch {}
      }
      await setDoc(doc(db, "character_profiles", id), {
        imageUrl: "",
        updatedAt: serverTimestamp(),
      });
      setProfiles(prev => ({ ...prev, [id]: { imageUrl: "" } }));
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const maleChars = ALL_CHARACTERS.filter(c => c.gender === "male");
  const femaleChars = ALL_CHARACTERS.filter(c => c.gender === "female");
  const registeredCount = Object.values(profiles).filter(p => p.imageUrl).length;

  const CharacterRow = ({ character }: { character: Character }) => {
    const profile = profiles[character.id];
    const hasImage = !!profile?.imageUrl;
    const isEditing = editingId === character.id;

    return (
      <div className={`bg-slate-800 rounded-2xl border p-4 transition ${isEditing ? "border-indigo-500" : "border-slate-700"}`}>
        <div className="flex items-start gap-4">
          {/* 현재 이미지 썸네일 */}
          <div className="w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-slate-700 bg-slate-900 flex items-center justify-center">
            {hasImage ? (
              <img src={profile.imageUrl} alt={character.name} className="w-full h-full object-cover object-top" />
            ) : (
              <span className="text-2xl opacity-50">{character.emoji}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400">{character.id}</span>
              <span className="font-black text-slate-100">{character.name}</span>
              <span className="text-slate-500 text-xs">{character.romanName}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${hasImage ? "bg-emerald-900 text-emerald-400" : "bg-slate-700 text-slate-500"}`}>
                {hasImage ? "✓ 등록됨" : "미등록"}
              </span>
            </div>
            <p className="text-slate-400 text-xs mb-3">{character.job}</p>

            {isEditing ? (
              <div className="space-y-3">
                <div className="max-w-[160px]">
                  <ImageUploader
                    currentImageUrl={profile?.imageUrl}
                    uploadState={uploadState}
                    onFileSelect={(file) => setPendingFile(file)}
                    onRemove={() => setPendingFile(null)}
                    label="캐릭터 사진"
                    aspectClass="aspect-[3/4]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(character.id)}
                    disabled={isSaving || !pendingFile || uploadState.isUploading}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-40"
                  >
                    {isSaving ? "저장 중..." : "저장"}
                  </button>
                  <button
                    onClick={() => { setEditingId(null); resetUpload(); }}
                    className="px-4 py-1.5 bg-slate-700 text-white rounded-lg text-xs font-bold transition"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(character.id)}
                  className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-indigo-300 rounded-lg text-xs font-bold transition border border-indigo-700"
                >
                  {hasImage ? "✏️ 수정" : "➕ 이미지 등록"}
                </button>
                {hasImage && (
                  <button
                    onClick={() => handleRemove(character.id)}
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
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-100">캐릭터 이미지 관리</h2>
          <p className="text-xs text-slate-400 mt-1">
            등록됨: <span className="text-emerald-400 font-bold">{registeredCount}</span> / 16
          </p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2">
          💡 JPG·PNG·WEBP · 최대 5MB · 세로 비율 권장
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="mb-8 bg-slate-800 rounded-2xl p-4 border border-slate-700">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>이미지 등록 현황</span>
          <span>{registeredCount} / 16</span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-2">
          <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(registeredCount / 16) * 100}%` }} />
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-base font-bold text-slate-300 mb-4">👦 남성 캐릭터 (8인)</h3>
        <div className="space-y-3">{maleChars.map(c => <CharacterRow key={c.id} character={c} />)}</div>
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-300 mb-4">👩 여성 캐릭터 (8인)</h3>
        <div className="space-y-3">{femaleChars.map(c => <CharacterRow key={c.id} character={c} />)}</div>
      </div>
    </div>
  );
}
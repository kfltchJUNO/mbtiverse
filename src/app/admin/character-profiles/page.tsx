"use client";

import { useState, useEffect } from "react";
import { collection, doc, getDoc, setDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { ALL_CHARACTERS, type Character } from "../../../lib/characters";

export default function CharacterProfilesPage() {
  const [profiles, setProfiles] = useState<Record<string, { imageUrl: string; updatedAt?: any }>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  // 저장된 이미지 프로필 로드
  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, "character_profiles"));
      const map: Record<string, { imageUrl: string; updatedAt?: any }> = {};
      snap.docs.forEach(d => { map[d.id] = d.data() as any; });
      setProfiles(map);
    }
    load();
  }, []);

  const handleEdit = (id: string) => {
    setEditingId(id);
    setInputUrl(profiles[id]?.imageUrl || "");
    setPreviewError(false);
  };

  const handleSave = async (id: string) => {
    if (!inputUrl.trim()) return alert("이미지 URL을 입력해주세요.");
    setIsSaving(true);
    try {
      await setDoc(doc(db, "character_profiles", id), {
        imageUrl: inputUrl.trim(),
        updatedAt: serverTimestamp(),
      });
      setProfiles(prev => ({ ...prev, [id]: { imageUrl: inputUrl.trim() } }));
      setEditingId(null);
      alert(`✅ ${id} 이미지가 저장되었습니다.`);
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    }
    setIsSaving(false);
  };

  const handleRemove = async (id: string) => {
    if (!confirm(`${id} 이미지를 삭제하시겠습니까?`)) return;
    try {
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

  const CharacterRow = ({ character }: { character: Character }) => {
    const profile = profiles[character.id];
    const hasImage = !!profile?.imageUrl;
    const isEditing = editingId === character.id;

    return (
      <div className={`bg-slate-800 rounded-2xl border p-4 transition ${isEditing ? "border-indigo-500" : "border-slate-700"}`}>
        <div className="flex items-start gap-4">
          {/* 썸네일 */}
          <div className={`w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 border ${
            hasImage ? "border-slate-600" : "border-dashed border-slate-600"
          } bg-slate-900 flex items-center justify-center`}>
            {hasImage ? (
              <img src={profile.imageUrl} alt={character.name} className="w-full h-full object-cover object-top" />
            ) : (
              <span className="text-2xl opacity-50">{character.emoji}</span>
            )}
          </div>

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400">{character.id}</span>
              <span className="font-black text-slate-100">{character.name}</span>
              <span className="text-slate-500 text-xs">{character.romanName}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                hasImage ? "bg-emerald-900 text-emerald-400" : "bg-slate-700 text-slate-500"
              }`}>
                {hasImage ? "✓ 등록됨" : "미등록"}
              </span>
            </div>
            <p className="text-slate-400 text-xs mb-2">{character.job}</p>

            {/* 편집 모드 */}
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => { setInputUrl(e.target.value); setPreviewError(false); }}
                  placeholder="이미지 URL (Firebase Storage, Cloudinary, Imgur 등)"
                  className="w-full p-2.5 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                />
                {/* URL 미리보기 */}
                {inputUrl && !previewError && (
                  <img
                    src={inputUrl}
                    alt="미리보기"
                    className="h-24 rounded-lg object-cover border border-slate-700"
                    onError={() => setPreviewError(true)}
                  />
                )}
                {previewError && (
                  <p className="text-red-400 text-xs">⚠️ 유효하지 않은 이미지 URL입니다.</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSave(character.id)}
                    disabled={isSaving || previewError}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-40"
                  >
                    {isSaving ? "저장 중..." : "저장"}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition"
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

  const registeredCount = Object.values(profiles).filter(p => p.imageUrl).length;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-100">캐릭터 이미지 관리</h2>
          <p className="text-xs text-slate-400 mt-1">
            등록됨: <span className="text-emerald-400 font-bold">{registeredCount}</span> / 16
          </p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2">
          💡 Firebase Storage URL 또는 외부 이미지 URL 사용
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="mb-8 bg-slate-800 rounded-2xl p-4 border border-slate-700">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>이미지 등록 현황</span>
          <span>{registeredCount} / 16</span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-2">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(registeredCount / 16) * 100}%` }}
          />
        </div>
      </div>

      {/* 남성 캐릭터 */}
      <div className="mb-8">
        <h3 className="text-base font-bold text-slate-300 mb-4 flex items-center gap-2">
          <span>👦</span> 남성 캐릭터 (8인)
        </h3>
        <div className="space-y-3">
          {maleChars.map(c => <CharacterRow key={c.id} character={c} />)}
        </div>
      </div>

      {/* 여성 캐릭터 */}
      <div>
        <h3 className="text-base font-bold text-slate-300 mb-4 flex items-center gap-2">
          <span>👩</span> 여성 캐릭터 (8인)
        </h3>
        <div className="space-y-3">
          {femaleChars.map(c => <CharacterRow key={c.id} character={c} />)}
        </div>
      </div>
    </div>
  );
}
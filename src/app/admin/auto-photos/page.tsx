"use client";

import { useState, useEffect } from "react";
import {
  collection, doc, getDocs, setDoc, deleteDoc,
  query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../../../lib/firebase";
import { useStorageUpload } from "../../../hooks/useStorageUpload";
import ImageUploader from "../../../components/ui/ImageUploader";
import { ALL_CHARACTERS } from "../../../lib/characters";

// 자동 전송 트리거 조건
const TRIGGER_OPTIONS = [
  { value: 3,  label: "3회 대화 후" },
  { value: 5,  label: "5회 대화 후" },
  { value: 10, label: "10회 대화 후" },
  { value: 20, label: "20회 대화 후" },
];

interface AutoPhoto {
  id: string;
  characterId: string;
  imageUrl: string;
  caption: string;       // 캐릭터가 사진과 함께 보낼 메시지
  triggerCount: number;  // 몇 회 이후 전송할지
  isActive: boolean;
  createdAt?: any;
}

export default function AutoPhotosPage() {
  const [selectedChar, setSelectedChar] = useState("INFJ");
  const [photos, setPhotos] = useState<AutoPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 새 사진 폼 상태
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newCaption, setNewCaption] = useState("");
  const [newTrigger, setNewTrigger] = useState(3);

  const { uploadFile, uploadState, reset: resetUpload } = useStorageUpload();

  const character = ALL_CHARACTERS.find(c => c.id === selectedChar);

  useEffect(() => {
    loadPhotos(selectedChar);
  }, [selectedChar]);

  const loadPhotos = async (charId: string) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "auto_photos", charId, "items"),
        orderBy("triggerCount", "asc")
      );
      const snap = await getDocs(q);
      setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() } as AutoPhoto)));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!newFile) return alert("이미지를 선택해주세요.");
    if (!newCaption.trim()) return alert("캐릭터 메시지를 입력해주세요.");

    setIsSaving(true);
    try {
      const ext = newFile.name.split(".").pop();
      const photoId = `${selectedChar}_${newTrigger}_${Date.now()}`;
      const path = `auto-photos/${selectedChar}/${photoId}.${ext}`;
      const downloadUrl = await uploadFile(newFile, path);

      const photoRef = doc(db, "auto_photos", selectedChar, "items", photoId);
      await setDoc(photoRef, {
        characterId: selectedChar,
        imageUrl: downloadUrl,
        caption: newCaption.trim(),
        triggerCount: newTrigger,
        isActive: true,
        createdAt: serverTimestamp(),
      });

      // 목록 갱신
      await loadPhotos(selectedChar);
      setIsAdding(false);
      setNewFile(null);
      setNewCaption("");
      setNewTrigger(3);
      resetUpload();
      alert("✅ 자동 사진이 등록되었습니다.");
    } catch (err: any) {
      alert("저장 실패: " + err.message);
    }
    setIsSaving(false);
  };

  const handleToggleActive = async (photo: AutoPhoto) => {
    try {
      await setDoc(
        doc(db, "auto_photos", selectedChar, "items", photo.id),
        { ...photo, isActive: !photo.isActive },
        { merge: true }
      );
      setPhotos(prev => prev.map(p =>
        p.id === photo.id ? { ...p, isActive: !p.isActive } : p
      ));
    } catch {
      alert("상태 변경 실패");
    }
  };

  const handleDelete = async (photo: AutoPhoto) => {
    if (!confirm("이 자동 사진을 삭제하시겠습니까?")) return;
    try {
      if (photo.imageUrl) {
        try { await deleteObject(ref(storage, photo.imageUrl)); } catch {}
      }
      await deleteDoc(doc(db, "auto_photos", selectedChar, "items", photo.id));
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
    } catch {
      alert("삭제 실패");
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-100">자동 사진 전송 관리</h2>
          <p className="text-xs text-slate-400 mt-1">
            N회 이상 대화 시 캐릭터가 자동으로 사진을 보냅니다
          </p>
        </div>
      </div>

      {/* 캐릭터 선택 */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 mb-6">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">
          캐릭터 선택
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_CHARACTERS.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedChar(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedChar === c.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-700 text-slate-400 hover:bg-slate-600"
              }`}
            >
              {c.emoji} {c.name} <span className="opacity-60">{c.id}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 선택된 캐릭터 헤더 */}
      {character && (
        <div className={`rounded-2xl p-4 mb-6 bg-gradient-to-r ${character.gradient} border border-white/10`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{character.emoji}</span>
              <div>
                <p className="text-white font-black">{character.name} ({character.id})</p>
                <p className="text-white/60 text-xs">{character.job}</p>
              </div>
            </div>
            <button
              onClick={() => { setIsAdding(true); resetUpload(); }}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-bold transition border border-white/20"
            >
              ➕ 사진 추가
            </button>
          </div>
        </div>
      )}

      {/* 새 사진 추가 폼 */}
      {isAdding && (
        <div className="bg-slate-800 rounded-2xl border border-indigo-500 p-5 mb-6">
          <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
            <span>📸</span> 새 자동 사진 등록
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 이미지 업로드 */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-2 block">사진</label>
              <ImageUploader
                uploadState={uploadState}
                onFileSelect={(file) => setNewFile(file)}
                onRemove={() => setNewFile(null)}
                label="사진 업로드"
                aspectClass="aspect-[3/4]"
              />
            </div>

            {/* 설정 */}
            <div className="space-y-4">
              {/* 트리거 조건 */}
              <div>
                <label className="text-xs font-bold text-slate-400 mb-2 block">
                  전송 조건
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TRIGGER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setNewTrigger(opt.value)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition ${
                        newTrigger === opt.value
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-slate-500 text-[10px] mt-2">
                  * 해당 캐릭터와 {newTrigger}회 이상 대화한 유저에게 자동 전송됩니다
                </p>
              </div>

              {/* 캐릭터 메시지 */}
              <div>
                <label className="text-xs font-bold text-slate-400 mb-2 block">
                  캐릭터 메시지 <span className="text-slate-600">(사진과 함께 전송)</span>
                </label>
                <textarea
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder={`예: "오늘 이런 거 해봤어. 어때?" (${character?.name}의 말투로)`}
                  rows={4}
                  className="w-full p-3 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl text-sm resize-none focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* 저장 버튼 */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !newFile || !newCaption.trim() || uploadState.isUploading}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition disabled:opacity-40"
                >
                  {isSaving
                    ? uploadState.isUploading
                      ? `업로드 중... ${uploadState.progress}%`
                      : "저장 중..."
                    : "저장"}
                </button>
                <button
                  onClick={() => { setIsAdding(false); setNewFile(null); resetUpload(); }}
                  className="px-5 py-3 bg-slate-700 text-white rounded-xl font-bold text-sm transition"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 등록된 사진 목록 */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 rounded-2xl border border-slate-700 text-slate-500">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-sm">등록된 자동 사진이 없습니다.</p>
          <p className="text-xs mt-1">위 [사진 추가] 버튼으로 추가해주세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 px-1">
            등록된 자동 사진 ({photos.length}개)
          </h3>
          {photos.map(photo => (
            <div
              key={photo.id}
              className={`bg-slate-800 rounded-2xl border p-4 transition ${
                photo.isActive ? "border-slate-700" : "border-slate-700/50 opacity-60"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* 썸네일 */}
                <div className="w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-slate-700">
                  <img src={photo.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* 트리거 배지 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 bg-indigo-900 text-indigo-300 rounded-lg text-[10px] font-black">
                      💬 {photo.triggerCount}회 이상 대화 시
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      photo.isActive
                        ? "bg-emerald-900 text-emerald-400"
                        : "bg-slate-700 text-slate-500"
                    }`}>
                      {photo.isActive ? "✓ 활성" : "비활성"}
                    </span>
                  </div>

                  {/* 캐릭터 메시지 미리보기 */}
                  <p className="text-slate-300 text-sm bg-slate-900 rounded-xl px-3 py-2 leading-relaxed line-clamp-2">
                    "{photo.caption}"
                  </p>
                </div>

                {/* 액션 버튼 */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(photo)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      photo.isActive
                        ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                        : "bg-emerald-900 hover:bg-emerald-800 text-emerald-400"
                    }`}
                  >
                    {photo.isActive ? "⏸ 비활성" : "▶ 활성"}
                  </button>
                  <button
                    onClick={() => handleDelete(photo)}
                    className="px-3 py-1.5 bg-red-900 hover:bg-red-800 text-red-400 rounded-lg text-xs font-bold transition"
                  >
                    🗑️ 삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 안내 */}
      <div className="mt-8 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
        <p className="text-slate-400 text-xs font-bold mb-2">📌 동작 방식</p>
        <ul className="text-slate-500 text-xs space-y-1">
          <li>• 유저가 해당 캐릭터와 N회 이상 대화하면 채팅방에 자동으로 사진이 전송됩니다</li>
          <li>• 같은 조건의 사진이 여러 개면 가장 최근 등록된 것이 전송됩니다</li>
          <li>• 비활성 상태의 사진은 전송되지 않습니다</li>
          <li>• <code className="bg-slate-700 px-1 rounded">auto_photos/{"{characterId}"}/items</code> 컬렉션에 저장됩니다</li>
        </ul>
      </div>
    </div>
  );
}
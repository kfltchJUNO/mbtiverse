"use client";

import { useRef, useState } from "react";
import type { UploadState } from "../../hooks/useStorageUpload";

interface ImageUploaderProps {
  currentImageUrl?: string;
  uploadState: UploadState;
  onFileSelect: (file: File) => void;
  onRemove?: () => void;
  label?: string;
  aspectClass?: string; // 예: "aspect-[3/4]", "aspect-video"
}

export default function ImageUploader({
  currentImageUrl,
  uploadState,
  onFileSelect,
  onRemove,
  label = "이미지 업로드",
  aspectClass = "aspect-[3/4]",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    // 로컬 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => setLocalPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const previewUrl = localPreview || currentImageUrl;
  const { isUploading, progress, error } = uploadState;

  return (
    <div className="space-y-2">
      {/* 업로드 영역 */}
      <div
        className={`relative ${aspectClass} rounded-xl overflow-hidden border-2 transition-all cursor-pointer
          ${isDragging ? "border-indigo-400 bg-indigo-900/20" : "border-dashed border-slate-600 hover:border-slate-400"}
          ${previewUrl ? "border-solid border-slate-600" : ""}
        `}
        onClick={() => !isUploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="미리보기"
              className="w-full h-full object-cover object-top"
            />
            {/* 호버 오버레이 */}
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white text-xs font-bold">클릭하여 변경</p>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
            <span className="text-3xl">📁</span>
            <p className="text-xs font-medium text-center px-2">
              {isDragging ? "여기에 놓으세요" : "클릭 또는 드래그"}
            </p>
            <p className="text-[10px] text-slate-600">JPG, PNG, WEBP · 최대 5MB</p>
          </div>
        )}

        {/* 업로드 진행 오버레이 */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
            <div className="w-3/4 bg-slate-700 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-white text-xs font-bold">{progress}%</p>
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-red-400 text-xs">⚠️ {error}</p>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex-1 py-2 bg-indigo-900 hover:bg-indigo-800 text-indigo-300 rounded-lg text-xs font-bold transition border border-indigo-700 disabled:opacity-40"
        >
          {isUploading ? `업로드 중... ${progress}%` : previewUrl ? "✏️ 변경" : `➕ ${label}`}
        </button>
        {previewUrl && onRemove && !isUploading && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLocalPreview(null); onRemove(); }}
            className="px-3 py-2 bg-red-900 hover:bg-red-800 text-red-400 rounded-lg text-xs font-bold transition border border-red-800"
          >
            🗑️
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = ""; // 같은 파일 재선택 허용
        }}
      />
    </div>
  );
}
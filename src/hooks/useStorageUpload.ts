"use client";

import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../lib/firebase";

export interface UploadState {
  progress: number;      // 0~100
  isUploading: boolean;
  error: string | null;
}

export function useStorageUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0,
    isUploading: false,
    error: null,
  });

  // 파일 업로드 → 다운로드 URL 반환
  const uploadFile = (
    file: File,
    storagePath: string // 예: "characters/INFJ_1234567890.jpg"
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      // 파일 크기 제한: 5MB
      if (file.size > 5 * 1024 * 1024) {
        const err = "파일 크기는 5MB 이하여야 합니다.";
        setUploadState({ progress: 0, isUploading: false, error: err });
        reject(new Error(err));
        return;
      }

      // 이미지 파일만 허용
      if (!file.type.startsWith("image/")) {
        const err = "이미지 파일만 업로드 가능합니다.";
        setUploadState({ progress: 0, isUploading: false, error: err });
        reject(new Error(err));
        return;
      }

      setUploadState({ progress: 0, isUploading: true, error: null });

      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadState({ progress, isUploading: true, error: null });
        },
        (error) => {
          setUploadState({ progress: 0, isUploading: false, error: error.message });
          reject(error);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadState({ progress: 100, isUploading: false, error: null });
          resolve(downloadUrl);
        }
      );
    });
  };

  // 기존 파일 삭제 (URL로)
  const deleteFile = async (url: string) => {
    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
    } catch {
      // 파일이 없거나 이미 삭제된 경우 무시
    }
  };

  const reset = () => setUploadState({ progress: 0, isUploading: false, error: null });

  return { uploadFile, deleteFile, uploadState, reset };
}
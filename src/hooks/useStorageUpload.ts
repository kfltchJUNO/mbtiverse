// src/hooks/useStorageUpload.ts
import { useState, useCallback } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";

interface UploadState {
  progress: number;
  isUploading: boolean;
  error: string | null;
  url: string | null;
}

export function useStorageUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0,
    isUploading: false,
    error: null,
    url: null,
  });

  const reset = useCallback(() => {
    setUploadState({ progress: 0, isUploading: false, error: null, url: null });
  }, []);

  const uploadFile = useCallback((file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      setUploadState({ progress: 0, isUploading: true, error: null, url: null });

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadState(prev => ({ ...prev, progress }));
        },
        (error) => {
          setUploadState(prev => ({ ...prev, isUploading: false, error: error.message }));
          reject(error);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadState({ progress: 100, isUploading: false, error: null, url });
          resolve(url);
        }
      );
    });
  }, []);

  return { uploadFile, uploadState, reset };
}
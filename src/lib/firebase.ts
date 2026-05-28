import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { db, auth, storage, googleProvider };

// ── 라이선스 키 검증 (Gumroad API)
export async function validateLicenseKey(
  licenseKey: string,
  productPermalink: string
): Promise<{ valid: boolean; uses?: number; error?: string }> {
  try {
    const res = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        product_permalink: productPermalink,
        license_key: licenseKey,
        increment_uses_count: "false", // 검증만, 사용 횟수는 saveLicense에서
      }),
    });
    const data = await res.json();
    if (!data.success) return { valid: false, error: data.message };
    return { valid: true, uses: data.uses };
  } catch (e: any) {
    return { valid: false, error: e.message };
  }
}

// ── 라이선스 저장 + 스텔라 충전
export async function saveLicense(uid: string, licenseKey: string, stella: number) {
  const {
    doc, setDoc, updateDoc, increment, serverTimestamp,
  } = await import("firebase/firestore");
  await Promise.all([
    setDoc(doc(db, "licenses", licenseKey), {
      uid,
      stella,
      usedAt: serverTimestamp(),
    }),
    updateDoc(doc(db, "users", uid), {
      stella: increment(stella),
    }),
  ]);
}
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// ========== 타입 정의 ==========
interface Conversation {
  id: string;
  userId: string;
  characterId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  generatedImageUrl?: string;
  createdAt: Date;
  isVideoContent: boolean;
  videoId: string | null;
  likes: number;
  views: number;
}

// ========== Firebase 초기화 ==========
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ========== Export (필수!) ==========
export { app, db, storage, auth, googleProvider };

// ========== Imports ==========
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';

// ========== License 관리 ==========

// License 저장
export async function saveLicense(
  userId: string,
  licenseKey: string,
  packageName: string,
  stella: number
) {
  try {
    const docRef = await addDoc(collection(db, 'licenses'), {
      userId,
      licenseKey,
      packageName,
      stella,
      status: 'activated',
      used: false,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
    return { success: true, docId: docRef.id };
  } catch (error) {
    console.error('Error saving license:', error);
    return { success: false, error };
  }
}

// License 검증
export async function validateLicenseKey(licenseKey: string) {
  try {
    const q = query(
      collection(db, 'licenses'),
      where('licenseKey', '==', licenseKey),
      where('status', '==', 'activated'),
      where('used', '==', false)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { valid: false, message: '유효하지 않은 라이선스입니다' };
    }

    const licenseDoc = querySnapshot.docs[0];
    const license = licenseDoc.data();

    return {
      valid: true,
      docId: licenseDoc.id,
      stella: license.stella,
      packageName: license.packageName,
      userId: license.userId,
    };
  } catch (error) {
    console.error('Error validating license:', error);
    return { valid: false, error };
  }
}

// License 사용 처리
export async function useLicense(licenseDocId: string, userId: string) {
  try {
    const licenseRef = doc(db, 'licenses', licenseDocId);
    await updateDoc(licenseRef, {
      used: true,
      usedAt: new Date(),
      usedByUser: userId,
    });
    return { success: true };
  } catch (error) {
    console.error('Error using license:', error);
    return { success: false, error };
  }
}

// 사용자에게 스텔라 추가
export async function addStellaToUser(userId: string, stella: number) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // 새 사용자 생성
      await setDoc(userRef, {
        stella: stella,
        createdAt: new Date(),
      });
    } else {
      // 기존 사용자의 스텔라 추가
      const currentStella = userDoc.data().stella || 0;
      await updateDoc(userRef, {
        stella: currentStella + stella,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding stella:', error);
    return { success: false, error };
  }
}

// 사용자 스텔라 조회
export async function getUserStella(userId: string): Promise<number> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return 0;
    }

    return userDoc.data().stella || 0;
  } catch (error) {
    console.error('Error getting user stella:', error);
    return 0;
  }
}

// ========== 대화 저장 (유튜브 자동화용) ==========

export async function saveConversation(
  userId: string,
  characterId: string,
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>,
  generatedImageUrl?: string
) {
  try {
    await addDoc(collection(db, 'conversations'), {
      userId,
      characterId,
      messages,
      generatedImageUrl,
      createdAt: new Date(),
      isVideoContent: false,
      videoId: null,
      likes: 0,
      views: 0,
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving conversation:', error);
    return { success: false, error };
  }
}

// 인기 대화 조회
export async function getPopularConversations(
  limit: number = 10,
  sortBy: 'recent' | 'views' | 'likes' = 'recent'
): Promise<Conversation[]> {
  try {
    const q = query(
      collection(db, 'conversations'),
      where('isVideoContent', '==', false)
    );

    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(
      doc => ({
        id: doc.id,
        ...doc.data(),
      })
    ) as Conversation[];

    // 클라이언트 사이드 정렬
    if (sortBy === 'views') {
      docs.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortBy === 'likes') {
      docs.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    return docs.slice(0, limit);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}

// 대화를 유튜브 영상으로 표시
export async function markAsVideoContent(
  conversationId: string,
  videoId: string
) {
  try {
    const docRef = doc(db, 'conversations', conversationId);
    await updateDoc(docRef, {
      isVideoContent: true,
      videoId: videoId,
      uploadedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error marking as video content:', error);
    return { success: false, error };
  }
}
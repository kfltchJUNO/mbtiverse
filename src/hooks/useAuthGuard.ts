"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "../lib/firebase";

// 🔒 관리자 이메일 — 환경변수로 관리 권장
// .env.local에 NEXT_PUBLIC_ADMIN_EMAIL=your@email.com 추가
export const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "ot.helper7@gmail.com";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  stella: number;       // 재화 잔액
  role: "user" | "admin";
  createdAt: any;
}

export function useAuthGuard() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    // 인앱 브라우저 우회 (기존 로직 유지)
    const checkInAppBrowser = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const targetUrl = window.location.href;
      if (userAgent.match(/kakaotalk/i)) {
        setIsInAppBrowser(true);
        window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(targetUrl)}`;
      } else if (
        userAgent.match(/naver/i) ||
        userAgent.match(/instagram/i) ||
        userAgent.match(/facebook/i)
      ) {
        setIsInAppBrowser(true);
        if (userAgent.match(/android/i)) {
          window.location.href = `intent://${targetUrl.replace(/https?:\/\//i, "")}#Intent;scheme=https;package=com.android.chrome;end`;
        }
      }
    };
    checkInAppBrowser();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // ✅ 로그인 시 Firestore users 문서 확인 및 자동 생성
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // 신규 유저: 문서 생성 + 가입 보너스 30스텔라 지급
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || "",
            displayName: currentUser.displayName || "익명",
            stella: 30, // 가입 보너스
            role: currentUser.email === ADMIN_EMAIL ? "admin" : "user",
            createdAt: serverTimestamp(),
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        } else {
          // 기존 유저: 프로필 로드
          setProfile(userSnap.data() as UserProfile);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Login Error:", error);
      alert("로그인 중 오류가 발생했습니다.");
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return {
    user,
    profile,
    loading,
    isAdmin: user?.email === ADMIN_EMAIL,
    loginWithGoogle,
    logout,
    isInAppBrowser,
  };
}
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "../lib/firebase";

export const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "ot.helper7@gmail.com";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  stella: number;
  role: "user" | "admin";
  createdAt: any;
}

export function useAuthGuard() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // authLoading: Firebase Auth 상태 확인 완료 여부
  const [authLoading, setAuthLoading] = useState(true);
  // profileLoading: Firestore 프로필 로드 완료 여부 (어드민 체크엔 불필요)
  const [profileLoading, setProfileLoading] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
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
      // ✅ Auth 상태 확정 즉시 user 세팅 + authLoading 해제
      // admin 체크는 email 비교라 Firestore 안 기다려도 됨
      setUser(currentUser);
      setAuthLoading(false);

      // Firestore 프로필은 백그라운드에서 별도 처리
      if (currentUser) {
        setProfileLoading(true);
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || "",
              displayName: currentUser.displayName || "익명",
              stella: 30,
              role: currentUser.email === ADMIN_EMAIL ? "admin" : "user",
              createdAt: serverTimestamp(),
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          } else {
            setProfile(userSnap.data() as UserProfile);
          }
        } catch (err) {
          console.error("프로필 로드 실패:", err);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
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
    // loading: Auth 확정 여부만 (어드민 체크에 사용)
    loading: authLoading,
    // profileLoading: 스텔라 잔액 등 프로필 필요한 곳에서 사용
    profileLoading,
    isAdmin: user?.email === ADMIN_EMAIL,
    loginWithGoogle,
    logout,
    isInAppBrowser,
  };
}
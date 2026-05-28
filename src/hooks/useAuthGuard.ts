"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { auth, googleProvider, db } from "../lib/firebase";
import {
  doc, onSnapshot, setDoc, getDoc, serverTimestamp,
} from "firebase/firestore";

export const ADMIN_EMAIL = "ot.helper7@gmail.com";

export interface UserProfile {
  stella: number;
  email: string;
  role?: string;
}

export function useAuthGuard() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    // 인앱 브라우저 체크
    const ua = navigator.userAgent.toLowerCase();
    const targetUrl = window.location.href;
    if (ua.match(/kakaotalk/i)) {
      setIsInAppBrowser(true);
      window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(targetUrl)}`;
    } else if (ua.match(/naver/i) || ua.match(/instagram/i) || ua.match(/facebook/i)) {
      setIsInAppBrowser(true);
      if (ua.match(/android/i)) {
        window.location.href = `intent://${targetUrl.replace(/https?:\/\//i, "")}#Intent;scheme=https;package=com.android.chrome;end`;
      }
    }

    // Firebase 인증 상태 구독
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // 유저 문서 초기화 (최초 로그인 시)
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            email: currentUser.email,
            stella: 0,
            createdAt: serverTimestamp(),
          });
        }

        // pending 스텔라 지급 체크 (서버 API 호출)
        try {
          await fetch("/api/stella/claim-pending", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: currentUser.uid, email: currentUser.email }),
          });
        } catch (e) {
          console.error("pending 스텔라 처리 오류:", e);
        }
      } else {
        setProfile(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // profile 실시간 구독 (스텔라 잔액 즉시 반영)
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const unsubscribeProfile = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      }
    });
    return () => unsubscribeProfile();
  }, [user]);

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
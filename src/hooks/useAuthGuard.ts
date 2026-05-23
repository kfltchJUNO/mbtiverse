"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

export const ADMIN_EMAIL = "ot.helper7@gmail.com";

export function useAuthGuard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    // 1. 인앱 브라우저 체크 및 크롬 우회 로직
    const checkInAppBrowser = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const targetUrl = window.location.href;

      if (userAgent.match(/kakaotalk/i)) {
        setIsInAppBrowser(true);
        window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(targetUrl)}`;
      } else if (userAgent.match(/naver/i) || userAgent.match(/instagram/i) || userAgent.match(/facebook/i)) {
        setIsInAppBrowser(true);
        if (userAgent.match(/android/i)) {
          window.location.href = `intent://${targetUrl.replace(/https?:\/\//i, '')}#Intent;scheme=https;package=com.android.chrome;end`;
        }
      }
    };

    checkInAppBrowser();

    // 2. 파이어베이스 로그인 상태 구독
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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
    loading, 
    isAdmin: user?.email === ADMIN_EMAIL, 
    loginWithGoogle, 
    logout,
    isInAppBrowser
  };
}
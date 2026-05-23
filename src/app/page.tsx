"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuthGuard } from "../hooks/useAuthGuard";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  const { user, loading: loadingAuth, isAdmin, loginWithGoogle, logout, isInAppBrowser } = useAuthGuard();

  useEffect(() => {
    async function fetchPosts() {
      try {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(fetched);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoadingPosts(false);
      }
    }
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <section className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white py-12 px-6 text-center shadow-md">
        <div className="max-w-3xl mx-auto">
          <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
            ✨ 내 성격의 무한한 우주
          </span>
          <h1 className="text-4xl font-black tracking-tight mt-3 mb-2 drop-shadow-sm">
            MBTIverse
          </h1>
          <p className="text-purple-100 font-medium text-sm sm:text-base">
            과일 테스트부터 미래 아이템까지, 가장 트렌디한 MBTI 플레이그라운드
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-2 border-b border-slate-200 pb-3 text-sm font-bold text-slate-400">
            <span className="text-indigo-600 border-b-2 border-indigo-600 pb-3 px-1">🔥 실시간 인기 썰</span>
          </div>

          {loadingPosts ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <Link key={post.id} href={`/posts/${post.id}`} className="group">
                  <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <h2 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{post.title}</h2>
                    <div className="text-xs text-slate-400 mt-6 pt-4 border-t border-slate-50">⏱️ 초고속 정독 가능</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="lg:col-span-1 space-y-6">
          {isInAppBrowser && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs font-bold leading-relaxed shadow-sm">
              ⚠️ 현재 인앱 브라우저 환경입니다.<br />
              구글 로그인이 제한될 수 있으니 우측 상단 메뉴에서 <b>'다른 브라우저로 열기'</b>를 선택해 주세요.<br />
              <span className="text-indigo-600 mt-2 block">💡 홈 화면에 추가하여 앱처럼 다운로드하시면 더욱 원활합니다!</span>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="font-black text-slate-800">👤 내 계정</h3>
            {loadingAuth ? (
              <p className="text-sm text-slate-500">인증 상태 확인 중...</p>
            ) : user ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-bold text-slate-700">{user.displayName}님 환영합니다!</p>
                <button onClick={logout} className="p-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition">
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium text-slate-500 mb-1">대본 생성 등 모든 기능을 이용하시려면 로그인해 주세요.</p>
                <button onClick={loginWithGoogle} className="p-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition">
                  Google 로그인
                </button>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
            <h3 className="font-black text-slate-800 mb-4">🚀 테스트 바로가기</h3>
            <Link href="/test/fruit" className="block w-full p-4 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition">
              🍎 성격 과일 테스트
            </Link>
            <Link href="/test/future-item" className="block w-full p-4 bg-pink-50 text-pink-700 rounded-xl font-bold text-sm hover:bg-pink-100 transition">
              🚀 미래 인생템 테스트
            </Link>
            
            {/* 💡 일반 로그인 유저 전용 (관리자가 아닌 경우): 테스트 기록 보기 (향후 구현을 위한 자리표시자) */}
            {user && !isAdmin && (
              <Link href="/my-history" className="block w-full p-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-100 transition mt-4">
                📚 내 테스트 기록 보기
              </Link>
            )}

            {/* 🔒 관리자 전용: 대본 보기 */}
            {isAdmin && (
              <Link href="/scripts" className="block w-full p-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-100 transition mt-4">
                🎧 내 생성 대본 보기 (Admin)
              </Link>
            )}

            {/* 🔒 관리자 전용: 관리자 패널 */}
            {isAdmin && (
              <Link href="/admin" className="block w-full p-4 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition mt-4 flex justify-between items-center">
                <span>⚙️ 관리자 패널</span>
                <span className="text-[10px] bg-slate-600 px-2 py-0.5 rounded uppercase">Admin</span>
              </Link>
            )}
          </div>

          <div className="sticky top-6">
            <div className="w-full h-[300px] bg-white border border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-slate-400 text-xs text-center p-4">
              Google AdSense
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
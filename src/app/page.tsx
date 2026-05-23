"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* 1. 상단 캐주얼 배너 */}
      <section className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white py-12 px-6 text-center shadow-md">
        <div className="max-w-3xl mx-auto">
          <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
            ✨ 내 성격의 무한한 우주
          </span>
          <h1 className="text-4xl font-black tracking-tight mt-3 mb-2 drop-shadow-sm">
            MBTIverse
          </h1>
          <p className="text-purple-100 font-medium text-sm sm:text-base">
            과일 테스트부터 역사 속 인물 싱크로율까지, 가장 트렌디한 MBTI 플레이그라운드
          </p>
        </div>
      </section>

      {/* 2. 메인 레이아웃 */}
      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* 왼쪽: 콘텐츠 리스트 */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-2 border-b border-slate-200 pb-3 text-sm font-bold text-slate-400">
            <span className="text-indigo-600 border-b-2 border-indigo-600 pb-3 px-1">🔥 실시간 인기 썰</span>
            <Link href="/test/fruit">
                <span className="hover:text-slate-600 pb-3 px-1 cursor-pointer">🍎 성격 과일 테스트</span>
            </Link>
            <Link href="/test/celebrity">
                <span className="hover:text-slate-600 pb-3 px-1 cursor-pointer">👑 닮은 유명인 찾기</span>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-slate-400 text-sm mt-4">콘텐츠를 불러오는 중입니다...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center text-slate-400 py-16 bg-white border rounded-2xl shadow-sm">
              <p className="text-lg font-medium">아직 발행된 콘텐츠가 없습니다 😢</p>
              <p className="text-sm mt-1">관리자 대시보드에서 첫 콘텐츠를 발행해보세요!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post, idx) => (
                <div key={post.id} className="flex flex-col gap-4">
                  {idx === 2 && (
                    <div className="col-span-1 md:col-span-2 w-full h-32 bg-white border border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-slate-400 text-xs shadow-sm">
                      Google AdSense (피드 중간 광고 영역)
                    </div>
                  )}

                  <Link href={`/posts/${post.id}`} className="group h-full">
                    <div className="h-full p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer">
                      <div>
                        <span className="inline-block text-[11px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md mb-4">
                          {post.title?.includes("과일") ? "🍎 FRUIT TEST" : post.title?.includes("인물") ? "👑 MATCHING" : "💬 MBTI TALK"}
                        </span>
                        <h2 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug">
                          {post.title}
                        </h2>
                      </div>
                      
                      <div className="text-xs text-slate-400 mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                        <span className="flex items-center gap-1">⏱️ 초고속 정독 가능</span>
                        <span>
                          {post.createdAt && typeof post.createdAt.toDate === 'function'
                            ? post.createdAt.toDate().toLocaleDateString('ko-KR')
                            : '방금 전'}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 오른쪽: 구글 애드센스 사이드바 광고 고정 영역 */}
        <aside className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="w-full h-[600px] bg-white border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-4 text-center shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Advertisement</span>
              <p className="text-xs">Google AdSense<br/>(우측 스크롤 고정 배너)</p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
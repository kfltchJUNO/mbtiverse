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
            과일 테스트부터 미래 아이템까지, 가장 트렌디한 MBTI 플레이그라운드
          </p>
        </div>
      </section>

      {/* 2. 메인 레이아웃 */}
      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* 왼쪽: 콘텐츠 리스트 */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-2 border-b border-slate-200 pb-3 text-sm font-bold text-slate-400">
            <span className="text-indigo-600 border-b-2 border-indigo-600 pb-3 px-1">🔥 실시간 인기 썰</span>
          </div>

          {loading ? (
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

        {/* 오른쪽: 테스트 모음 & 광고 */}
        <aside className="lg:col-span-1 space-y-6">
          {/* 테스트 버튼 영역 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
            <h3 className="font-black text-slate-800 mb-4">🚀 테스트 바로가기</h3>
            <Link href="/test/fruit" className="block w-full p-4 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition">
              🍎 성격 과일 테스트
            </Link>
            <Link href="/test/future-item" className="block w-full p-4 bg-pink-50 text-pink-700 rounded-xl font-bold text-sm hover:bg-pink-100 transition">
              🚀 미래 인생템 테스트
            </Link>
          </div>

          {/* 광고 영역 */}
          <div className="sticky top-6">
            <div className="w-full h-[500px] bg-white border border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-slate-400 text-xs text-center p-4">
              Google AdSense
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
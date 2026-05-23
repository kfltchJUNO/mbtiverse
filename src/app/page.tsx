"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuthGuard } from "../hooks/useAuthGuard";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  
  const { user, loading: loadingAuth, isAdmin, loginWithGoogle, logout, isInAppBrowser } = useAuthGuard();

  useEffect(() => {
    async function fetchPosts() {
      try {
        // 애드센스는 최신 글이 주기적으로 올라오는 것을 좋아합니다.
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(6));
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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* 1. 상단 히어로 섹션 (명확한 사이트 정체성 부여) */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-16 px-6 text-center shadow-lg relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10">
          <span className="bg-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full backdrop-blur-md border border-white/30 shadow-sm">
            ✨ 내 성격의 무한한 우주를 탐험하다
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-6 mb-4 drop-shadow-md">
            MBTIverse (엠비티아이버스)
          </h1>
          <p className="text-purple-50 font-medium text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            16가지 성격 유형에 숨겨진 재미있는 심리 분석과 맞춤형 트렌드 콘텐츠를 제공합니다. 
            나만의 과일 유형부터 미래 인생템까지, 데이터 기반의 심리 테스트로 진정한 나를 발견해보세요.
          </p>
        </div>
      </section>

      {/* 2. 메인 콘텐츠 레이아웃 */}
      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 w-full">
        
        {/* 왼쪽: 메인 콘텐츠 (텍스트가 풍부한 영역으로 구글 봇이 좋아함) */}
        <div className="lg:col-span-3 space-y-10">
          
          {/* 사이트 소개 텍스트 (애드센스 승인을 위한 필수 텍스트 볼륨 확보) */}
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-black text-slate-800 mb-4">MBTIverse 소개</h2>
            <p className="text-slate-600 leading-relaxed break-keep">
              MBTIverse는 심리학적 통찰과 최신 AI 기술을 결합하여 사용자에게 맞춤형 성격 분석 콘텐츠를 제공하는 플랫폼입니다. 
              단순한 흥미 위주의 테스트를 넘어, 각 성격 유형(MBTI)이 가지는 고유한 장점과 대인 관계에서의 커뮤니케이션 방식을 
              깊이 있게 탐구합니다. 매주 업데이트되는 오리지널 칼럼과 썰을 통해 타인을 이해하고 나 자신을 사랑하는 방법을 배워보세요.
            </p>
          </section>

          {/* 최신 콘텐츠 피드 */}
          <section>
            <div className="flex gap-2 border-b border-slate-200 pb-3 text-sm font-bold text-slate-400 mb-6">
              <span className="text-indigo-600 border-b-2 border-indigo-600 pb-3 px-1">🔥 최신 MBTI 분석 리포트</span>
            </div>

            {loadingPosts ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : posts.length === 0 ? (
               <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-100">
                 새로운 콘텐츠가 곧 업데이트될 예정입니다.
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post) => (
                  <Link key={post.id} href={`/posts/${post.id}`} className="group">
                    <article className="h-full p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-slate-500 mt-3 line-clamp-2">
                          {post.keyword ? `${post.keyword}에 대한 16가지 성격 유형별 흥미로운 반응과 심리 분석을 확인해보세요.` : "클릭하여 상세한 심리 분석 리포트를 읽어보세요."}
                        </p>
                      </div>
                      <div className="text-xs text-slate-400 mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                        <span>💡 심리/트렌드</span>
                        <span>
                          {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('ko-KR') : '최신 글'}
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* 오른쪽: 사이드바 (로그인, 테스트, 광고) */}
        <aside className="lg:col-span-1 space-y-6">
          
          {isInAppBrowser && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs font-bold leading-relaxed shadow-sm">
              ⚠️ 인앱 브라우저에서는 로그인이 제한될 수 있습니다. <b>다른 브라우저로 열기</b>를 권장합니다.
            </div>
          )}

          {/* 인증 영역 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 mb-4">👤 내 계정</h3>
            {loadingAuth ? (
              <p className="text-sm text-slate-500">확인 중...</p>
            ) : user ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-bold text-slate-700">{user.displayName}님 환영합니다!</p>
                <button onClick={logout} className="p-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition">
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium text-slate-500 mb-2">로그인하고 나의 테스트 기록을 저장해보세요.</p>
                <button onClick={loginWithGoogle} className="p-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition">
                  Google 계정으로 시작
                </button>
              </div>
            )}
          </div>

          {/* 테스트 링크 영역 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
            <h3 className="font-black text-slate-800 mb-4">🚀 심리 테스트</h3>
            <Link href="/test/fruit" className="block w-full p-4 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition">
              🍎 성격 과일 테스트
            </Link>
            <Link href="/test/future-item" className="block w-full p-4 bg-pink-50 text-pink-700 rounded-xl font-bold text-sm hover:bg-pink-100 transition">
              🚀 미래 인생템 테스트
            </Link>
            
            {user && !isAdmin && (
              <Link href="/my-history" className="block w-full p-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-100 transition mt-4">
                📚 내 테스트 기록 보기
              </Link>
            )}

            {isAdmin && (
              <Link href="/scripts" className="block w-full p-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-100 transition mt-4">
                🎧 대본 아카이브 (Admin)
              </Link>
            )}

            {isAdmin && (
              <Link href="/admin" className="block w-full p-4 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition mt-4 flex justify-between items-center">
                <span>⚙️ 관리자 패널</span>
              </Link>
            )}
          </div>

          {/* 광고 영역 */}
          <div className="sticky top-6">
            <div className="w-full h-[300px] bg-slate-100 border-2 border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 text-xs text-center p-4">
              {/* 여기에 추후 구글 애드센스 코드가 들어갑니다 */}
              Google AdSense 영역
            </div>
          </div>
        </aside>
      </main>

      {/* 3. 푸터 (애드센스 승인의 핵심: 필수 정책 페이지 링크) */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-black text-slate-800 mb-1">MBTIverse</h2>
            <p className="text-xs text-slate-500 mb-2">운영자 이메일: ot.helper7@gmail.com</p>
            <p className="text-xs text-slate-400">© 2026 MBTIverse. All rights reserved.</p>
          </div>
          <div className="flex gap-4 text-sm font-bold text-slate-600">
            <Link href="/privacy" className="hover:text-indigo-600">개인정보처리방침</Link>
            <span className="text-slate-300">|</span>
            <Link href="/terms" className="hover:text-indigo-600">이용약관</Link>
            <span className="text-slate-300">|</span>
            <Link href="/contact" className="hover:text-indigo-600">문의하기</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
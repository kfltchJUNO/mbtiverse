"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuthGuard } from "../hooks/useAuthGuard";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const router = useRouter();

  const { user, profile, loading: loadingAuth, isAdmin, loginWithGoogle, logout, isInAppBrowser } = useAuthGuard();

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense push error:", e);
    }

    async function fetchPosts() {
      try {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(6));
        const snapshot = await getDocs(q);
        setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
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

      {/* 히어로 섹션 */}
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

      {/* 메인 콘텐츠 */}
      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 w-full">

        {/* 왼쪽: 메인 콘텐츠 */}
        <div className="lg:col-span-3 space-y-10">
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-black text-slate-800 mb-4">MBTIverse 소개</h2>
            <p className="text-slate-600 leading-relaxed break-keep">
              MBTIverse는 심리학적 통찰과 최신 AI 기술을 결합하여 사용자에게 맞춤형 성격 분석 콘텐츠를 제공하는 플랫폼입니다.
              단순한 흥미 위주의 테스트를 넘어, 각 성격 유형(MBTI)이 가지는 고유한 장점과 대인 관계에서의 커뮤니케이션 방식을
              깊이 있게 탐구합니다. 매주 업데이트되는 오리지널 칼럼과 썰을 통해 타인을 이해하고 나 자신을 사랑하는 방법을 배워보세요.
            </p>
          </section>

          <section>
            <div className="flex gap-2 border-b border-slate-200 pb-3 text-sm font-bold text-slate-400 mb-6">
              <span className="text-indigo-600 border-b-2 border-indigo-600 pb-3 px-1">🔥 최신 MBTI 분석 리포트</span>
            </div>

            {loadingPosts ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-100">
                새로운 콘텐츠가 곧 업데이트될 예정입니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post) => (
                  <Link key={post.id} href={`/posts/${post.id}`} className="group">
                    <article className="h-full bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
                      {/* 썸네일 */}
                      {post.thumbnailUrl ? (
                        <div className="w-full h-40 overflow-hidden">
                          <img
                            src={post.thumbnailUrl}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-24 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-3xl">
                          🧠
                        </div>
                      )}
                      <div className="p-6 flex flex-col flex-1 justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-sm text-slate-500 mt-3 line-clamp-2">
                            {post.keyword
                              ? `${post.keyword}에 대한 16가지 성격 유형별 흥미로운 반응과 심리 분석을 확인해보세요.`
                              : "클릭하여 상세한 심리 분석 리포트를 읽어보세요."}
                          </p>
                        </div>
                        <div className="text-xs text-slate-400 mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                          <span>💡 심리/트렌드</span>
                          <span>
                            {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString("ko-KR") : "최신 글"}
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* 오른쪽: 사이드바 */}
        <aside className="lg:col-span-1 space-y-4">

          {isInAppBrowser && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs font-bold leading-relaxed shadow-sm">
              ⚠️ 인앱 브라우저에서는 로그인이 제한될 수 있습니다. <b>다른 브라우저로 열기</b>를 권장합니다.
            </div>
          )}

          {/* ── 계정 카드 ── */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-800 mb-3">👤 내 계정</h3>
            {loadingAuth ? (
              <p className="text-sm text-slate-400">확인 중...</p>
            ) : user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700 truncate">{user.displayName}님</p>
                  <span className="text-amber-500 text-sm font-black">{profile?.stella ?? 0} ⭐</span>
                </div>
                <button
                  onClick={logout}
                  className="w-full p-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium text-slate-500">로그인하고 나의 테스트 기록을 저장해보세요.</p>
                <button
                  onClick={loginWithGoogle}
                  className="w-full p-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition"
                >
                  Google 계정으로 시작
                </button>
              </div>
            )}
          </div>

          {/* ── 챗봇 진입 버튼 ── */}
          {user ? (
            // 로그인 상태: 화려한 챗봇 CTA
            <button
              onClick={() => router.push("/chat")}
              className="group w-full relative overflow-hidden rounded-2xl border border-indigo-500/30 hover:border-indigo-400/60 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-900/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950" />
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 text-[10px] font-bold tracking-wider uppercase">LIVE · 16 Characters</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white font-black text-base leading-tight">AI 캐릭터 채팅</p>
                    <p className="text-white/50 text-xs mt-0.5">16가지 MBTI 캐릭터와 대화</p>
                  </div>
                  <span className="text-2xl">💬</span>
                </div>
                {/* 캐릭터 아바타 미니 프리뷰 */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    {["🔧","🧠","🌸","✈️","👑","💃"].map((emoji, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs flex-shrink-0">
                        {emoji}
                      </div>
                    ))}
                  </div>
                  <span className="text-white/40 text-[10px]">+10명</span>
                  <span className="ml-auto text-indigo-400 text-xs font-bold group-hover:text-indigo-300 transition">
                    시작하기 →
                  </span>
                </div>
              </div>
            </button>
          ) : (
            // 비로그인: 로그인 유도 챗봇 버튼
            <button
              onClick={loginWithGoogle}
              className="w-full p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 hover:border-indigo-300 rounded-2xl transition text-left group"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="font-black text-indigo-700 text-sm">💬 AI 캐릭터 채팅</p>
                <span className="text-lg">🔒</span>
              </div>
              <p className="text-indigo-500 text-xs">로그인 후 16가지 캐릭터와 대화할 수 있어요</p>
              <p className="text-indigo-400 text-[10px] mt-2 font-bold group-hover:underline">
                Google로 로그인하기 →
              </p>
            </button>
          )}

          {/* ── 심리 테스트 ── */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-2">
            <h3 className="font-black text-slate-800 mb-3">🚀 심리 테스트</h3>
            <Link href="/test/fruit" className="block w-full p-3.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition">
              🍎 성격 과일 테스트
            </Link>
            <Link href="/test/future-item" className="block w-full p-3.5 bg-pink-50 text-pink-700 rounded-xl font-bold text-sm hover:bg-pink-100 transition">
              🚀 미래 인생템 테스트
            </Link>
            {user && !isAdmin && (
              <Link href="/my-history" className="block w-full p-3.5 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-100 transition mt-2">
                📚 내 테스트 기록 보기
              </Link>
            )}
            {isAdmin && (
              <>
                <Link href="/scripts" className="block w-full p-3.5 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-100 transition mt-2">
                  🎧 대본 아카이브 (Admin)
                </Link>
                <Link href="/admin" className="flex justify-between items-center w-full p-3.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition mt-1">
                  <span>⚙️ 관리자 패널</span>
                </Link>
              </>
            )}
          </div>

          {/* 애드센스 */}
          <div className="sticky top-6">
            <ins
              className="adsbygoogle"
              style={{ display: "block", minHeight: "300px" }}
              data-ad-client="ca-pub-4585319125929329"
              data-ad-slot="5361492130"
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        </aside>
      </main>

      <footer className="bg-white border-t border-slate-200 py-10 mt-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-black text-slate-800 mb-1">MBTIverse</h2>
            <p className="text-xs text-slate-500 mb-2">운영자 이메일: ohejunho@naver.com</p>
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
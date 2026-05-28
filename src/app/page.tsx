"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuthGuard } from "../hooks/useAuthGuard";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [customTests, setCustomTests] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const router = useRouter();

  const { user, profile, loading: loadingAuth, isAdmin, loginWithGoogle, logout, isInAppBrowser } = useAuthGuard();

  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
    async function fetchPosts() {
      try {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(6));
        const snapshot = await getDocs(q);
        setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch {}
      finally { setLoadingPosts(false); }
    }
    async function fetchCustomTests() {
      try {
        const q = query(
          collection(db, "custom_tests"),
          where("isActive", "==", true),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        setCustomTests(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (e) { console.error("custom_tests 로드 실패:", e); }
    }
    fetchPosts();
    fetchCustomTests();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">

      {/* ════════════════════════════════════════
          모바일 상단 고정 바 (lg 미만)
      ════════════════════════════════════════ */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* 로고 */}
          <span className="font-black text-indigo-600 text-lg">MBTIverse</span>

          {/* 우측: 계정 상태 + 메뉴 버튼 */}
          <div className="flex items-center gap-2">
            {/* 스텔라 잔액 (로그인 시) */}
            {user && (
              <span className="text-amber-500 text-sm font-black">{profile?.stella ?? 0} ⭐</span>
            )}
            {/* 챗봇 바로가기 (로그인 시) */}
            {user && (
              <button
                onClick={() => router.push("/chat")}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-md"
              >
                💬 채팅 시작
              </button>
            )}
            {/* 햄버거 메뉴 */}
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-100 text-slate-600"
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════
          모바일 드로어 메뉴
      ════════════════════════════════════════ */}
      {menuOpen && (
        <>
          {/* 딤 배경 */}
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          {/* 드로어 (우측에서 슬라이드) */}
          <div className="lg:hidden fixed top-0 right-0 z-50 w-[80vw] max-w-xs h-full bg-white shadow-2xl flex flex-col overflow-y-auto">
            {/* 드로어 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <span className="font-black text-slate-800">메뉴</span>
              <button onClick={() => setMenuOpen(false)} className="text-slate-400 text-xl font-bold">✕</button>
            </div>

            <div className="p-5 flex flex-col gap-4 flex-1">
              {isInAppBrowser && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-bold">
                  ⚠️ 인앱 브라우저에서는 로그인이 제한됩니다.
                </div>
              )}

              {/* 계정 영역 */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">👤 내 계정</p>
                {loadingAuth ? (
                  <p className="text-sm text-slate-400">확인 중...</p>
                ) : user ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-700 text-sm truncate">{user.displayName}님</p>
                      <span className="text-amber-500 font-black text-sm">{profile?.stella ?? 0} ⭐</span>
                    </div>
                    <button
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="w-full py-2.5 bg-slate-200 text-slate-600 rounded-xl font-bold text-sm"
                    >
                      로그아웃
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">로그인하고 테스트 기록을 저장해보세요.</p>
                    <button
                      onClick={() => { loginWithGoogle(); setMenuOpen(false); }}
                      className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm"
                    >
                      Google로 로그인
                    </button>
                  </div>
                )}
              </div>

              {/* 챗봇 CTA */}
              {user ? (
                <button
                  onClick={() => { router.push("/chat"); setMenuOpen(false); }}
                  className="relative overflow-hidden rounded-2xl border border-indigo-500/30 w-full text-left"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-purple-950" />
                  <div className="relative p-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">LIVE · 16 Characters</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-black text-base">AI 캐릭터 채팅</p>
                        <p className="text-white/50 text-xs">16가지 MBTI 캐릭터와 대화</p>
                      </div>
                      <span className="text-3xl">💬</span>
                    </div>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => { loginWithGoogle(); setMenuOpen(false); }}
                  className="w-full p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-left"
                >
                  <p className="font-black text-indigo-700 text-sm mb-0.5">💬 AI 캐릭터 채팅</p>
                  <p className="text-indigo-400 text-xs">로그인 후 이용 가능</p>
                </button>
              )}

              {/* 심리 테스트 메뉴 */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">🚀 심리 테스트</p>
                <Link href="/test/fruit" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm">
                  🍎 성격 과일 테스트
                </Link>
                <Link href="/test/future-item" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3.5 bg-pink-50 text-pink-700 rounded-xl font-bold text-sm">
                  🚀 미래 인생템 테스트
                </Link>
                {user && !isAdmin && (
                  <Link href="/my-history" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3.5 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm">
                    📚 내 테스트 기록
                  </Link>
                )}
                {isAdmin && (
                  <>
                    <Link href="/scripts" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3.5 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm">
                      🎧 대본 아카이브
                    </Link>
                    <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center justify-between p-3.5 bg-slate-800 text-white rounded-xl font-bold text-sm">
                      <span>⚙️ 관리자 패널</span>
                      <span>→</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════
          히어로 섹션
      ════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-12 lg:py-16 px-6 text-center shadow-lg relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10">
          <span className="bg-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full backdrop-blur-md border border-white/30">
            ✨ 내 성격의 무한한 우주를 탐험하다
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mt-5 mb-3 drop-shadow-md">
            MBTIverse
          </h1>
          <p className="text-purple-100 text-sm md:text-base leading-relaxed max-w-xl mx-auto">
            16가지 성격 유형 심리 분석과 AI 캐릭터 챗봇 플랫폼
          </p>

          {/* 모바일 히어로 CTA 버튼 */}
          <div className="flex gap-3 justify-center mt-6 lg:hidden">
            {user ? (
              <button
                onClick={() => router.push("/chat")}
                className="px-5 py-2.5 bg-white text-indigo-700 font-black rounded-2xl text-sm shadow-lg"
              >
                💬 AI 채팅 시작
              </button>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="px-5 py-2.5 bg-white text-indigo-700 font-black rounded-2xl text-sm shadow-lg"
              >
                Google로 시작하기
              </button>
            )}
            <Link
              href="/test/fruit"
              className="px-5 py-2.5 bg-white/20 text-white font-bold rounded-2xl text-sm border border-white/30"
            >
              🍎 테스트 하기
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          메인 콘텐츠
      ════════════════════════════════════════ */}
      <main className="max-w-6xl mx-auto w-full flex-1">

        {/* ── 모바일: 가로 스크롤 포스트 카드 ── */}
        <div className="lg:hidden px-4 pt-6 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-slate-800 text-base">🔥 최신 분석 리포트</h2>
          </div>

          {loadingPosts ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-52 flex-shrink-0 h-40 bg-slate-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">곧 업데이트 예정입니다.</p>
          ) : (
            /* 가로 스크롤 카드 — 스크롤바 숨김 */
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide"
                 style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {posts.map((post) => (
                <Link key={post.id} href={`/posts/${post.id}`} className="flex-shrink-0 w-52 group">
                  <article className="h-full bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    {post.thumbnailUrl ? (
                      <div className="w-full h-28 overflow-hidden">
                        <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-20 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-2xl">
                        🧠
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600">
                        {post.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString("ko-KR") : "최신 글"}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── 모바일: 테스트 바로가기 (버튼 → 모달) ── */}
        <div className="lg:hidden px-4 py-4">
          <button
            onClick={() => setShowTestModal(true)}
            className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧠</span>
              <div className="text-left">
                <p className="font-black text-indigo-700 text-sm">심리 테스트</p>
                <p className="text-indigo-400 text-xs">{2 + customTests.length}가지 테스트 보기</p>
              </div>
            </div>
            <span className="text-indigo-400 font-bold text-lg">→</span>
          </button>
        </div>

        {/* ── 테스트 선택 모달 ── */}
        {showTestModal && (
          <>
            <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowTestModal(false)} />
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl p-6 pb-10">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-slate-800 text-lg">🧠 심리 테스트</h3>
                <button onClick={() => setShowTestModal(false)} className="text-slate-400 text-xl font-bold">✕</button>
              </div>
              <div className="space-y-3">
                <Link href="/test/fruit" onClick={() => setShowTestModal(false)}
                  className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                  <span className="text-3xl">🍎</span>
                  <div>
                    <p className="font-black text-indigo-700">성격 과일 테스트</p>
                    <p className="text-indigo-400 text-xs">나와 닮은 과일 유형은?</p>
                  </div>
                </Link>
                <Link href="/test/future-item" onClick={() => setShowTestModal(false)}
                  className="flex items-center gap-4 p-4 bg-pink-50 border border-pink-100 rounded-2xl">
                  <span className="text-3xl">🚀</span>
                  <div>
                    <p className="font-black text-pink-700">미래 인생템 테스트</p>
                    <p className="text-pink-400 text-xs">나의 미래 필수템은?</p>
                  </div>
                </Link>
                {customTests.map((test) => (
                  <Link key={test.id} href={`/test/${test.slug}`} onClick={() => setShowTestModal(false)}
                    className="flex items-center gap-4 p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                    <span className="text-3xl">{test.emoji || "🧠"}</span>
                    <div>
                      <p className="font-black text-purple-700">{test.title}</p>
                      {test.description && <p className="text-purple-400 text-xs line-clamp-1">{test.description}</p>}
                    </div>
                  </Link>
                ))}
                {user && !isAdmin && (
                  <Link href="/my-history" onClick={() => setShowTestModal(false)}
                    className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                    <span className="text-3xl">📚</span>
                    <div>
                      <p className="font-black text-emerald-700">내 테스트 기록</p>
                      <p className="text-emerald-400 text-xs">지금까지 한 테스트 보기</p>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── 데스크탑: 기존 4컬럼 레이아웃 ── */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-8 p-6">

          {/* 왼쪽 콘텐츠 */}
          <div className="lg:col-span-3 space-y-10">
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-black text-slate-800 mb-4">MBTIverse 소개</h2>
              <p className="text-slate-600 leading-relaxed break-keep">
                MBTIverse는 심리학적 통찰과 최신 AI 기술을 결합하여 사용자에게 맞춤형 성격 분석 콘텐츠를 제공하는 플랫폼입니다.
                단순한 흥미 위주의 테스트를 넘어, 각 성격 유형(MBTI)이 가지는 고유한 장점과 대인 관계에서의 커뮤니케이션 방식을
                깊이 있게 탐구합니다.
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
                        {post.thumbnailUrl ? (
                          <div className="w-full h-40 overflow-hidden">
                            <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                        ) : (
                          <div className="w-full h-24 bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-3xl">🧠</div>
                        )}
                        <div className="p-6 flex flex-col flex-1 justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">{post.title}</h3>
                            <p className="text-sm text-slate-500 mt-3 line-clamp-2">
                              {post.keyword ? `${post.keyword}에 대한 16가지 성격 유형별 심리 분석` : "클릭하여 상세 리포트를 확인하세요."}
                            </p>
                          </div>
                          <div className="text-xs text-slate-400 mt-6 pt-4 border-t border-slate-50 flex justify-between">
                            <span>💡 심리/트렌드</span>
                            <span>{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString("ko-KR") : "최신 글"}</span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* 데스크탑 사이드바 */}
          <aside className="lg:col-span-1 space-y-4">
            {isInAppBrowser && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl text-xs font-bold">
                ⚠️ 인앱 브라우저에서는 로그인이 제한될 수 있습니다.
              </div>
            )}
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
                  <button onClick={logout} className="w-full p-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition">
                    로그아웃
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-slate-500">로그인하고 테스트 기록을 저장해보세요.</p>
                  <button onClick={loginWithGoogle} className="w-full p-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition">
                    Google 계정으로 시작
                  </button>
                </div>
              )}
            </div>

            {user ? (
              <button onClick={() => router.push("/chat")} className="group w-full relative overflow-hidden rounded-2xl border border-indigo-500/30 hover:border-indigo-400/60 transition-all duration-300 hover:shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950" />
                <div className="relative p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">LIVE · 16 Characters</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white font-black text-base">AI 캐릭터 채팅</p>
                      <p className="text-white/50 text-xs mt-0.5">16가지 MBTI 캐릭터와 대화</p>
                    </div>
                    <span className="text-2xl">💬</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5">
                      {["🔧","🧠","🌸","✈️","👑","💃"].map((e, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs">{e}</div>
                      ))}
                    </div>
                    <span className="text-white/40 text-[10px]">+10명</span>
                    <span className="ml-auto text-indigo-400 text-xs font-bold">시작하기 →</span>
                  </div>
                </div>
              </button>
            ) : (
              <button onClick={loginWithGoogle} className="w-full p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl text-left">
                <p className="font-black text-indigo-700 text-sm mb-1">💬 AI 캐릭터 채팅</p>
                <p className="text-indigo-400 text-xs">로그인 후 16가지 캐릭터와 대화 가능</p>
              </button>
            )}

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-2">
              <h3 className="font-black text-slate-800 mb-3">🚀 심리 테스트</h3>
              <Link href="/test/fruit" className="block w-full p-3.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition">🍎 성격 과일 테스트</Link>
              <Link href="/test/future-item" className="block w-full p-3.5 bg-pink-50 text-pink-700 rounded-xl font-bold text-sm hover:bg-pink-100 transition">🚀 미래 인생템 테스트</Link>
              {/* 커스텀 테스트 동적 로드 */}
              {customTests.map((test) => (
                <Link key={test.id} href={`/test/${test.slug}`}
                  className="block w-full p-3.5 bg-purple-50 text-purple-700 rounded-xl font-bold text-sm hover:bg-purple-100 transition">
                  {test.emoji || "🧠"} {test.title}
                </Link>
              ))}
              {user && !isAdmin && <Link href="/my-history" className="block w-full p-3.5 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-100 transition">📚 내 테스트 기록</Link>}
              {isAdmin && <>
                <Link href="/scripts" className="block w-full p-3.5 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-100 transition">🎧 대본 아카이브</Link>
                <Link href="/admin" className="flex justify-between items-center w-full p-3.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition"><span>⚙️ 관리자 패널</span></Link>
              </>}
            </div>

            <div className="sticky top-6">
              <ins className="adsbygoogle" style={{ display: "block", minHeight: "300px" }}
                data-ad-client="ca-pub-4585319125929329" data-ad-slot="5361492130"
                data-ad-format="auto" data-full-width-responsive="true" />
            </div>
          </aside>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-10 mt-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-black text-slate-800 mb-1">MBTIverse</h2>
            <p className="text-xs text-slate-500 mb-1">운영자 이메일: ohejunho@naver.com</p>
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
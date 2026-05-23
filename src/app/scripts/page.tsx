"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ScriptsPage() {
  const { loading, isAdmin } = useAuthGuard();
  const router = useRouter();
  const [scripts, setScripts] = useState<any[]>([]);
  const [loadingScripts, setLoadingScripts] = useState(true);

  // 선택된 대본 번들을 열어볼 수 있도록 상태 관리
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      alert("접근 권한이 없습니다.");
      router.push('/');
      return;
    }

    async function fetchScripts() {
      if (isAdmin) {
        try {
          // 💡 AdminDashboard에서 'posts' 컬렉션에 저장하므로 여기서도 'posts'를 불러옵니다.
          const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
          const snapshot = await getDocs(q);
          const fetched = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          }));
          setScripts(fetched);
        } catch (error) {
          console.error("대본 로드 실패:", error);
        } finally {
          setLoadingScripts(false);
        }
      }
    }
    fetchScripts();
  }, [loading, isAdmin, router]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800">생성된 대본 아카이브</h1>
            <p className="text-slate-500 mt-2">지금까지 발행한 16종 MBTI 대본 세트 목록입니다.</p>
          </div>
          <Link href="/admin" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition">
            대본 생성기로
          </Link>
        </header>

        {loadingScripts ? (
          <div className="text-center py-20 text-slate-500 font-bold">대본 데이터를 불러오는 중입니다...</div>
        ) : scripts.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-500 shadow-sm">
            아직 생성된 대본이 없습니다. 관리자 패널에서 첫 대본을 발행해 보세요!
          </div>
        ) : (
          <div className="space-y-6">
            {scripts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                
                {/* 대본 세트 헤더 (클릭 시 아코디언처럼 펼쳐짐) */}
                <div 
                  className="p-6 cursor-pointer hover:bg-slate-50 transition flex justify-between items-center"
                  onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
                >
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-1">
                      {post.title || "제목 없음"} 
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">
                      키워드: <span className="text-indigo-500">{post.keyword}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block mb-2">
                      {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString('ko-KR') : '방금 전'}
                    </span>
                    <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                      {expandedId === post.id ? "접기 ▲" : "자세히 보기 ▼"}
                    </span>
                  </div>
                </div>

                {/* 16개 MBTI 펼쳐보기 영역 */}
                {expandedId === post.id && post.contents && (
                  <div className="p-6 bg-slate-50 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {post.contents.map((item: any) => (
                      <div key={item.mbti} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-black text-lg text-indigo-600">{item.mbti}</h3>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(item.script);
                              alert(`${item.mbti} 대본이 복사되었습니다.`);
                            }}
                            className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200"
                          >
                            복사
                          </button>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto pr-2">
                          {item.script}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
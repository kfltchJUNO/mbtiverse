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

  useEffect(() => {
    // 권한 체크: 로딩이 끝났는데 관리자가 아니라면 튕겨냄
    if (!loading && !isAdmin) {
      alert("접근 권한이 없습니다.");
      router.push('/');
      return;
    }

    // 관리자일 경우에만 대본 데이터를 가져옴
    async function fetchScripts() {
      if (isAdmin) {
        try {
          // Firestore의 'scripts' 컬렉션에서 데이터 호출
          const q = query(collection(db, "scripts"), orderBy("createdAt", "desc"));
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

  // 화면 로딩 중 또는 권한 없음 처리
  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800">생성된 대본 목록</h1>
            <p className="text-slate-500 mt-2">AI가 생성한 성격 유형별 대본 아카이브입니다.</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300">
            홈으로 돌아가기
          </Link>
        </header>

        {loadingScripts ? (
          <div className="text-center py-20 text-slate-500 font-bold">대본을 불러오는 중입니다...</div>
        ) : scripts.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-500">
            아직 생성된 대본이 없습니다. 관리자 패널에서 첫 대본을 생성해 보세요!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {scripts.map((script) => (
              <div key={script.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black tracking-wider">
                    {script.mbti || "MBTI 미지정"}
                  </span>
                  <span className="text-xs text-slate-400">
                    {script.createdAt?.toDate ? script.createdAt.toDate().toLocaleString('ko-KR') : '방금 전'}
                  </span>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {script.content || "내용이 없습니다."}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
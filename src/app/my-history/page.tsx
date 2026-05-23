"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MyHistoryPage() {
  const { user, loading } = useAuthGuard();
  const router = useRouter();
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      alert("로그인이 필요한 서비스입니다.");
      router.push('/');
      return;
    }

    async function fetchHistory() {
      if (user) {
        try {
          // 🚀 현재 로그인한 유저(userId)의 데이터만 시간 역순으로 불러오기
          const q = query(
            collection(db, "testHistory"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
          );
          
          const snapshot = await getDocs(q);
          const fetched = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          }));
          setHistory(fetched);
        } catch (error) {
          console.error("기록 로드 실패:", error);
        } finally {
          setLoadingHistory(false);
        }
      }
    }
    fetchHistory();
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800">내 테스트 기록</h1>
            <p className="text-slate-500 mt-2">지금까지 참여한 테스트 결과가 누적됩니다.</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300">
            홈으로
          </Link>
        </header>

        {loadingHistory ? (
          <div className="text-center py-20 text-slate-500 font-bold">기록을 불러오는 중입니다...</div>
        ) : history.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-500">
            아직 완료한 테스트가 없습니다.<br/>메인에서 테스트를 진행해 보세요!
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {history.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition">
                <div>
                  <p className="text-xs text-slate-400 font-bold mb-1">{item.testName}</p>
                  <h2 className="text-xl font-black text-slate-800">{item.resultName}</h2>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md text-sm font-black tracking-widest mb-1">
                    {item.mbti}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString('ko-KR') : '방금 전'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
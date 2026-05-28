// src/app/admin/stella/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  collection, doc, getDoc, getDocs, query,
  orderBy, runTransaction, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuthGuard } from "../../../hooks/useAuthGuard";
import { useRouter } from "next/navigation";

export default function AdminStellaPage() {
  const { user, isAdmin, loading } = useAuthGuard();
  const router = useRouter();

  const [searchEmail, setSearchEmail] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [stellaAmount, setStellaAmount] = useState(100);
  const [stellaNote, setStellaNote] = useState("");
  const [isGranting, setIsGranting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [grantLog, setGrantLog] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [loading, user, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) fetchGrantLog();
  }, [isAdmin]);

  const fetchGrantLog = async () => {
    try {
      const q = query(collection(db, "stella_grants"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setGrantLog(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {}
  };

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) return alert("이메일을 입력해주세요.");
    setIsSearching(true);
    setFoundUser(null);
    try {
      const res = await fetch("/api/admin/search-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: searchEmail.trim(),
          requestEmail: user?.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFoundUser(data.user);
      } else {
        alert(data.error || "유저를 찾을 수 없습니다.");
      }
    } catch (err: any) {
      alert("검색 오류: " + err.message);
    }
    setIsSearching(false);
  };

  const handleGrantStella = async () => {
    if (!foundUser) return alert("유저를 먼저 검색해주세요.");
    if (stellaAmount <= 0) return alert("지급량은 1 이상이어야 합니다.");
    if (!confirm(`${foundUser.email}님에게 ${stellaAmount} 스텔라를 지급하시겠습니까?`)) return;

    setIsGranting(true);
    try {
      const userRef = doc(db, "users", foundUser.id);
      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("유저 문서가 존재하지 않습니다.");
        const currentStella = userSnap.data().stella || 0;
        const newStella = currentStella + stellaAmount;
        transaction.update(userRef, { stella: newStella });
        const logRef = doc(collection(db, "stella_grants"));
        transaction.set(logRef, {
          targetUid: foundUser.id,
          targetEmail: foundUser.email,
          targetName: foundUser.displayName || "",
          amount: stellaAmount,
          note: stellaNote || "관리자 지급",
          balanceBefore: currentStella,
          balanceAfter: newStella,
          createdAt: serverTimestamp(),
        });
      });
      alert(`✅ ${stellaAmount} 스텔라 지급 완료!`);
      const refreshed = await getDoc(userRef);
      setFoundUser({ id: refreshed.id, ...refreshed.data() });
      setStellaNote("");
      fetchGrantLog();
    } catch (err: any) {
      alert("지급 실패: " + err.message);
    }
    setIsGranting(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto pb-12 space-y-6">
      <h2 className="text-xl font-black text-amber-400">⭐ 스텔라 관리</h2>

      {/* 유저 검색 */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h3 className="font-bold text-slate-200 mb-4">유저 검색 & 지급</h3>
        <div className="flex gap-3 mb-4">
          <input
            type="email"
            placeholder="유저 이메일로 검색"
            className="flex-1 p-3 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl text-sm"
            value={searchEmail}
            onChange={e => setSearchEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearchUser()}
          />
          <button
            onClick={handleSearchUser}
            disabled={isSearching}
            className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl text-sm font-bold transition"
          >
            {isSearching ? "검색 중..." : "검색"}
          </button>
        </div>

        {foundUser && (
          <div className="bg-slate-900 rounded-xl p-5 border border-amber-500/30">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-black text-slate-900">
                {(foundUser.email)?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-100">{foundUser.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">현재 잔액</p>
                <p className="text-2xl font-black text-amber-400">{(foundUser.stella || 0).toLocaleString()} ⭐</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">지급량</label>
                <input
                  type="number" min={1} value={stellaAmount}
                  onChange={e => setStellaAmount(Number(e.target.value))}
                  className="w-full p-3 bg-slate-800 text-slate-100 border border-slate-600 rounded-xl text-sm font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">사유 (선택)</label>
                <input
                  type="text" placeholder="예: 이벤트 보상" value={stellaNote}
                  onChange={e => setStellaNote(e.target.value)}
                  className="w-full p-3 bg-slate-800 text-slate-100 border border-slate-600 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              {[30, 100, 400, 900, 2000].map(n => (
                <button key={n} onClick={() => setStellaAmount(n)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    stellaAmount === n ? "bg-amber-500 text-slate-900" : "bg-slate-700 text-slate-300"
                  }`}>
                  +{n}
                </button>
              ))}
            </div>

            <button onClick={handleGrantStella} disabled={isGranting}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-black transition disabled:opacity-50">
              {isGranting ? "처리 중..." : `⭐ ${stellaAmount.toLocaleString()} 스텔라 지급하기`}
            </button>
          </div>
        )}
      </div>

      {/* 지급 로그 */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h3 className="font-bold text-slate-300 mb-4">최근 지급 내역 ({grantLog.length}건)</h3>
        {grantLog.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">지급 내역이 없습니다.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {grantLog.map(log => (
              <div key={log.id} className="flex items-center justify-between bg-slate-900 px-4 py-3 rounded-xl text-sm">
                <div>
                  <span className="font-bold text-slate-200">{log.targetName || log.targetEmail}</span>
                  <span className="text-slate-500 text-xs ml-2">{log.note}</span>
                </div>
                <div className="text-right">
                  <span className="text-amber-400 font-black">+{log.amount} ⭐</span>
                  <p className="text-slate-500 text-xs">
                    {log.createdAt?.toDate?.()?.toLocaleDateString("ko-KR") || ""}
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
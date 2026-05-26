"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  collection, addDoc, serverTimestamp, getDocs,
  deleteDoc, doc, query, orderBy, where, runTransaction, getDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

// ─────────────────────────────────────────────
// 탭 타입
// ─────────────────────────────────────────────
type Tab = "generator" | "stella";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("generator");

  // ── 콘텐츠 생성 탭 상태 ──
  const [keyword, setKeyword] = useState("");
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState<"short" | "long">("short");
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [publishedPosts, setPublishedPosts] = useState<any[]>([]);

  // ── 스텔라 지급 탭 상태 ──
  const [searchEmail, setSearchEmail] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [stellaAmount, setStellaAmount] = useState(100);
  const [stellaNote, setStellaNote] = useState("");
  const [isGranting, setIsGranting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [grantLog, setGrantLog] = useState<any[]>([]);

  // ── 초기 로드 ──
  useEffect(() => {
    fetchPosts();
    fetchGrantLog();
  }, []);

  // ─────────────────────────────────────────────
  // 콘텐츠 생성 함수들
  // ─────────────────────────────────────────────
  const fetchPosts = async () => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    setPublishedPosts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const handleGenerate = async () => {
    if (!keyword) return alert("키워드를 입력해주세요.");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, type: contentType }),
      });
      const json = await res.json();
      if (json.success) setResults(json.data.contents);
      else alert("오류: " + json.error);
    } catch {
      alert("서버 통신 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  const handlePublish = async () => {
    if (!title) return alert("제목을 입력해주세요!");
    if (results.length === 0) return alert("생성된 콘텐츠가 없습니다.");
    setIsSaving(true);
    try {
      await addDoc(collection(db, "posts"), {
        title, keyword, type: contentType, contents: results,
        createdAt: serverTimestamp(),
      });
      alert("🔥 성공적으로 발행되었습니다!");
      setTitle("");
      setResults([]);
      fetchPosts();
    } catch {
      alert("DB 저장 중 오류가 발생했습니다.");
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteDoc(doc(db, "posts", id));
      fetchPosts();
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // ─────────────────────────────────────────────
  // 스텔라 지급 함수들
  // ─────────────────────────────────────────────

  // 지급 로그 불러오기
  const fetchGrantLog = async () => {
    const q = query(collection(db, "stella_grants"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setGrantLog(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  // 이메일로 유저 검색
  const handleSearchUser = async () => {
    if (!searchEmail.trim()) return alert("이메일을 입력해주세요.");
    setIsSearching(true);
    setFoundUser(null);
    try {
      // ✅ where 쿼리로 특정 이메일만 조회 (전체 컬렉션 읽기 방지 + 보안 규칙 통과)
      const q = query(
        collection(db, "users"),
        where("email", "==", searchEmail.trim().toLowerCase())
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        setFoundUser({ id: d.id, ...d.data() });
      } else {
        alert("해당 이메일로 가입된 유저를 찾을 수 없습니다.\n\n※ 이메일이 정확한지, 해당 유저가 실제로 로그인한 적 있는지 확인해주세요.");
      }
    } catch (err: any) {
      console.error("유저 검색 오류:", err);
      alert("검색 오류: " + err.message);
    }
    setIsSearching(false);
  };

  // 스텔라 지급 (Firestore 트랜잭션)
  const handleGrantStella = async () => {
    if (!foundUser) return alert("유저를 먼저 검색해주세요.");
    if (stellaAmount <= 0) return alert("지급량은 1 이상이어야 합니다.");
    if (!confirm(`${foundUser.displayName || foundUser.email}님에게 ${stellaAmount} 스텔라를 지급하시겠습니까?`)) return;

    setIsGranting(true);
    try {
      const userRef = doc(db, "users", foundUser.id);

      await runTransaction(db, async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("유저 문서가 존재하지 않습니다.");

        const currentStella = userSnap.data().stella || 0;
        const newStella = currentStella + stellaAmount;

        // 1. 유저 잔액 업데이트
        transaction.update(userRef, { stella: newStella });

        // 2. 지급 로그 기록 (별도 컬렉션)
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
      // 검색된 유저 정보 즉시 갱신
      const refreshed = await getDoc(userRef);
      setFoundUser({ id: refreshed.id, ...refreshed.data() });
      setStellaNote("");
      fetchGrantLog();
    } catch (err: any) {
      alert("지급 실패: " + err.message);
    }
    setIsGranting(false);
  };

  // ─────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-slate-100">관리자 대시보드</h2>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg transition"
        >
          🏠 홈으로
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 p-1 bg-slate-900 rounded-xl w-max border border-slate-700 mb-8">
        <button
          onClick={() => setActiveTab("generator")}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === "generator" ? "bg-indigo-600 text-white" : "text-slate-400"
          }`}
        >
          ✍️ 콘텐츠 생성
        </button>
        <button
          onClick={() => setActiveTab("stella")}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === "stella" ? "bg-amber-500 text-white" : "text-slate-400"
          }`}
        >
          ⭐ 스텔라 관리
        </button>
      </div>

      {/* ── 콘텐츠 생성 탭 ── */}
      {activeTab === "generator" && (
        <>
          <div className="flex flex-col gap-4 mb-8 bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <div className="flex gap-2 p-1 bg-slate-900 rounded-xl w-max border border-slate-700">
              <button
                onClick={() => setContentType("short")}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  contentType === "short" ? "bg-indigo-600 text-white" : "text-slate-400"
                }`}
              >
                ⚡ 쇼츠 대본용
              </button>
              <button
                onClick={() => setContentType("long")}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                  contentType === "long" ? "bg-emerald-600 text-white" : "text-slate-400"
                }`}
              >
                📚 아티클용
              </button>
            </div>

            <div className="flex gap-4 mt-2">
              <input
                type="text"
                placeholder="주제 키워드"
                className="flex-1 p-4 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`px-8 py-4 rounded-xl font-bold text-white ${
                  contentType === "short" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {loading ? "생성 중..." : "콘텐츠 생성"}
              </button>
            </div>

            {results.length > 0 && (
              <div className="flex gap-4 mt-4 pt-6 border-t border-slate-700">
                <input
                  type="text"
                  placeholder="메인 화면 노출 제목"
                  className="flex-1 p-4 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <button
                  onClick={handlePublish}
                  disabled={isSaving}
                  className="bg-white text-slate-900 px-8 py-4 rounded-xl font-black hover:bg-slate-200"
                >
                  {isSaving ? "저장 중..." : "🚀 라이브 발행"}
                </button>
              </div>
            )}
          </div>

          <div className="mb-12">
            <h3 className="text-lg font-bold text-slate-300 mb-4">
              발행된 게시물 ({publishedPosts.length}개)
            </h3>
            <div className="space-y-3">
              {publishedPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700"
                >
                  <span className="font-medium text-slate-200">{post.title}</span>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>

          {results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((item, idx) => (
                <div key={idx} className="border border-slate-700 rounded-2xl p-6 bg-slate-800">
                  <h3 className="text-xl font-black mb-4 text-indigo-400">{item.mbti}</h3>
                  <div className="h-48 overflow-y-auto bg-slate-900 p-4 rounded-xl border border-slate-700 text-slate-200 text-sm">
                    {item.script}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── 스텔라 관리 탭 ── */}
      {activeTab === "stella" && (
        <div className="space-y-8">
          {/* 유저 검색 & 지급 패널 */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-lg font-bold text-amber-400 mb-6">⭐ 스텔라 직접 지급</h3>

            {/* 이메일 검색 */}
            <div className="flex gap-3 mb-6">
              <input
                type="email"
                placeholder="유저 이메일로 검색"
                className="flex-1 p-3 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl text-sm"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchUser()}
              />
              <button
                onClick={handleSearchUser}
                disabled={isSearching}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl text-sm font-bold transition"
              >
                {isSearching ? "검색 중..." : "검색"}
              </button>
            </div>

            {/* 검색된 유저 정보 */}
            {foundUser && (
              <div className="bg-slate-900 rounded-xl p-5 border border-amber-500/30 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-black text-slate-900">
                    {(foundUser.displayName || foundUser.email)?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-100">{foundUser.displayName || "이름 없음"}</p>
                    <p className="text-xs text-slate-400">{foundUser.email}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-slate-400">현재 잔액</p>
                    <p className="text-2xl font-black text-amber-400">
                      {(foundUser.stella || 0).toLocaleString()}
                      <span className="text-sm ml-1">⭐</span>
                    </p>
                  </div>
                </div>

                {/* 지급 설정 */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">지급량 (스텔라)</label>
                    <input
                      type="number"
                      min={1}
                      value={stellaAmount}
                      onChange={(e) => setStellaAmount(Number(e.target.value))}
                      className="w-full p-3 bg-slate-800 text-slate-100 border border-slate-600 rounded-xl text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block">지급 사유 (선택)</label>
                    <input
                      type="text"
                      placeholder="예: 이벤트 보상"
                      value={stellaNote}
                      onChange={(e) => setStellaNote(e.target.value)}
                      className="w-full p-3 bg-slate-800 text-slate-100 border border-slate-600 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* 빠른 지급 버튼 */}
                <div className="flex gap-2 mb-4">
                  {[30, 100, 150, 400, 900].map((n) => (
                    <button
                      key={n}
                      onClick={() => setStellaAmount(n)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        stellaAmount === n
                          ? "bg-amber-500 text-slate-900"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      +{n}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleGrantStella}
                  disabled={isGranting}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-black transition disabled:opacity-50"
                >
                  {isGranting
                    ? "처리 중..."
                    : `⭐ ${stellaAmount.toLocaleString()} 스텔라 지급하기`}
                </button>
              </div>
            )}
          </div>

          {/* 지급 로그 */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-lg font-bold text-slate-300 mb-4">
              최근 지급 내역 ({grantLog.length}건)
            </h3>
            {grantLog.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">지급 내역이 없습니다.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {grantLog.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between bg-slate-900 px-4 py-3 rounded-xl text-sm"
                  >
                    <div>
                      <span className="font-bold text-slate-200">
                        {log.targetName || log.targetEmail}
                      </span>
                      <span className="text-slate-500 text-xs ml-2">{log.note}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-amber-400 font-black">+{log.amount} ⭐</span>
                      <p className="text-slate-500 text-xs">
                        {log.createdAt?.toDate
                          ? log.createdAt.toDate().toLocaleDateString("ko-KR")
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
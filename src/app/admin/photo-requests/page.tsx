"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useRouter } from "next/navigation";

type FilterStatus = "pending" | "approved" | "rejected" | "all";

const CHARACTER_NAMES: Record<string, string> = {
  ENFJ: "지우", ENFP: "하람", ENTJ: "준혁", ENTP: "도현",
  ESFJ: "수현", ESFP: "예린", ESTJ: "민준", ESTP: "재원",
  INFJ: "서아", INFP: "윤아", INTJ: "현우", INTP: "태양",
  ISFJ: "다은", ISFP: "민서", ISTJ: "성호", ISTP: "강혁",
};

export default function PhotoRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("pending");

  // 선택된 요청 처리 상태
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ── 실시간 요청 목록 구독 ──
  useEffect(() => {
    const col = collection(db, "photo_requests");
    const q =
      filter === "all"
        ? query(col, orderBy("createdAt", "desc"))
        : query(col, where("status", "==", filter), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribe();
  }, [filter]);

  const handleProcess = async (requestId: string, action: "approve" | "reject") => {
    if (action === "approve" && !imageUrl.trim()) {
      alert("승인 시 이미지 URL을 입력해주세요.");
      return;
    }

    if (!confirm(action === "approve" ? "승인하시겠습니까?" : "거절하시겠습니까? 스텔라가 환불됩니다.")) return;

    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/photo-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action,
          imageUrl: action === "approve" ? imageUrl.trim() : undefined,
          adminMessage: adminMessage.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message);
        setSelectedId(null);
        setImageUrl("");
        setAdminMessage("");
      } else {
        alert("처리 실패: " + data.error);
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    }
    setIsProcessing(false);
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-100">사진 요청 승인 센터</h2>
          {pendingCount > 0 && (
            <span className="text-xs text-amber-400 font-bold">
              ⚠️ 대기 중인 요청 {pendingCount}건
            </span>
          )}
        </div>
        <button
          onClick={() => router.push("/admin")}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg transition"
        >
          ← 콘텐츠 생성
        </button>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 p-1 bg-slate-900 rounded-xl w-max border border-slate-700 mb-6">
        {(["pending", "approved", "rejected", "all"] as FilterStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              filter === f
                ? f === "pending" ? "bg-amber-500 text-slate-900"
                : f === "approved" ? "bg-emerald-600 text-white"
                : f === "rejected" ? "bg-red-600 text-white"
                : "bg-slate-600 text-white"
                : "text-slate-400"
            }`}
          >
            {f === "pending" ? `⏳ 대기` : f === "approved" ? "✅ 승인" : f === "rejected" ? "❌ 거절" : "전체"}
          </button>
        ))}
      </div>

      {/* 요청 목록 */}
      {requests.length === 0 ? (
        <div className="text-center py-20 text-slate-500 bg-slate-800 rounded-2xl border border-slate-700">
          해당 상태의 요청이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className={`bg-slate-800 rounded-2xl border p-5 transition ${
                selectedId === req.id ? "border-indigo-500" : "border-slate-700"
              }`}
            >
              {/* 요청 정보 */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-indigo-900 text-indigo-300 text-xs font-black px-2 py-1 rounded-lg">
                      {req.characterId} {CHARACTER_NAMES[req.characterId] || ""}
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      req.status === "pending" ? "bg-amber-900 text-amber-300"
                      : req.status === "approved" ? "bg-emerald-900 text-emerald-300"
                      : "bg-red-900 text-red-300"
                    }`}>
                      {req.status === "pending" ? "⏳ 대기" : req.status === "approved" ? "✅ 승인" : "❌ 거절"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {req.createdAt?.toDate?.().toLocaleString("ko-KR") || ""}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm bg-slate-900 rounded-xl px-4 py-3 leading-relaxed">
                    {req.requestText}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">유저 ID: {req.userId}</p>
                </div>

                {/* 승인된 경우 이미지 미리보기 */}
                {req.status === "approved" && req.imageUrl && (
                  <img
                    src={req.imageUrl}
                    alt="승인된 이미지"
                    className="w-20 h-20 object-cover rounded-xl border border-slate-600 flex-shrink-0"
                  />
                )}
              </div>

              {/* 대기 중인 요청만 처리 패널 표시 */}
              {req.status === "pending" && (
                <>
                  {selectedId === req.id ? (
                    <div className="border-t border-slate-700 pt-4 space-y-3">
                      <input
                        type="url"
                        placeholder="이미지 URL 입력 (Firebase Storage, Imgur 등)"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full p-3 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl text-sm"
                      />
                      <input
                        type="text"
                        placeholder="캐릭터 메시지 (선택) — 비워두면 자동 생성"
                        value={adminMessage}
                        onChange={(e) => setAdminMessage(e.target.value)}
                        className="w-full p-3 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl text-sm"
                      />
                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt="미리보기"
                          className="w-32 h-32 object-cover rounded-xl border border-slate-600"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleProcess(req.id, "approve")}
                          disabled={isProcessing || !imageUrl.trim()}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition disabled:opacity-40"
                        >
                          {isProcessing ? "처리 중..." : "✅ 승인 및 전송"}
                        </button>
                        <button
                          onClick={() => handleProcess(req.id, "reject")}
                          disabled={isProcessing}
                          className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition disabled:opacity-40"
                        >
                          {isProcessing ? "처리 중..." : "❌ 거절 (스텔라 환불)"}
                        </button>
                        <button
                          onClick={() => setSelectedId(null)}
                          className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm transition"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedId(req.id)}
                      className="w-full py-2.5 bg-indigo-900 hover:bg-indigo-800 text-indigo-300 rounded-xl font-bold text-sm transition border border-indigo-700"
                    >
                      처리하기 →
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
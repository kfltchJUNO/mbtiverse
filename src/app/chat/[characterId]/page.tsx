"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  collection, doc, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, getDoc, getDocs, setDoc, where, limit,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuthGuard } from "../../../hooks/useAuthGuard";
import { CHARACTERS } from "../../../lib/characters";

// ─────────────────────────────────────────────
// 캐릭터 메타데이터 → characters.ts에서 직접 참조
// ─────────────────────────────────────────────

interface Message {
  id?: string;
  role: "user" | "assistant";
  type: "text" | "image";
  content: string;
  imageUrl?: string;
  createdAt?: any;
}

// 받침 유무에 따른 조사 반환
const withJosa = (name: string, josa: "와/과" | "이/가" | "을/를" | "은/는") => {
  if (!name) return name;
  const last = name.charCodeAt(name.length - 1);
  const hasBatchim = (last - 0xAC00) % 28 !== 0;
  const map: Record<string, [string, string]> = {
    "와/과": ["과", "와"],
    "이/가": ["이", "가"],
    "을/를": ["을", "를"],
    "은/는": ["은", "는"],
  };
  return name + (hasBatchim ? map[josa][0] : map[josa][1]);
};

const FREE_DAILY_MESSAGES = 10; // 전체 통합 10회/일 // 하루 무료 메시지 수

export default function ChatPage({ params }: { params: { characterId: string } }) {
  const router = useRouter();
  const { user, profile, loading, isAdmin } = useAuthGuard();
  const characterId = params.characterId.toUpperCase();
  const character = CHARACTERS[characterId];

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [dailyCount, setDailyCount] = useState(0);
  const [totalMsgCount, setTotalMsgCount] = useState(0);
  const [userGender, setUserGender] = useState<'male'|'female'|''>('');
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [prevSummary, setPrevSummary] = useState('');
  const [isSavingSummary, setIsSavingSummary] = useState(false);
  const [showFarewellModal, setShowFarewellModal] = useState(false);
  const [showNoStellaModal, setShowNoStellaModal] = useState(false);
  const [farewellMessage, setFarewellMessage] = useState('');
  const [pendingPhoto, setPendingPhoto] = useState<{ imageUrl: string; caption: string; id: string } | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoModalUrl, setPhotoModalUrl] = useState('');

  // 사진 요청 모달 상태
  const [showPhotoRequestModal, setShowPhotoRequestModal] = useState(false);
  const [photoRequest, setPhotoRequest] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const roomId = user ? `${user.uid}_${characterId}` : null;

  // ── 로그인 체크 ──
  useEffect(() => {
    if (!loading && !user) {
      alert("로그인이 필요한 서비스입니다.");
      router.push("/");
    }
  }, [loading, user, router]);

  // ── 채팅 메시지 실시간 구독 ──
  useEffect(() => {
    if (!roomId) return;

    const messagesRef = collection(db, "chat_rooms", roomId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Message[];
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [roomId]);

  // ── 오늘 대화 수 로드 (전체 통합) ──
  useEffect(() => {
    if (!user) return;
    const key = `chat_daily_${user.uid}_${new Date().toDateString()}`;
    setDailyCount(Number(localStorage.getItem(key) || "0"));
  }, [user]);

  // ── 스크롤 자동 이동 ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getFreeSlotsLeft = () => Math.max(0, FREE_DAILY_MESSAGES - dailyCount);
  const stellaPerMessage = 2;

  const canSend = () => {
    if (isAdmin) return true; // 어드민 무제한
    if (getFreeSlotsLeft() > 0) return true;
    return (profile?.stella || 0) >= stellaPerMessage;
  };


  // ── 자동 사진 트리거 체크 — 조건 충족 시 "사진 보기" 버튼 노출
  const checkAutoPhoto = async (msgCount: number) => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "auto_photos", characterId, "items"),
        where("isActive", "==", true),
        where("triggerCount", "<=", msgCount),
        orderBy("triggerCount", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return;

      const photoDoc = snap.docs[0];
      const autoPhoto = photoDoc.data();

      // 이미 이 사진을 열어봤으면 스킵
      const seenKey = `auto_photo_seen_${characterId}_${photoDoc.id}`;
      if (localStorage.getItem(seenKey)) return;

      // 버튼 노출 (채팅 메시지 X)
      setPendingPhoto({
        imageUrl: autoPhoto.imageUrl,
        caption: autoPhoto.caption || "",
        id: photoDoc.id,
      });
    } catch (err) {
      console.error("자동 사진 트리거 오류:", err);
    }
  };

  // ── 메시지 전송 ──
  const handleSend = async () => {
    if (!input.trim() || isSending || !user || !roomId) return;
    if (!canSend()) {
      // 무료 소진 → 스텔라로 차감
      if ((profile?.stella || 0) < stellaPerMessage) {
        setShowNoStellaModal(true);
        return;
      }
      // 스텔라 차감
      try {
        const { doc: fsDoc, updateDoc, increment } = await import('firebase/firestore');
        await updateDoc(fsDoc(db, 'users', user.uid), {
          stella: increment(-stellaPerMessage),
        });
      } catch (e) {
        console.error('스텔라 차감 실패:', e);
        return;
      }
    }

    const userMessage: Message = {
      role: "user",
      type: "text",
      content: input.trim(),
    };

    setInput("");
    setIsSending(true);

    // Firestore에 유저 메시지 저장
    await addDoc(collection(db, "chat_rooms", roomId, "messages"), {
      ...userMessage,
      createdAt: serverTimestamp(),
    });

    // 일일 카운트 업데이트
    const todayKey = `chat_daily_${user?.uid}_${new Date().toDateString()}`; // 전체 통합
    const newCount = dailyCount + 1;
    setDailyCount(newCount);
    localStorage.setItem(todayKey, String(newCount));
    const newTotal = totalMsgCount + 1;
    setTotalMsgCount(newTotal);
    // 자동 사진 트리거 체크
    setTimeout(() => checkAutoPhoto(newTotal), 2000);
    // 캐릭터 통계 업데이트 (랭킹용)
    try {
      const { doc: fsDoc, setDoc, increment, serverTimestamp } = await import('firebase/firestore');
      const statsRef = fsDoc(db, 'character_stats', characterId.toUpperCase());
      await setDoc(statsRef, {
        messageCount: increment(1),
        lastChatAt: serverTimestamp(),
      }, { merge: true });
    } catch {}

    try {
      // 최근 10개 메시지만 컨텍스트로 전송 (토큰 절약)
      const contextMessages = [
        ...messages.slice(-9).map((m) => ({
          role: m.role,
          content: m.type === "image" ? "[이미지]" : m.content,
        })),
        { role: "user", content: userMessage.content },
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId,
          messages: contextMessages,
          userId: user.uid,
          userGender,
          prevSummary,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Firestore에 AI 응답 저장
        await addDoc(collection(db, "chat_rooms", roomId, "messages"), {
          role: "assistant",
          type: "text",
          content: data.reply,
          characterId,
          createdAt: serverTimestamp(),
        });

        // [FAREWELL] 감지 → 종료 모달 표시
        if (data.isFarewell) {
          setFarewellMessage(data.reply);
          setShowFarewellModal(true);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      await addDoc(collection(db, "chat_rooms", roomId, "messages"), {
        role: "assistant",
        type: "text",
        content: "잠깐, 지금 연결이 좀 불안정해. 조금 있다가 다시 말해줄게.",
        characterId,
        createdAt: serverTimestamp(),
      });
    }

    setIsSending(false);
  };

  // ── 사진 요청 ──
  const handlePhotoRequest = async () => {
    if (!photoRequest.trim() || !user) return;
    if (!isAdmin && (profile?.stella || 0) < 50) {
      alert("사진 요청에는 50 스텔라가 필요합니다. 스텔라를 충전해주세요.");
      return;
    }

    setIsRequesting(true);
    try {
      const res = await fetch("/api/photo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          characterId,
          requestText: photoRequest.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        // 채팅방에 요청 안내 메시지 추가
        if (roomId) {
          await addDoc(collection(db, "chat_rooms", roomId, "messages"), {
            role: "assistant",
            type: "text",
            content: (() => {
              const gender = character?.gender;
              const isFormal = ['도윤','태오'].includes(character?.name || '');
              if (isFormal) {
                return `음... 갑자기 사진을요? 🤔 뭐, 별로 안 어색한 장면이면 나중에 생각해볼게요. 기대는 하지 마세요.`;
              }
              if (gender === 'male') {
                return `사진? 갑자기 왜 😏 뭐... 딱히 싫진 않으니까. 타이밍 봐서 보내줄게.`;
              }
              return `사진이요? 흠, 분위기 괜찮으면 생각해볼게 😊 기다려봐요~`;
            })(),
            characterId,
            createdAt: serverTimestamp(),
          });
        }
        setPhotoRequest("");
        setShowPhotoRequestModal(false);
        // 채팅 메시지로 대체됨
      } else {
        alert("요청 실패: " + data.error);
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    }
    setIsRequesting(false);
  };

  // ── 로딩/없는 캐릭터 처리 ──
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">존재하지 않는 캐릭터입니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-800 font-bold text-lg">
          ←
        </button>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 ${character?.gradient}`}>
          {character?.emoji}
        </div>
        <div>
          <h1 className={`font-black text-base ${character?.accentColor}`}>
            {character?.name} <span className="text-xs text-slate-400 font-normal">{characterId}</span>
          </h1>
          <p className="text-xs text-slate-400">
            {isAdmin ? "👑 관리자 모드 · 무제한" : `무료 ${getFreeSlotsLeft()}/${FREE_DAILY_MESSAGES}회 남음 · 잔액 ${profile?.stella || 0}✦`}
          </p>
        </div>

        {/* 사진 요청 버튼 */}
        <button
          onClick={() => setShowPhotoRequestModal(true)}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
        >
          📸 <span>사진 요청</span>
          <span className="bg-indigo-500 rounded-md px-1.5 py-0.5 text-[10px] flex items-center gap-0.5"><img src="/stella.png" className="w-3 h-3 inline" />50</span>
        </button>
      </header>

      {/* ── 메시지 영역 ── */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
        {messages.length === 0 && (
          <div className={`text-center p-8 rounded-2xl border ${character?.gradient} mt-8`}>
            <div className="text-4xl mb-3">{character?.emoji}</div>
            <p className={`font-black text-lg ${character?.accentColor}`}>{withJosa(character?.name ?? '', '와/과')} 대화를 시작해보세요!</p>
            <p className="text-xs text-slate-500 mt-2">
              매일 {FREE_DAILY_MESSAGES}회 무료
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={msg.id || idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mr-2 border ${character?.gradient} flex-shrink-0`}>
                {character?.emoji}
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-sm"
                  : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"
              }`}
            >
              {msg.type === "image" && msg.imageUrl ? (
                <div>
                  <div
                    className="relative rounded-xl overflow-hidden mb-2 border border-slate-100 select-none"
                    style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                    onContextMenu={e => e.preventDefault()}
                  >
                    <img
                      src={msg.imageUrl}
                      alt="캐릭터 사진"
                      className="w-full block pointer-events-none"
                      draggable={false}
                      onContextMenu={e => e.preventDefault()}
                      style={{ WebkitTouchCallout: 'none' }}
                    />
                    {/* 투명 오버레이 — 길게누르기/드래그 방지 */}
                    <div className="absolute inset-0" onContextMenu={e=>e.preventDefault()} />
                  </div>
                  {msg.content && <p>{msg.content}</p>}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mr-2 border ${character?.gradient}`}>
              {character?.emoji}
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      {/* ── 대화 종료 확인 모달 ── */}
      {showFarewellModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 mb-4">
            <div className="text-center mb-5">
              <p className="text-3xl mb-2">💬</p>
              <p className="font-black text-slate-800 text-base mb-2">대화를 마칠까요?</p>
              {farewellMessage && (
                <p className="text-slate-500 text-sm leading-relaxed">
                  &ldquo;{farewellMessage}&rdquo;
                </p>
              )}
              <p className="text-slate-400 text-xs mt-2">
                대화 내용이 저장되어 다음에 이어서 대화할 수 있어요.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFarewellModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition"
              >
                계속 대화하기
              </button>
              <button
                onClick={async () => {
                  setShowFarewellModal(false);
                  if (user && messages.length > 2) {
                    try {
                      const recentMsgs = messages.slice(-20).map(m =>
                        `${m.role === 'user' ? '나' : character?.name}: ${m.content}`
                      ).join('\n');
                      const summaryRes = await fetch('/api/summarize', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ conversation: recentMsgs, characterId }),
                      });
                      const summaryData = await summaryRes.json();
                      if (summaryData.summary) {
                        const { setDoc, doc: fsDoc } = await import('firebase/firestore');
                        await setDoc(fsDoc(db, 'chat_summaries', `${user.uid}_${characterId}`), {
                          summary: summaryData.summary,
                          updatedAt: new Date(),
                        });
                      }
                    } catch {}
                  }
                  router.push('/chat');
                }}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition"
              >
                종료 & 저장 💾
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ── 스텔라 부족 모달 ── */}
      {showNoStellaModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 mb-4">
            <div className="text-center mb-5">
              <img src="/stella.png" className="w-12 h-12 mx-auto mb-3" alt="stella" />
              <p className="font-black text-slate-800 text-base mb-1">스텔라가 부족해요</p>
              <p className="text-slate-500 text-sm">
                무료 대화 {FREE_DAILY_MESSAGES}회를 모두 사용했어요.<br/>
                추가 대화는 회당 <span className="font-bold text-amber-500">{stellaPerMessage} 스텔라</span>가 필요해요.
              </p>
              <div className="mt-3 flex items-center justify-center gap-1.5 bg-slate-50 rounded-xl py-2 px-4">
                <img src="/stella.png" className="w-4 h-4" alt="stella" />
                <span className="text-slate-500 text-sm">현재 잔액:</span>
                <span className="font-black text-amber-500">{profile?.stella ?? 0}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNoStellaModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm transition"
              >
                닫기
              </button>
              <a
                href="/stella"
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-sm text-center transition"
              >
                ✨ 충전하기
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── 자동 사진 알림 버튼 ── */}
      {pendingPhoto && (
        <div className="sticky bottom-[72px] z-30 flex justify-center px-4 pointer-events-none">
          <button
            className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full shadow-lg font-bold text-sm animate-bounce"
            onClick={() => {
              setPhotoModalUrl(pendingPhoto.imageUrl);
              setShowPhotoModal(true);
              // 열어봤다고 표시
              localStorage.setItem(`auto_photo_seen_${characterId}_${pendingPhoto.id}`, "1");
              setPendingPhoto(null);
            }}
          >
            📸 {character?.name}이(가) 사진을 보냈어요!
          </button>
        </div>
      )}

      {/* ── 사진 모달 ── */}
      {showPhotoModal && photoModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center"
          onClick={() => setShowPhotoRequestModal(false)}
        >
          {/* 닫기 */}
          <button className="absolute top-5 right-5 text-white text-2xl font-bold z-10">✕</button>

          {/* 사진 — 하단 일부 잘림 효과 (제미나이 생성 암시) */}
          <div
            className="relative w-full max-w-sm mx-4 select-none"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            onContextMenu={e => e.preventDefault()}
            onClick={e => e.stopPropagation()}
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl"
              style={{ maxHeight: '72vh' }}>
              <img
                src={photoModalUrl}
                alt="캐릭터 사진"
                className="w-full object-cover block pointer-events-none"
                draggable={false}
                onContextMenu={e => e.preventDefault()}
                style={{ WebkitTouchCallout: 'none' }}
              />
              {/* 하단 그라데이션 페이드 아웃 */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
              {/* 하단 텍스트 */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <p className="text-white/80 text-xs">✨ AI가 상상한 {character?.name}의 모습이에요</p>
              </div>
            </div>
            {/* 투명 드래그 방지 오버레이 */}
            <div className="absolute inset-0 rounded-3xl" onContextMenu={e => e.preventDefault()} />
          </div>

          <p className="text-white/50 text-xs mt-4">화면을 탭하면 닫혀요</p>
        </div>
      )}

      {/* ── 입력 영역 ── */}
      <footer className="sticky bottom-0 bg-white border-t border-slate-200 p-3 max-w-2xl mx-auto w-full">
        {!isAdmin && !canSend() && (
          <div className="text-center text-xs text-amber-600 font-bold mb-2 bg-amber-50 rounded-lg p-2">
            오늘 무료 대화를 모두 사용했습니다. 스텔라를 충전해주세요.
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={`${character?.name}에게 메시지 보내기...`}
            className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-300"
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            className="relative px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition disabled:opacity-40"
          >
            전송
            {!isAdmin && getFreeSlotsLeft() === 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-500 text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                -{stellaPerMessage}
              </span>
            )}
          </button>
        </div>
      </footer>

      {/* ── 사진 요청 모달 ── */}
      {showPhotoRequestModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-slate-800 text-lg">📸 {character?.name}에게 사진 요청</h3>
              <button onClick={() => setShowPhotoRequestModal(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">×</button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800">
              <p className="font-bold mb-1">💡 사진 요청</p>
              <p className="text-slate-600 text-sm leading-relaxed">
                원하는 장면이나 분위기를 설명해주세요.<br/>
                <span className="text-indigo-600 font-bold">{character?.name}</span>이(가) 직접 확인하고,
                괜찮은 타이밍에 보내줄 거예요 😊
              </p>
              <p className="mt-2 text-xs text-slate-400">
                {isAdmin ? "👑 관리자 무료 요청" : `차감: 50 스텔라 · 잔액: ${profile?.stella || 0}`}
              </p>
            </div>

            <textarea
              value={photoRequest}
              onChange={(e) => setPhotoRequest(e.target.value)}
              placeholder="예: 카페에서 커피를 마시며 창밖을 바라보는 모습. 따뜻하고 아늑한 분위기로..."
              className="w-full h-28 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-300"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowPhotoRequestModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition"
              >
                취소
              </button>
              <button
                onClick={handlePhotoRequest}
                disabled={isRequesting || !photoRequest.trim() || (!isAdmin && (profile?.stella || 0) < 50)}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition disabled:opacity-40"
              >
                {isRequesting ? "요청 중..." : "스텔라 50 차감하고 요청"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
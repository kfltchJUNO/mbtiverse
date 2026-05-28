// src/app/test/[slug]/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuthGuard } from "../../../hooks/useAuthGuard";

// 기본 이미지 (결과 이미지 없을 때 폴백)
const DEFAULT_RESULT_IMAGE = "https://via.placeholder.com/300x300/6366f1/ffffff?text=RESULT";

interface TestData {
  id: string;
  title: string;
  description?: string;
  slug: string;
  questions: {
    id: number;
    text: string;
    options: { text: string; value: string }[];
  }[];
  results: {
    id: string;
    name: string;
    description: string;
    mbti?: string;
    bestMbti?: string;
    oppositeMbti?: string;
    imageUrl?: string;
  }[];
}

export default function CustomTestPage({ params }: { params: { slug: string } }) {
  const [testData, setTestData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<TestData["results"][0] | null>(null);
  const { user } = useAuthGuard();

  useEffect(() => {
    async function loadTest() {
      try {
        const q = query(
          collection(db, "custom_tests"),
          where("slug", "==", params.slug),
          where("isActive", "==", true)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setTestData({ id: snap.docs[0].id, ...snap.docs[0].data() } as TestData);
        }
      } catch (err) {
        console.error("테스트 로드 실패:", err);
      }
      setLoading(false);
    }
    loadTest();
  }, [params.slug]);

  const handleOptionClick = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (!testData) return;

    if (step < testData.questions.length - 1) {
      setStep(step + 1);
    } else {
      // 결과 계산: 가장 많이 선택된 value와 일치하는 result 찾기
      setStep(testData.questions.length); // 로딩 스텝

      setTimeout(async () => {
        const counts: Record<string, number> = {};
        newAnswers.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
        const topValue = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
        const matched = testData.results.find(r => r.id === topValue) || testData.results[0];
        setResult(matched);
        setStep(testData.questions.length + 1);

        // 결과 저장
        if (user) {
          try {
            await addDoc(collection(db, "testHistory"), {
              userId: user.uid,
              testName: testData.title,
              mbti: matched.mbti || matched.id,
              resultName: matched.name,
              createdAt: serverTimestamp(),
            });
          } catch {}
        }
      }, 1800);
    }
  };

  const handleBack = () => {
    if (step > 0 && step <= (testData?.questions.length || 0)) {
      setStep(step - 1);
      setAnswers(prev => prev.slice(0, -1));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-center p-6">
        <div>
          <p className="text-2xl mb-4">😢</p>
          <p className="text-slate-500 mb-4">테스트를 찾을 수 없습니다.</p>
          <Link href="/" className="text-indigo-600 font-bold hover:underline">홈으로 가기</Link>
        </div>
      </div>
    );
  }

  const totalSteps = testData.questions.length;
  const isLoading = step === totalSteps;
  const isResult = step === totalSteps + 1;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center relative overflow-hidden">

        {/* 프로그레스 바 */}
        {step >= 1 && step < totalSteps && (
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
            <div className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
        )}

        {/* 인트로 */}
        {step === 0 && (
          <div className="space-y-8 py-6">
            <div className="space-y-4">
              <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold px-4 py-1.5 rounded-full">
                심리 테스트
              </span>
              <h1 className="text-3xl font-black text-slate-900 leading-tight">{testData.title}</h1>
              {testData.description && (
                <p className="text-slate-500 text-sm">{testData.description}</p>
              )}
            </div>
            <div className="text-7xl py-2">🧠</div>
            <p className="text-slate-400 text-sm">{testData.questions.length}개의 질문</p>
            <button
              onClick={() => setStep(1)}
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition"
            >
              테스트 시작하기
            </button>
          </div>
        )}

        {/* 질문 */}
        {step >= 1 && step <= totalSteps && !isLoading && (
          <div className="space-y-8 py-6">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <button onClick={handleBack} className="text-sm font-bold text-slate-400 hover:text-slate-800 px-2 py-1">
                ← 이전
              </button>
              <Link href="/" className="text-sm font-bold text-slate-400 hover:text-red-500 px-2 py-1">
                ✕ 중단
              </Link>
            </div>
            <div className="space-y-4">
              <span className="text-sm font-bold text-indigo-500">Q {step} / {totalSteps}</span>
              <h2 className="text-2xl font-black text-slate-800 leading-snug">
                {testData.questions[step - 1].text}
              </h2>
            </div>
            <div className="space-y-4">
              {testData.questions[step - 1].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleOptionClick(opt.value)}
                  className="w-full bg-slate-50 text-slate-700 p-5 rounded-2xl font-medium text-base text-left border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-800 transition"
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 로딩 */}
        {isLoading && (
          <div className="space-y-8 py-16 flex flex-col items-center justify-center">
            <div className="w-20 h-20 border-8 border-slate-100 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-2xl font-black text-slate-800 mt-6">결과 분석 중...</p>
          </div>
        )}

        {/* 결과 */}
        {isResult && result && (
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <span className="text-sm font-bold text-indigo-600">당신의 유형은?</span>
              <h1 className="text-3xl font-black text-slate-900">{result.name}</h1>
              {result.mbti && (
                <span className="inline-block bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-sm font-bold">
                  {result.mbti}
                </span>
              )}
            </div>

            {/* 결과 이미지 - 없으면 기본 이모지 표시 */}
            <div className="w-48 h-48 mx-auto rounded-2xl overflow-hidden border-4 border-slate-100 shadow-inner flex items-center justify-center bg-indigo-50">
              {result.imageUrl ? (
                <img
                  src={result.imageUrl}
                  alt={result.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                    (e.currentTarget.nextSibling as HTMLElement).style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full items-center justify-center text-6xl ${result.imageUrl ? "hidden" : "flex"}`}
              >
                🎯
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-left">
              <p className="text-slate-700 leading-relaxed break-keep">{result.description}</p>
            </div>

            {/* 궁합 표시 */}
            {(result.bestMbti || result.oppositeMbti) && (
              <div className="grid grid-cols-2 gap-3">
                {result.bestMbti && (
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-left">
                    <p className="text-xs font-black text-emerald-600 mb-1">💚 잘 맞는 유형</p>
                    <p className="font-black text-emerald-800 text-base">{result.bestMbti}</p>
                  </div>
                )}
                {result.oppositeMbti && (
                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-left">
                    <p className="text-xs font-black text-red-500 mb-1">🔴 반대 유형</p>
                    <p className="font-black text-red-800 text-base">{result.oppositeMbti}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => { setStep(0); setAnswers([]); setResult(null); }}
                className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-900 transition"
              >
                다시하기
              </button>
              <Link href="/" className="w-full bg-slate-100 text-slate-800 py-4 rounded-xl font-bold hover:bg-slate-200 transition block">
                메인으로
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuthGuard } from "../../../hooks/useAuthGuard";

const results: Record<string, { item: string; desc: string; img: string }> = {
  ENFJ: { item: "무한 공감 홀로그램", desc: "주변을 따뜻하게 비추는 당신! 모두의 마음을 읽는 최고의 비서입니다.", img: "/assets/items/enfj.jpg" },
  ENFP: { item: "순간 이동 캡슐", desc: "지루함은 못 참아! 어디든 순식간에 가는 모험가의 필수품.", img: "/assets/items/enfp.jpg" },
  ENTJ: { item: "AI 전략 마스터봇", desc: "원대한 꿈을 논리적으로 완성해 줄 당신의 든든한 파트너.", img: "/assets/items/entj.jpg" },
  ENTP: { item: "아이디어 시뮬레이터", desc: "상상을 현실로 만드는 3D 설계기로 당신의 천재성을 발휘하세요.", img: "/assets/items/entp.jpg" },
  ESFJ: { item: "친화력 증폭기", desc: "어디서든 분위기 메이커! 모두를 내 편으로 만드는 마법 아이템.", img: "/assets/items/esfj.jpg" },
  ESFP: { item: "파티 연출 드론", desc: "당신이 가는 곳마다 파티장으로 변하는 화려한 인생템!", img: "/assets/items/esfp.jpg" },
  ESTJ: { item: "완벽 효율 관리기", desc: "당신의 성취를 빈틈없이 관리해 줄 칼 같은 비서.", img: "/assets/items/estj.jpg" },
  ESTP: { item: "감각 자극 수트", desc: "모든 순간을 짜릿하게 즐기게 해주는 당신만의 액션 기어.", img: "/assets/items/estp.jpg" },
  INFJ: { item: "통찰의 수정구", desc: "깊은 직관을 현실로 연결해 줄 당신을 위한 마법 도구.", img: "/assets/items/infj.jpg" },
  INFP: { item: "감성 조율 오르골", desc: "복잡한 내면을 아름다운 음악으로 바꿔줄 당신의 위로.", img: "/assets/items/infp.jpg" },
  INTJ: { item: "미래 예측 안경", desc: "앞서가는 당신을 위한 최적의 정보 분석 아이웨어.", img: "/assets/items/intj.jpg" },
  INTP: { item: "지식 무한 다운로더", desc: "호기심 끝판왕! 모든 데이터를 즉시 뇌에 저장하는 기기.", img: "/assets/items/intp.jpg" },
  ISFJ: { item: "힐링 케어 봇", desc: "헌신적인 당신의 노력을 돌봐줄 따뜻한 반려봇.", img: "/assets/items/isfj.jpg" },
  ISFP: { item: "평화의 캔버스", desc: "예술적 감각을 즉시 작품으로 그려낼 마법의 도구.", img: "/assets/items/isfp.jpg" },
  ISTJ: { item: "정석 타임라인기", desc: "루틴을 한치의 오차 없이 지켜줄 당신의 성실한 친구.", img: "/assets/items/istj.jpg" },
  ISTP: { item: "멀티 만능 툴킷", desc: "무엇이든 뚝딱 고쳐내는 당신을 위한 궁극의 장비.", img: "/assets/items/istp.jpg" },
};

const questions = [
  { text: "퇴근 후 당신의 에너지는?", options: [{ text: "사람들과 파티/모임", value: "E" }, { text: "조용한 나만의 시간", value: "I" }, { text: "그날 기분대로", value: "P" }] },
  { text: "새로운 과제가 생기면?", options: [{ text: "아이디어부터 짠다", value: "N" }, { text: "절차부터 확인", value: "S" }, { text: "닥쳐서 해결한다", value: "P" }] },
  { text: "친구 고민 상담 시 나는?", options: [{ text: "무조건 공감", value: "F" }, { text: "냉철한 해결책", value: "T" }, { text: "내 생각을 정리", value: "I" }] },
  { text: "여행 계획을 짤 때?", options: [{ text: "분 단위 계획", value: "J" }, { text: "즉흥적 여행", value: "P" }, { text: "예산/안전 우선", value: "S" }] },
  { text: "친구가 늦는다면?", options: [{ text: "불쾌함, 원칙 중시", value: "J" }, { text: "그럴 수 있지", value: "P" }, { text: "사람 구경하며 대기", value: "E" }] },
  { text: "세상의 진리는?", options: [{ text: "추상적 의미", value: "N" }, { text: "눈앞의 현실", value: "S" }, { text: "논리적 팩트", value: "T" }] },
  { text: "인생의 목표는?", options: [{ text: "대외적 성공", value: "E" }, { text: "내면의 성장", value: "I" }, { text: "계획적인 완수", value: "J" }] },
  { text: "감정 표현은 어떻게?", options: [{ text: "솔직한 감정 공유", value: "F" }, { text: "절제된 표현", value: "T" }, { text: "비유적 표현", value: "N" }] },
  { text: "업무 처리 스타일은?", options: [{ text: "체계적인 분배", value: "J" }, { text: "몰아서 처리", value: "P" }, { text: "현실적인 마무리", value: "S" }] },
  { text: "혼자 방에 있을 때?", options: [{ text: "휴식/사색", value: "I" }, { text: "SNS로 소통", value: "E" }, { text: "상상/몽상", value: "N" }] },
];

export default function FutureItemTest() {
  const [step, setStep] = useState(0); // 0: 인트로, 1~10: 질문, 11: 분석중, 12: 결과
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState("");

  const { user } = useAuthGuard();

  const handleBack = () => {
    if (step === 1) {
      setStep(0);
      setAnswers([]);
    } else if (step > 1 && step <= questions.length) {
      setStep(step - 1);
      setAnswers((prev) => prev.slice(0, -1));
    }
  };

  const handleOptionClick = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);
    
    if (step < questions.length) {
      setStep(step + 1);
    } else {
      setStep(questions.length + 1); // 로딩 뷰
      
      setTimeout(async () => {
        const counts: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
        newAnswers.forEach((val) => {
          if (counts[val] !== undefined) counts[val]++;
        });

        const calculatedMBTI = 
          `${counts.E >= counts.I ? "E" : "I"}${counts.S >= counts.N ? "S" : "N"}${counts.T >= counts.F ? "T" : "F"}${counts.J >= counts.P ? "J" : "P"}`;
        
        setResult(calculatedMBTI);
        setStep(questions.length + 2); // 결과 뷰

        if (user) {
          try {
            await addDoc(collection(db, "testHistory"), {
              userId: user.uid,
              testName: "🚀 미래 인생템 테스트",
              mbti: calculatedMBTI,
              resultName: results[calculatedMBTI].item,
              createdAt: serverTimestamp()
            });
          } catch (error) {
            console.error("결과 저장 실패:", error);
          }
        }
      }, 2000);
    }
  };

  const analysisStep = questions.length + 1;
  const resultStep = questions.length + 2;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center relative overflow-hidden">
        
        {/* 상단 프로그레스 바 */}
        {step >= 1 && step <= questions.length && (
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
            <div 
              className="h-full bg-pink-500 transition-all duration-300" 
              style={{ width: `${(step / questions.length) * 100}%` }}
            ></div>
          </div>
        )}

        {/* 0단계: 인트로 */}
        {step === 0 && (
          <div className="space-y-10 py-6">
            <div className="space-y-4">
              <span className="inline-block bg-pink-50 text-pink-700 text-xs font-bold px-4 py-1.5 rounded-full">
                미래 예측 테스트
              </span>
              <h1 className="text-4xl font-black text-slate-900 leading-tight">
                나의 미래<br />인생템은?
              </h1>
              <p className="text-slate-500 max-w-xs mx-auto">
                10가지 질문으로 알아보는<br/>내 성격에 딱 맞는 미래 아이템
              </p>
            </div>
            {/* 기본 썸네일로 enfp 이미지 사용 */}
            <img src="/assets/items/enfp.jpg" alt="미래 아이템" className="w-40 h-40 mx-auto object-cover object-top mask-bottom" />
            <button 
              onClick={() => setStep(1)} 
              className="w-full bg-pink-600 text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-pink-200 hover:bg-pink-700 transition active:scale-[0.98]"
            >
              테스트 시작하기
            </button>
          </div>
        )}

        {/* 질문 단계 */}
        {step >= 1 && step <= questions.length && (
          <div className="space-y-8 py-6">
            {/* 💡 상단 컨트롤 바 (뒤로가기 / 중단) */}
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <button 
                onClick={handleBack} 
                className="text-sm font-bold text-slate-400 hover:text-slate-800 transition px-2 py-1"
              >
                ← 이전
              </button>
              <Link 
                href="/" 
                className="text-sm font-bold text-slate-400 hover:text-red-500 transition px-2 py-1"
              >
                ✕ 중단
              </Link>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-pink-500 font-bold">진행도: {step} / {questions.length}</p>
              <h2 className="text-2xl font-black leading-snug">{questions[step - 1].text}</h2>
            </div>
            
            <div className="space-y-4">
              {questions[step - 1].options.map((opt, i) => (
                <button 
                  key={i} 
                  onClick={() => handleOptionClick(opt.value)} 
                  className="w-full p-6 bg-slate-50 rounded-2xl font-bold text-left border border-slate-100 hover:bg-pink-50 hover:border-pink-200 hover:text-pink-800 transition-all active:scale-[0.98]"
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 로딩 단계 */}
        {step === analysisStep && (
          <div className="space-y-8 py-16 flex flex-col items-center justify-center">
            <div className="w-20 h-20 border-8 border-slate-100 border-t-pink-500 rounded-full animate-spin"></div>
            <p className="text-2xl font-black text-slate-800 mt-6">
              미래 설계도<br/>분석 중...
            </p>
          </div>
        )}

        {/* 결과 단계 */}
        {step === resultStep && result && results[result] && (
          <div className="text-center space-y-6 py-6">
            <h1 className="text-2xl font-black text-slate-800">당신의 미래 인생템은?</h1>
            <div className="w-40 h-40 mx-auto rounded-3xl overflow-hidden border-4 border-slate-50 relative shadow-inner">
               <img 
                 src={results[result].img} 
                 alt={results[result].item}
                 className="w-full h-full object-cover object-top" 
                 style={{ 
                   maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)', 
                   WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' 
                 }} 
               />
            </div>
            <div className="space-y-2">
              <p className="text-pink-900 bg-pink-50 inline-block px-3 py-1 rounded-md text-sm font-bold tracking-wider">{result}</p>
              <h2 className="text-3xl font-black text-pink-600">{results[result].item}</h2>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left">
              <p className="text-slate-700 break-keep leading-relaxed font-medium">
                {results[result].desc}
              </p>
            </div>
            
            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
              <button 
                onClick={() => window.location.reload()} 
                className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold hover:bg-slate-900 transition active:scale-[0.98]"
              >
                다시 하기
              </button>
              <Link 
                href="/" 
                className="w-full bg-slate-100 text-slate-800 py-4 rounded-xl font-bold hover:bg-slate-200 transition active:scale-[0.98]"
              >
                메인으로 가기
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
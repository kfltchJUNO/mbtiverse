"use client";

import { useState } from "react";
import Link from "next/link";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuthGuard } from "../../../hooks/useAuthGuard";

const results: Record<string, { item: string; desc: string; img: string }> = {
  ENFJ: { item: "무한 공감 홀로그램", desc: "주변을 따뜻하게 비추는 당신! 모두의 마음을 읽는 최고의 비서입니다.", img: "/assets/items/enfj.png" },
  ENFP: { item: "순간 이동 캡슐", desc: "지루함은 못 참아! 어디든 순식간에 가는 모험가의 필수품.", img: "/assets/items/enfp.png" },
  ENTJ: { item: "AI 전략 마스터봇", desc: "원대한 꿈을 논리적으로 완성해 줄 당신의 든든한 파트너.", img: "/assets/items/entj.png" },
  ENTP: { item: "아이디어 시뮬레이터", desc: "상상을 현실로 만드는 3D 설계기로 당신의 천재성을 발휘하세요.", img: "/assets/items/entp.png" },
  ESFJ: { item: "친화력 증폭기", desc: "어디서든 분위기 메이커! 모두를 내 편으로 만드는 마법 아이템.", img: "/assets/items/esfj.png" },
  ESFP: { item: "파티 연출 드론", desc: "당신이 가는 곳마다 파티장으로 변하는 화려한 인생템!", img: "/assets/items/esfp.png" },
  ESTJ: { item: "완벽 효율 관리기", desc: "당신의 성취를 빈틈없이 관리해 줄 칼 같은 비서.", img: "/assets/items/estj.png" },
  ESTP: { item: "감각 자극 수트", desc: "모든 순간을 짜릿하게 즐기게 해주는 당신만의 액션 기어.", img: "/assets/items/estp.png" },
  INFJ: { item: "통찰의 수정구", desc: "깊은 직관을 현실로 연결해 줄 당신을 위한 마법 도구.", img: "/assets/items/infj.png" },
  INFP: { item: "감성 조율 오르골", desc: "복잡한 내면을 아름다운 음악으로 바꿔줄 당신의 위로.", img: "/assets/items/infp.png" },
  INTJ: { item: "미래 예측 안경", desc: "앞서가는 당신을 위한 최적의 정보 분석 아이웨어.", img: "/assets/items/intj.png" },
  INTP: { item: "지식 무한 다운로더", desc: "호기심 끝판왕! 모든 데이터를 즉시 뇌에 저장하는 기기.", img: "/assets/items/intp.png" },
  ISFJ: { item: "힐링 케어 봇", desc: "헌신적인 당신의 노력을 돌봐줄 따뜻한 반려봇.", img: "/assets/items/isfj.png" },
  ISFP: { item: "평화의 캔버스", desc: "예술적 감각을 즉시 작품으로 그려낼 마법의 도구.", img: "/assets/items/isfp.png" },
  ISTJ: { item: "정석 타임라인기", desc: "루틴을 한치의 오차 없이 지켜줄 당신의 성실한 친구.", img: "/assets/items/istj.png" },
  ISTP: { item: "멀티 만능 툴킷", desc: "무엇이든 뚝딱 고쳐내는 당신을 위한 궁극의 장비.", img: "/assets/items/istp.png" },
};

const questions = [
  { text: "퇴근 후 당신의 에너지는?", options: [{ text: "사람들과 파티/모임(E)", value: "E" }, { text: "조용한 나만의 시간(I)", value: "I" }, { text: "그날 기분대로(P)", value: "P" }] },
  { text: "새로운 과제가 생기면?", options: [{ text: "아이디어부터 짠다(N)", value: "N" }, { text: "절차부터 확인(S)", value: "S" }, { text: "닥쳐서 해결한다(P)", value: "P" }] },
  { text: "친구 고민 상담 시 나는?", options: [{ text: "무조건 공감(F)", value: "F" }, { text: "냉철한 해결책(T)", value: "T" }, { text: "내 생각을 정리(I)", value: "I" }] },
  { text: "여행 계획을 짤 때?", options: [{ text: "분 단위 계획(J)", value: "J" }, { text: "즉흥적 여행(P)", value: "P" }, { text: "예산/안전 우선(S)", value: "S" }] },
  { text: "친구가 늦는다면?", options: [{ text: "불쾌함, 원칙 중시(J)", value: "J" }, { text: "그럴 수 있지(P)", value: "P" }, { text: "사람 구경하며 대기(E)", value: "E" }] },
  { text: "세상의 진리는?", options: [{ text: "추상적 의미(N)", value: "N" }, { text: "눈앞의 현실(S)", value: "S" }, { text: "논리적 팩트(T)", value: "T" }] },
  { text: "인생의 목표는?", options: [{ text: "대외적 성공(E)", value: "E" }, { text: "내면의 성장(I)", value: "I" }, { text: "계획적인 완수(J)", value: "J" }] },
  { text: "감정 표현은 어떻게?", options: [{ text: "솔직한 감정 공유(F)", value: "F" }, { text: "절제된 표현(T)", value: "T" }, { text: "비유적 표현(N)", value: "N" }] },
  { text: "업무 처리 스타일은?", options: [{ text: "체계적인 분배(J)", value: "J" }, { text: "몰아서 처리(P)", value: "P" }, { text: "현실적인 마무리(S)", value: "S" }] },
  { text: "혼자 방에 있을 때?", options: [{ text: "휴식/사색(I)", value: "I" }, { text: "SNS로 소통(E)", value: "E" }, { text: "상상/몽상(N)", value: "N" }] },
];

export default function FutureItemTest() {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
  const [result, setResult] = useState("");

  const { user } = useAuthGuard();

  const handleOptionClick = async (value: string) => {
    const nextScores = { ...scores, [value]: scores[value as keyof typeof scores] + 1 };
    setScores(nextScores);
    
    if (step < 9) {
      setStep(step + 1);
    } else {
      const { E, I, S, N, T, F, J, P } = nextScores;
      const calculatedMBTI = `${E >= I ? "E" : "I"}${S >= N ? "S" : "N"}${T >= F ? "T" : "F"}${J >= P ? "J" : "P"}`;
      setResult(calculatedMBTI);
      setStep(10);

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
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white min-h-screen">
      {step < 10 ? (
        <div className="space-y-6 mt-10">
          <p className="text-sm text-indigo-500 font-bold">진행도: {step + 1} / 10</p>
          <h2 className="text-2xl font-black">{questions[step].text}</h2>
          {questions[step].options.map((opt, i) => (
            <button 
              key={i} 
              onClick={() => handleOptionClick(opt.value)} 
              className="w-full p-6 bg-slate-50 rounded-2xl font-bold text-left border-2 hover:border-indigo-500 transition-all"
            >
              {opt.text}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center mt-10 space-y-6">
          <h1 className="text-2xl font-black">당신의 미래 인생템은?</h1>
          <div className="w-40 h-40 mx-auto rounded-3xl overflow-hidden border-4 relative">
             <img 
               src={results[result as keyof typeof results]?.img} 
               className="w-full h-full object-cover object-top" 
               style={{ 
                 maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)', 
                 WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' 
               }} 
             />
          </div>
          <h2 className="text-3xl font-black text-indigo-600">{results[result as keyof typeof results]?.item}</h2>
          <p className="text-slate-600 break-keep">{results[result as keyof typeof results]?.desc}</p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold hover:bg-slate-900 transition"
            >
              다시 하기
            </button>
            <Link 
              href="/" 
              className="w-full bg-slate-100 text-slate-800 py-4 rounded-xl font-bold hover:bg-slate-200 transition"
            >
              메인으로 가기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
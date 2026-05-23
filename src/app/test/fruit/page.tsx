"use client";

import { useState } from "react";
import Link from "next/link";

// 🍎 1. 결과 데이터 (16가지 MBTI 상세 데이터)
const results: Record<string, { fruit: string; desc: string; emoji: string; partner: string; enemy: string; img: string }> = {
  ENFJ: { fruit: "따뜻한 오렌지", desc: "주변을 밝히는 햇살 같은 에너지의 소유자!", emoji: "🍊", partner: "INFP", enemy: "ISTP", img: "/assets/fruits/오렌지.png" },
  ENFP: { fruit: "톡톡 튀는 레몬", desc: "상큼하고 에너지가 넘치는 인간 비타민!", emoji: "🍋", partner: "INTJ", enemy: "ISTJ", img: "/assets/fruits/레몬.png" },
  ENTJ: { fruit: "알찬 석류", desc: "존재감이 확실하고 리더십이 뛰어난 당신!", emoji: "🍎", partner: "INFP", enemy: "ISFP", img: "/assets/fruits/석류.png" },
  ENTP: { fruit: "패션후르츠", desc: "아이디어로 가득한 예측 불가 매력의 소유자!", emoji: "🥝", partner: "INFJ", enemy: "ISFJ", img: "/assets/fruits/패션후르츠.png" },
  ESFJ: { fruit: "국민 과일 사과", desc: "누구와도 잘 어울리는 호불호 없는 성격!", emoji: "🍏", partner: "ISFP", enemy: "INTP", img: "/assets/fruits/사과.png" },
  ESFP: { fruit: "달콤한 파인애플", desc: "어디서든 파티의 주인공이 되는 화려한 사람!", emoji: "🍍", partner: "ISFJ", enemy: "INTJ", img: "/assets/fruits/파인애플.png" },
  ESTJ: { fruit: "단단한 코코넛", desc: "원칙을 중요시하는 든든한 일꾼 스타일!", emoji: "🥥", partner: "INFP", enemy: "INFP", img: "/assets/fruits/코코넛.png" },
  ESTP: { fruit: "강렬한 체리", desc: "스릴을 즐기는 멈출 수 없는 행동파!", emoji: "🍒", partner: "ISFJ", enemy: "INFJ", img: "/assets/fruits/체리.png" },
  INFJ: { fruit: "외유내강 무화과", desc: "깊고 단단한 내면을 가진 통찰력의 대가!", emoji: "🍑", partner: "ENFP", enemy: "ESTP", img: "/assets/fruits/무화과.png" },
  INFP: { fruit: "몽환적인 블루베리", desc: "감수성이 풍부하고 부드러운 영혼의 소유자!", emoji: "🫐", partner: "ENFJ", enemy: "ESTJ", img: "/assets/fruits/블루베리.png" },
  INTJ: { fruit: "시크한 블랙베리", desc: "완벽주의적인 달콤함을 숨긴 지적인 사람!", emoji: "🍇", partner: "ENFP", enemy: "ESFP", img: "/assets/fruits/블랙베리.png" },
  INTP: { fruit: "독특한 용과", desc: "알아갈수록 매력적인 독보적 세계관!", emoji: "🐉", partner: "ENTJ", enemy: "ESFJ", img: "/assets/fruits/용과.png" },
  ISFJ: { fruit: "포근한 복숭아", desc: "배려심 넘치는 포근함으로 주변을 녹여요.", emoji: "🍑", partner: "ESFP", enemy: "ENTP", img: "/assets/fruits/복숭아.png" },
  ISFP: { fruit: "달콤한 귤", desc: "온화하고 편안한 분위기를 만드는 평화주의자!", emoji: "🍊", partner: "ESFJ", enemy: "ENTJ", img: "/assets/fruits/귤.png" },
  ISTJ: { fruit: "정석의 수박", desc: "규칙적이고 속이 시원한 정석의 인간형!", emoji: "🍉", partner: "ESTP", enemy: "ENFP", img: "/assets/fruits/수박.png" },
  ISTP: { fruit: "시크한 청포도", desc: "쿨하고 산뜻한 매력의 마이웨이 스타일!", emoji: "🍇", partner: "ESTJ", enemy: "ENFJ", img: "/assets/fruits/청포도.png" },
};

// 🍎 2. 질문 데이터
const questions = [
  { text: "주말에 나는?", options: [{ text: "친구들과 핫플 가기", value: "E" }, { text: "집에서 혼자 쉬기", value: "I" }] },
  { text: "대화할 때 나는?", options: [{ text: "먼저 주도한다", value: "E" }, { text: "듣는 편이다", value: "I" }] },
  { text: "스트레스 풀 때는?", options: [{ text: "수다 떨며 풀기", value: "E" }, { text: "혼자 멍때리기", value: "I" }] },
  { text: "멍때릴 때 생각은?", options: [{ text: "점심 뭐 먹지?", value: "S" }, { text: "우주의 끝은 어디일까?", value: "N" }] },
  { text: "요리할 때 나는?", options: [{ text: "레시피를 지킨다", value: "S" }, { text: "내 감을 믿는다", value: "N" }] },
  { text: "노래 들을 때?", options: [{ text: "멜로디가 중요하다", value: "S" }, { text: "가사 의미가 좋다", value: "N" }] },
  { text: "친구가 우울하다면?", options: [{ text: "무슨 일인지 물어본다", value: "F" }, { text: "해결책을 생각한다", value: "T" }] },
  { text: "고민 상담할 때 나는?", options: [{ text: "공감과 위로를 준다", value: "F" }, { text: "팩트 체크를 한다", value: "T" }] },
  { text: "'특이하다'는 말에?", options: [{ text: "살짝 신경 쓰인다", value: "F" }, { text: "이유가 궁금하다", value: "T" }] },
  { text: "여행 갈 때 계획은?", options: [{ text: "시간별로 짠다", value: "J" }, { text: "가서 생각한다", value: "P" }] },
  { text: "내 책상은?", options: [{ text: "항상 깔끔하다", value: "J" }, { text: "질서 있는 어지러움", value: "P" }] },
  { text: "장 볼 때 나는?", options: [{ text: "메모대로 산다", value: "J" }, { text: "눈에 띄는 걸 산다", value: "P" }] },
];

export default function FruitTest() {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
  const [mbtiResult, setMbtiResult] = useState("");

  const handleOptionClick = (value: string) => {
    setScores((prev) => ({ ...prev, [value]: prev[value as keyof typeof prev] + 1 }));
    if (step < 12) setStep(step + 1);
    else {
      setStep(13);
      setTimeout(() => {
        const { E, I, S, N, T, F, J, P } = scores;
        setMbtiResult(`${E > I ? "E" : "I"}${S > N ? "S" : "N"}${T > F ? "T" : "F"}${J > P ? "J" : "P"}`);
        setStep(14);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        {step === 0 && (
          <div className="space-y-6">
            <h1 className="text-3xl font-black">내 성격이 과일이라면?</h1>
            <button onClick={() => setStep(1)} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold">테스트 시작</button>
          </div>
        )}
        {step >= 1 && step <= 12 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{questions[step - 1].text}</h2>
            {questions[step - 1].options.map((opt, i) => (
              <button key={i} onClick={() => handleOptionClick(opt.value)} className="w-full bg-slate-100 p-4 rounded-xl">{opt.text}</button>
            ))}
          </div>
        )}
        {step === 13 && <p className="text-xl font-bold">분석 중...</p>}
        {step === 14 && (
          <div className="space-y-6">
            <div className="w-40 h-40 mx-auto overflow-hidden rounded-full">
              <img src={results[mbtiResult].img} className="w-full h-full object-cover object-top" />
            </div>
            <h1 className="text-3xl font-black">{results[mbtiResult].fruit}</h1>
            <p className="text-slate-600">{results[mbtiResult].desc}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded-xl"><p className="text-[10px] font-bold text-green-600">짝꿍</p><p className="font-bold">{results[mbtiResult].partner}</p></div>
              <div className="bg-red-50 p-3 rounded-xl"><p className="text-[10px] font-bold text-red-600">최악</p><p className="font-bold">{results[mbtiResult].enemy}</p></div>
            </div>
            <button onClick={() => window.location.reload()} className="w-full bg-slate-800 text-white py-4 rounded-xl">다시하기</button>
          </div>
        )}
      </div>
    </div>
  );
}
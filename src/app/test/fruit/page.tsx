"use client";

import { useState } from "react";
import Link from "next/link";

// 🍎 1. 질문 데이터 (12문항)
const questions = [
  { id: 1, type: "E/I", text: "주말에 쉬는 날, 나는?", options: [{ text: "친구들과 핫플 투어 가기 🏃‍♂️", value: "E" }, { text: "집에서 넷플릭스 정주행 🛌", value: "I" }] },
  { id: 2, type: "E/I", text: "처음 보는 사람과 대화할 때 나는?", options: [{ text: "먼저 말 걸고 분위기 주도 🗣️", value: "E" }, { text: "말 걸어줄 때까지 기다림 🤫", value: "I" }] },
  { id: 3, type: "E/I", text: "스트레스 받을 때 푸는 방법은?", options: [{ text: "사람들과 수다 떨며 풀기 🍻", value: "E" }, { text: "혼자만의 시간 가지며 멍때리기 🎧", value: "I" }] },
  { id: 4, type: "S/N", text: "멍 때릴 때 나는?", options: [{ text: "오늘 점심 뭐 먹지? (현실적) 🍚", value: "S" }, { text: "우주에 끝이 있을까? (상상력) 👽", value: "N" }] },
  { id: 5, type: "S/N", text: "요리할 때 나는?", options: [{ text: "레시피 정량대로 정확하게 ⚖️", value: "S" }, { text: "내 감을 믿고 대충 팍팍 🧂", value: "N" }] },
  { id: 6, type: "S/N", text: "노래 들을 때 더 신경 쓰는 것은?", options: [{ text: "멜로디와 가수 목소리 🎵", value: "S" }, { text: "가사의 숨은 의미와 감성 📝", value: "N" }] },
  { id: 7, type: "T/F", text: "친구가 '나 우울해서 화분 샀어'라고 한다면?", options: [{ text: "무슨 화분 샀어? 물은 얼마나 줘? 🪴", value: "T" }, { text: "왜 우울해? 무슨 일 있었어? ㅠㅠ 🥺", value: "F" }] },
  { id: 8, type: "T/F", text: "고민 상담을 할 때 나는?", options: [{ text: "팩트 기반의 해결책 제시 💡", value: "T" }, { text: "무한 공감과 위로 🫂", value: "F" }] },
  { id: 9, type: "T/F", text: "'너 진짜 특이하다'라는 말을 들었을 때?", options: [{ text: "(내가 왜? 어디가?) 이유가 궁금함 🤔", value: "T" }, { text: "(내가 이상한가..?) 살짝 신경 쓰임 🥲", value: "F" }] },
  { id: 10, type: "J/P", text: "여행 가기 전날 나는?", options: [{ text: "시간 단위 계획표 완성! 🗓️", value: "J" }, { text: "대충 숙소만 예약, 나머진 가서 생각 🧳", value: "P" }] },
  { id: 11, type: "J/P", text: "내 방 책상 상태는?", options: [{ text: "물건들이 제자리에 각 잡혀 있음 ✨", value: "J" }, { text: "뭔가 많지만 나름의 질서가 있음 🌪️", value: "P" }] },
  { id: 12, type: "J/P", text: "마트에서 장을 볼 때?", options: [{ text: "메모해 둔 것만 딱딱 산다 🛒", value: "J" }, { text: "오, 세일하네? 구경하다 이것저것 담는다 🛍️", value: "P" }] },
];

// 🍎 2. 결과 데이터 (16가지 MBTI 매칭)
const results: Record<string, { fruit: string; desc: string; emoji: string }> = {
  ENFJ: { fruit: "따뜻한 오렌지", desc: "주변을 밝혀주는 따뜻한 햇살 같은 에너지를 가졌어요.", emoji: "🍊" },
  ENFP: { fruit: "톡톡 튀는 레몬", desc: "상큼하고 에너지가 넘치는 인간 비타민 그 자체예요.", emoji: "🍋" },
  ENTJ: { fruit: "알찬 석류", desc: "속이 꽉 찬 과즙처럼 존재감이 확실하고 리더십이 뛰어나요.", emoji: "🍎" },
  ENTP: { fruit: "패션후르츠", desc: "새콤달콤 톡톡 튀는 아이디어로 가득한 예측 불가 매력의 소유자!", emoji: "🥝" },
  ESFJ: { fruit: "국민 과일 사과", desc: "친근하고 둥글둥글해서 누구와도 잘 어울리는 호불호 없는 성격이에요.", emoji: "🍏" },
  ESFP: { fruit: "달콤한 파인애플", desc: "화려하고 존재감이 넘쳐서 어디서든 파티의 주인공이 됩니다.", emoji: "🍍" },
  ESTJ: { fruit: "단단한 코코넛", desc: "겉은 단단하고 속은 알찬, 원칙을 중요시하는 든든한 사람이에요.", emoji: "🥥" },
  ESTP: { fruit: "강렬한 체리", desc: "에너지가 넘치고 멈출 수 없는 스릴을 즐기는 행동파입니다.", emoji: "🍒" },
  INFJ: { fruit: "외유내강 무화과", desc: "부드러운 겉모습 속에 깊고 단단한 내면을 감추고 있어요.", emoji: "🍑" },
  INFP: { fruit: "몽환적인 블루베리", desc: "감수성이 풍부하고 부드러운 맛을 가졌지만 겉모습이 쉽게 멍들기도 해요.", emoji: "🫐" },
  INTJ: { fruit: "시크한 블랙베리", desc: "차갑고 도도해 보이지만 알고 보면 완벽주의적인 달콤함이 있어요.", emoji: "🍇" },
  INTP: { fruit: "독특한 용과", desc: "겉도 속도 평범하지 않아요. 알아갈수록 신기하고 매력적인 세계관을 가졌습니다.", emoji: "🐉" },
  ISFJ: { fruit: "포근한 복숭아", desc: "따뜻하고 부드러워 주변 사람들에게 배려심 넘치는 포근함을 줍니다.", emoji: "🍑" },
  ISFP: { fruit: "달콤한 귤", desc: "이불 속에서 까먹는 귤처럼 온화하고 누워서 뒹굴뒹굴하는 걸 좋아해요.", emoji: "🍊" },
  ISTJ: { fruit: "정석의 수박", desc: "줄무늬가 규칙적인 것처럼 정석대로 행동하며, 겪어보면 속이 시원한 사람이에요.", emoji: "🍉" },
  ISTP: { fruit: "시크한 청포도", desc: "쿨하고 산뜻하지만, 껍질을 까거나 씨를 뱉는 등 귀찮은 일은 딱 질색해요.", emoji: "🍇" },
};

export default function FruitTest() {
  const [step, setStep] = useState(0); // 0: 시작, 1~12: 질문, 13: 로딩, 14: 결과
  const [scores, setScores] = useState({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
  const [mbtiResult, setMbtiResult] = useState("");

  // 선택지 클릭 핸들러
  const handleOptionClick = (value: string) => {
    setScores((prev) => ({ ...prev, [value]: prev[value as keyof typeof prev] + 1 }));
    
    if (step < 12) {
      setStep(step + 1);
    } else {
      calculateResult();
    }
  };

  // 결과 계산 핸들러
  const calculateResult = () => {
    setStep(13); // 로딩 화면 진입
    setTimeout(() => {
      const { E, I, S, N, T, F, J, P } = scores;
      const result = `${E > I ? "E" : "I"}${S > N ? "S" : "N"}${T > F ? "T" : "F"}${J > P ? "J" : "P"}`;
      setMbtiResult(result);
      setStep(14); // 결과 화면 진입
    }, 2000); // 2초간 로딩
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-800">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden min-h-[500px] flex flex-col relative">
        
        {/* 시작 화면 */}
        {step === 0 && (
          <div className="p-8 flex flex-col items-center justify-center h-full text-center flex-1">
            <div className="text-7xl mb-6">🍎</div>
            <h1 className="text-3xl font-black mb-4">내 성격이<br />과일이라면?</h1>
            <p className="text-slate-500 mb-8 font-medium">12개의 질문으로 알아보는<br />나의 찰떡 과일 유형</p>
            <button 
              onClick={() => setStep(1)}
              className="w-full bg-indigo-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
            >
              테스트 시작하기
            </button>
          </div>
        )}

        {/* 질문 화면 (1~12) */}
        {step > 0 && step <= 12 && (
          <div className="p-8 flex flex-col h-full flex-1">
            {/* 진행률 바 */}
            <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${(step / 12) * 100}%` }}
              ></div>
            </div>
            
            <div className="text-center mb-8">
              <span className="text-indigo-600 font-bold text-sm">Q {step}.</span>
              <h2 className="text-2xl font-bold mt-2 break-keep">{questions[step - 1].text}</h2>
            </div>

            <div className="mt-auto space-y-4">
              {questions[step - 1].options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(option.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl text-left font-medium text-slate-700 hover:border-indigo-600 hover:bg-indigo-50 transition-all"
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 분석 중(로딩) 화면 - 중간 광고 배치하기 좋은 영역 */}
        {step === 13 && (
          <div className="p-8 flex flex-col items-center justify-center h-full text-center flex-1 animate-pulse">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-xl font-bold text-slate-700">당신의 과일을 수확하는 중...</h2>
            <p className="text-slate-400 mt-2 text-sm">잠시만 기다려주세요</p>
          </div>
        )}

        {/* 결과 화면 */}
        {step === 14 && mbtiResult && (
          <div className="p-8 flex flex-col items-center text-center h-full flex-1 animate-fade-in-up">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">{mbtiResult}</span>
            <div className="text-8xl mb-4">{results[mbtiResult].emoji}</div>
            <h1 className="text-3xl font-black text-slate-800 mb-4">{results[mbtiResult].fruit}</h1>
            <p className="text-slate-600 font-medium bg-slate-50 p-6 rounded-2xl break-keep leading-relaxed mb-8">
              {results[mbtiResult].desc}
            </p>
            
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-900 transition-colors mb-3"
            >
              다시 하기
            </button>
            <Link href="/" className="w-full bg-slate-100 text-slate-600 font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors block">
              다른 썰 보러가기
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
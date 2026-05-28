// src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CHARACTERS } from "../../../lib/characters";

// ── 다중 API 키 (Vercel 환경변수에 GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3 추가)
const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean) as string[];

// ── 모델 우선순위
const MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

// ── 지수 백오프 sleep
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── API 키 + 모델 조합으로 순차 시도
async function tryGenerate(
  systemPrompt: string,
  history: any[],
  userMessage: string
): Promise<string> {
  const attempts: { key: string; model: string }[] = [];

  // 모든 키 × 모든 모델 조합 생성 (키 우선)
  for (const key of API_KEYS) {
    for (const model of MODELS) {
      attempts.push({ key, model });
    }
  }

  let lastError = "";

  for (let i = 0; i < attempts.length; i++) {
    const { key, model } = attempts[i];
    try {
      const genAI = new GoogleGenerativeAI(key);
      const genModel = genAI.getGenerativeModel({
        model,
        systemInstruction: systemPrompt,
      });
      const chat = genModel.startChat({ history });
      const result = await chat.sendMessage(userMessage);
      const text = result.response.text();
      if (!text) throw new Error("빈 응답");
      console.log(`✅ 성공: key#${API_KEYS.indexOf(key)+1} / ${model}`);
      return text;
    } catch (err: any) {
      lastError = err.message;
      console.warn(`⚠️ 실패: key#${API_KEYS.indexOf(key)+1} / ${model} — ${err.message}`);

      // 429 Rate Limit이면 잠깐 대기 후 다음 시도
      if (err.message?.includes("429") || err.message?.includes("quota")) {
        const wait = Math.min(1000 * (i + 1), 4000);
        console.log(`⏳ ${wait}ms 대기 후 재시도...`);
        await sleep(wait);
      }
      continue;
    }
  }

  throw new Error("모든 API 키/모델 실패: " + lastError);
}

export async function POST(req: Request) {
  try {
    const { characterId, messages, userId, userGender, prevSummary } = await req.json();

    if (!characterId || !messages || !userId) {
      return NextResponse.json({ success: false, error: "필수 파라미터가 없습니다." }, { status: 400 });
    }

    if (API_KEYS.length === 0) {
      return NextResponse.json({ success: false, error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }

    const character = CHARACTERS[characterId.toUpperCase()];
    if (!character) {
      return NextResponse.json({ success: false, error: "알 수 없는 캐릭터입니다." }, { status: 400 });
    }

    // ── 컨텍스트 조합
    const genderCtx = userGender
      ? `\n\n[상대방 정보]\n성별: ${userGender === "female" ? "여성" : userGender === "male" ? "남성" : "미설정"}`
      : "";
    const summaryCtx = prevSummary
      ? `\n\n[이전 대화 요약]\n${prevSummary}\n\n이 내용을 기억하고 자연스럽게 이어서 대화해.`
      : "";
    const fullPrompt = character.systemPrompt
      .replace("{userGender}", userGender || "미설정") + genderCtx + summaryCtx;

    // ── 히스토리 (최근 10개)
    const history = messages.slice(0, -1).slice(-9).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.type === "image" ? "[이미지]" : msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const reply = await tryGenerate(fullPrompt, history, lastMessage.content);

    // ── [FAREWELL] 태그 감지
    const isFarewell = reply.startsWith("[FAREWELL]");
    const cleanReply = isFarewell ? reply.replace("[FAREWELL]", "").trim() : reply;

    return NextResponse.json({ success: true, reply: cleanReply, isFarewell });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
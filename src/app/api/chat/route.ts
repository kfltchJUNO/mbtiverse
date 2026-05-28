// src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { CHARACTERS } from "../../../lib/characters";

// ── 다중 API 키
const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean) as string[];

// ── 2026년 5월 기준 유효 모델
const MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function tryGenerate(
  systemPrompt: string,
  history: { role: string; parts: { text: string }[] }[],
  userMessage: string
): Promise<string> {
  const attempts: { key: string; model: string }[] = [];
  for (const key of API_KEYS) {
    for (const model of MODELS) {
      attempts.push({ key, model });
    }
  }

  let lastError = "";

  for (let i = 0; i < attempts.length; i++) {
    const { key, model } = attempts[i];
    try {
      const ai = new GoogleGenAI({ apiKey: key });

      // 히스토리 + 현재 메시지를 contents 배열로 조합
      const contents = [
        ...history.map(h => ({
          role: h.role,
          parts: h.parts,
        })),
        { role: "user", parts: [{ text: userMessage }] },
      ];

      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.9,
          maxOutputTokens: 300,
        },
      });

      const text = response.text;
      if (!text) throw new Error("빈 응답");
      console.log(`✅ key#${API_KEYS.indexOf(key) + 1} / ${model}`);
      return text;
    } catch (err: any) {
      lastError = err.message || String(err);
      console.warn(`⚠️ key#${API_KEYS.indexOf(key) + 1} / ${model}: ${lastError}`);

      if (
        lastError.includes("429") ||
        lastError.includes("quota") ||
        lastError.includes("RESOURCE_EXHAUSTED")
      ) {
        const wait = Math.min(800 * (i + 1), 3000);
        await sleep(wait);
      }
    }
  }

  throw new Error("모든 모델/키 실패: " + lastError);
}

export async function POST(req: Request) {
  try {
    const { characterId, messages, userId, userGender, prevSummary } = await req.json();

    if (!characterId || !messages || !userId) {
      return NextResponse.json(
        { success: false, error: "필수 파라미터가 없습니다." },
        { status: 400 }
      );
    }

    if (API_KEYS.length === 0) {
      return NextResponse.json(
        { success: false, error: "API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const character = CHARACTERS[characterId.toUpperCase()];
    if (!character) {
      return NextResponse.json(
        { success: false, error: "알 수 없는 캐릭터입니다." },
        { status: 400 }
      );
    }

    // 컨텍스트 조합
    const genderLabel =
      userGender === "female" ? "여성" : userGender === "male" ? "남성" : "미설정";
    const genderCtx = userGender
      ? `\n\n[상대방 정보]\n성별: ${genderLabel}`
      : "";
    const summaryCtx = prevSummary
      ? `\n\n[이전 대화 요약]\n${prevSummary}\n\n이 내용을 기억하고 자연스럽게 이어서 대화해.`
      : "";
    const fullPrompt =
      character.systemPrompt.replace("{userGender}", userGender || "미설정") +
      genderCtx +
      summaryCtx;

    // 히스토리 (최근 9개, 마지막 메시지 제외)
    const history = messages
      .slice(0, -1)
      .slice(-9)
      .map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.type === "image" ? "[이미지]" : (msg.content || "") }],
      }));

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.content?.trim()) {
      return NextResponse.json(
        { success: false, error: "메시지 내용이 없습니다." },
        { status: 400 }
      );
    }

    const reply = await tryGenerate(fullPrompt, history, lastMessage.content);

    // [FAREWELL] 태그 처리
    const isFarewell = reply.startsWith("[FAREWELL]");
    const cleanReply = isFarewell ? reply.replace("[FAREWELL]", "").trim() : reply;

    return NextResponse.json({ success: true, reply: cleanReply, isFarewell });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
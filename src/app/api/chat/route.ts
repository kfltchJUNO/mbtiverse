// src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CHARACTERS } from "../../../lib/characters";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// 2026년 5월 기준 실제 사용 가능한 모델 (무료 티어)
const MODELS = [
  "gemini-3.1-flash-lite",  // RPM 15 — 가장 빠름, 1순위
  "gemini-3.5-flash",       // RPM 5  — 고품질, 2순위
  "gemini-2.5-flash",       // RPM 5  — 폴백용, 3순위
];

export async function POST(req: Request) {
  try {
    const { characterId, messages, userId } = await req.json();

    if (!characterId || !messages || !userId) {
      return NextResponse.json({ success: false, error: "필수 파라미터가 없습니다." }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }

    const character = CHARACTERS[characterId.toUpperCase()];
    if (!character) {
      return NextResponse.json({ success: false, error: "알 수 없는 캐릭터입니다." }, { status: 400 });
    }

    const history = messages.slice(0, -1).slice(-9).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.type === "image" ? "[이미지]" : msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    let reply = "";
    let lastError = "";

    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: character.systemPrompt,
        });
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(lastMessage.content);
        reply = result.response.text();
        break;
      } catch (err: any) {
        lastError = err.message;
        console.error(`모델 ${modelName} 실패:`, err.message);
        continue;
      }
    }

    if (!reply) {
      throw new Error("모든 모델 실패: " + lastError);
    }

    return NextResponse.json({ success: true, reply });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
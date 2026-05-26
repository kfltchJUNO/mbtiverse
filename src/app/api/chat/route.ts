import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CHARACTERS } from "../../../lib/characters";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { characterId, messages, userId } = await req.json();

    if (!characterId || !messages || !userId) {
      return NextResponse.json({ success: false, error: "필수 파라미터가 없습니다." }, { status: 400 });
    }

    const character = CHARACTERS[characterId.toUpperCase()];
    if (!character) {
      return NextResponse.json({ success: false, error: "알 수 없는 캐릭터입니다." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
      systemInstruction: character.systemPrompt,
    });

    // 최근 10개 메시지만 히스토리로 전송 (토큰 절약)
    const history = messages.slice(0, -1).slice(-9).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.type === "image" ? "[이미지]" : msg.content }],
    }));

    const chat = model.startChat({ history });
    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const reply = result.response.text();

    return NextResponse.json({ success: true, reply });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
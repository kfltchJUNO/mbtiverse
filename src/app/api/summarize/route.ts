// src/app/api/summarize/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
];

export async function POST(req: Request) {
  try {
    const { conversation, characterId } = await req.json();
    if (!conversation) {
      return NextResponse.json({ success: false, error: "대화 내용이 없습니다." }, { status: 400 });
    }

    const prompt = `아래 대화를 3~5문장으로 핵심만 요약해줘.
다음 대화에서 자연스럽게 이어갈 수 있도록, 
상대방이 말한 중요 정보(이름, 나이, 직업, 취미, 감정, 관심사 등)를 중심으로 요약해.
캐릭터 ID: ${characterId}

대화 내용:
${conversation}

요약 (3~5문장, 한국어):`;

    let summary = "";
    for (const modelName of MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        summary = result.response.text().trim();
        break;
      } catch (err) {
        continue;
      }
    }

    if (!summary) throw new Error("요약 생성 실패");
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
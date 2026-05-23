import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { keyword, type = "short" } = body;

    if (!keyword) {
      return NextResponse.json({ success: false, error: "키워드가 없습니다." }, { status: 400 });
    }

    let styleInstruction = type === "long" 
      ? `[작성 스타일: 아티클용 심층 분석] 각 MBTI별로 최소 600자 이상의 전문적인 심리학적 통찰을 포함한 칼럼을 작성해.` 
      : `[작성 스타일: 쇼츠 대본용] 각 MBTI별로 200자 내외의 재치 있고 빠른 템포의 대본을 작성해.`;

    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    const prompt = `
      너는 MBTI 전문가야. 주제 "${keyword}"에 대해 16가지 MBTI 유형의 반응을 작성해줘.
      ${styleInstruction}
      응답은 반드시 아래 JSON 포맷으로만 해줘. 마크다운 기호는 절대 넣지 마.
      {
        "contents": [
          { "mbti": "ENFJ", "script": "...", "imagePrompt": "..." }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // 💡 정규식 문법 수정 (에러 해결)
    // replace 메서드에 정규식 /```json/g 가 아닌 문자열 기반 replace를 사용하거나 정규식을 정확히 닫아야 합니다.
    const cleanedText = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
      
    const parsedData = JSON.parse(cleanedText);

    return NextResponse.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
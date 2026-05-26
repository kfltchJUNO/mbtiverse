// src/app/api/admin/generate/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// 2025년 기준 실제 사용 가능한 모델 (v1beta API 지원)
const FALLBACK_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-preview-04-17",
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { keyword, type = "short" } = body;

    if (!keyword) {
      return NextResponse.json({ success: false, error: "키워드가 없습니다." }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: "GEMINI_API_KEY 환경변수가 설정되지 않았습니다." }, { status: 500 });
    }

    const styleInstruction = type === "long"
      ? `[작성 스타일: 아티클용 심층 분석] 각 MBTI별로 최소 600자 이상의 전문적인 심리학적 통찰을 포함한 칼럼을 작성해.`
      : `[작성 스타일: 쇼츠 대본용] 각 MBTI별로 200자 내외의 재치 있고 빠른 템포의 대본을 작성해.`;

    const prompt = `
너는 MBTI 전문가야. 주제 "${keyword}"에 대해 16가지 MBTI 유형의 반응을 작성해줘.
${styleInstruction}
응답은 반드시 아래 JSON 포맷으로만 해줘. 마크다운 코드블록이나 다른 기호는 절대 넣지 마. JSON만 반환해.
{"contents":[{"mbti":"ENFJ","script":"...","imagePrompt":"..."}]}
    `.trim();

    let responseText = "";
    let lastError = "";
    let usedModel = "";

    for (const modelName of FALLBACK_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        usedModel = modelName;
        break;
      } catch (err: any) {
        lastError = err.message;
        console.error(`모델 ${modelName} 실패:`, err.message);
        continue;
      }
    }

    if (!responseText) {
      throw new Error(`모든 모델 실패. 마지막 오류: ${lastError}`);
    }

    // JSON 정제
    const cleanedText = responseText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();

    let parsedData;
    try {
      parsedData = JSON.parse(cleanedText);
    } catch {
      const match = cleanedText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("응답에서 JSON을 파싱할 수 없습니다.");
      parsedData = JSON.parse(match[0]);
    }

    console.log(`✅ 생성 성공 (모델: ${usedModel})`);
    return NextResponse.json({ success: true, data: parsedData });

  } catch (error: any) {
    console.error("Generate API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
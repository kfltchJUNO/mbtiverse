import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash"
];

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

    let responseText = "";
    let success = false;

    // 💡 FALLBACK_MODELS를 순회하며 요청 시도
    for (const modelName of FALLBACK_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        success = true;
        break; // 성공하면 루프 종료
      } catch (err) {
        console.error(`모델 ${modelName} 실패, 다음 모델 시도 중...`);
        continue;
      }
    }

    if (!success) {
      throw new Error("모든 모델에서 콘텐츠 생성에 실패했습니다.");
    }

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
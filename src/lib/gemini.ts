import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

// 1. 최신 공식 SDK 초기화
const ai = new GoogleGenAI({ apiKey });

export interface MbtiContent {
  mbti: string;
  script: string;
  imagePrompt: string;
}

export interface GeminiScriptResponse {
  contents: MbtiContent[];
}

// 2. 외부 Type 객체 없이 순수 JSON 스키마 문자열 사용 (에러 원천 차단)
const mbtiResponseSchema = {
  type: "OBJECT",
  properties: {
    contents: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          mbti: { type: "STRING" },
          script: { type: "STRING" },
          imagePrompt: { type: "STRING" },
        },
        required: ["mbti", "script", "imagePrompt"],
      },
    },
  },
  required: ["contents"],
};

export async function generateMbtiScripts(keyword: string): Promise<GeminiScriptResponse> {
  const prompt = `주제 키워드: "${keyword}"\n\n위 키워드 상황에서 발생하는 16가지 MBTI 유형별 반응과 썰을 바탕으로 쇼츠 대본을 작성해줘. 각 유형별 대본에 어울리는 대표 이미지를 Imagen 3로 생성할 수 있도록 정교한 영문 프롬프트도 함께 작성해줘.`;

  // 3. 최신 문법의 generateContent 적용
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: mbtiResponseSchema,
      temperature: 0.7,
    }
  });

  if (!response.text) {
    throw new Error("Gemini 응답이 비어있습니다.");
  }

  return JSON.parse(response.text);
}
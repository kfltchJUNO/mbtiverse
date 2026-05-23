import { GoogleGenAI, Type, Schema } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

const ai = new GoogleGenAI({ apiKey });

export interface MbtiContent {
  mbti: string;
  script: string;
  imagePrompt: string;
}

export interface GeminiScriptResponse {
  contents: MbtiContent[];
}

const mbtiResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    contents: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          mbti: { type: Type.STRING },
          script: { type: Type.STRING },
          imagePrompt: { type: Type.STRING },
        },
        required: ["mbti", "script", "imagePrompt"],
      },
    },
  },
  required: ["contents"],
};

export async function generateMbtiScripts(keyword: string): Promise<GeminiScriptResponse> {
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash", 
    contents: `주제 키워드: "${keyword}"\n\n위 키워드 상황에서 발생하는 16가지 MBTI 유형별 반응과 썰을 바탕으로 쇼츠 대본을 작성해줘. 각 유형별 대본에 어울리는 대표 이미지를 Imagen 3로 생성할 수 있도록 정교한 영문 프롬프트도 함께 작성해줘.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: mbtiResponseSchema,
      temperature: 0.7,
    },
  });
  return JSON.parse(response.text as string);
}
import { GoogleGenAI } from "@google/genai";

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

// 가성비와 속도가 뛰어난 3개의 모델을 우선순위대로 배치
const FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash"
];

export async function generateMbtiScripts(keyword: string): Promise<GeminiScriptResponse> {
  const prompt = `주제 키워드: "${keyword}"\n\n위 키워드 상황에서 발생하는 16가지 MBTI 유형별 반응과 썰을 바탕으로 쇼츠 대본을 작성해줘. 각 유형별 대본에 어울리는 대표 이미지를 Imagen 3로 생성할 수 있도록 정교한 영문 프롬프트도 함께 작성해줘.`;

  let lastError: any = null;

  // 릴레이 호출 로직: 1순위부터 시도하고, 실패하면 다음 모델로 넘어감
  for (const modelName of FALLBACK_MODELS) {
    try {
      console.log(`[Gemini API] ${modelName} 모델로 생성을 시도합니다...`);
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: mbtiResponseSchema,
          temperature: 0.7,
        }
      });

      if (!response.text) {
        throw new Error(`${modelName}의 응답 텍스트가 비어있습니다.`);
      }

      console.log(`[Gemini API] ✅ ${modelName} 모델 생성 성공!`);
      return JSON.parse(response.text);

    } catch (error: any) {
      console.warn(`[Gemini API] ⚠️ ${modelName} 실패. 다음 모델을 준비합니다. (사유: ${error.message})`);
      lastError = error;
      // continue 되어 다음 모델로 넘어감
    }
  }

  // 3개 모델이 전부 실패했을 경우
  throw new Error("현재 AI 모델 서버가 혼잡합니다. 잠시 후 다시 시도해주세요. (상세 에러: " + lastError?.message + ")");
}
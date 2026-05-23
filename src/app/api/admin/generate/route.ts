import { NextResponse } from "next/server";
import { generateMbtiScripts } from "../../../../lib/gemini";

export async function POST(request: Request) {
  try {
    const { keyword } = await request.json();
    if (!keyword) return NextResponse.json({ error: "키워드가 필요합니다." }, { status: 400 });

    const data = await generateMbtiScripts(keyword);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
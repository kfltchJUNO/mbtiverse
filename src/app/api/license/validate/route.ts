// src/app/api/license/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateLicenseKey, saveLicense } from "../../../../lib/firebase";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../../../../lib/firebase";

// Gumroad 패키지별 permalink → 스텔라 매핑
const PACKAGES: Record<string, { stella: number; name: string }> = {
  vbgkvx: { stella: 400,  name: "스타터 400" },
  wbomlk: { stella: 900,  name: "스탠다드 900" },
  sreanm: { stella: 2000, name: "프리미엄 2000" },
  ybjbje: { stella: 4500, name: "VIP 4500" },
};

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, uid } = await req.json();

    if (!licenseKey?.trim() || !uid) {
      return NextResponse.json({ success: false, error: "필수 값이 없습니다." }, { status: 400 });
    }

    const cleanKey = licenseKey.trim().toUpperCase();

    // 1. 이미 사용된 키인지 확인
    const licenseRef = doc(db, "licenses", cleanKey);
    const licenseSnap = await getDoc(licenseRef);
    if (licenseSnap.exists()) {
      const data = licenseSnap.data();
      if (data.uid !== uid) {
        return NextResponse.json({ success: false, error: "이미 다른 계정에서 사용된 키입니다." });
      }
      return NextResponse.json({ success: false, error: "이미 사용한 키입니다." });
    }

    // 2. 모든 패키지에 대해 순서대로 검증 시도
    let matched: { permalink: string; stella: number; name: string } | null = null;

    for (const [permalink, pkg] of Object.entries(PACKAGES)) {
      const result = await validateLicenseKey(cleanKey, permalink);
      if (result.valid) {
        matched = { permalink, ...pkg };
        break;
      }
    }

    if (!matched) {
      return NextResponse.json({ success: false, error: "유효하지 않은 라이선스 키입니다." });
    }

    // 3. 스텔라 충전 + 라이선스 저장
    await saveLicense(uid, cleanKey, matched.stella);

    return NextResponse.json({
      success: true,
      stella: matched.stella,
      packageName: matched.name,
      message: `${matched.name} 스텔라가 충전되었습니다!`,
    });
  } catch (error: any) {
    console.error("License validate error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
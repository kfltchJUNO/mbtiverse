// src/app/api/webhook/gumroad/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import {
  collection, doc, getDoc, setDoc, updateDoc,
  increment, serverTimestamp, query, where, getDocs,
} from "firebase/firestore";

// Gumroad 패키지별 permalink → 스텔라 매핑
const PACKAGES: Record<string, number> = {
  vbgkvx: 400,   // 스타터
  wbomlk: 900,   // 스탠다드
  sreanm: 2000,  // 프리미엄
  ybjbje: 4500,  // VIP
};

export async function POST(req: NextRequest) {
  try {
    // Gumroad는 x-www-form-urlencoded로 전송
    const body = await req.text();
    const params = new URLSearchParams(body);

    const saleId = params.get("sale_id") || "";
    const email = params.get("email") || "";
    const productPermalink = params.get("product_permalink") || "";
    const isTest = params.get("test") === "true";

    console.log("Gumroad ping:", { saleId, email, productPermalink, isTest });

    // 테스트 ping이면 200만 반환
    if (isTest) {
      return NextResponse.json({ success: true, message: "test ping received" });
    }

    // 중복 처리 방지 (같은 sale_id 재처리 차단)
    const saleRef = doc(db, "gumroad_sales", saleId);
    const saleSnap = await getDoc(saleRef);
    if (saleSnap.exists()) {
      console.log("이미 처리된 sale_id:", saleId);
      return NextResponse.json({ success: true, message: "already processed" });
    }

    // 패키지 확인
    const stellaAmount = PACKAGES[productPermalink];
    if (!stellaAmount) {
      console.warn("알 수 없는 permalink:", productPermalink);
      return NextResponse.json({ success: true, message: "unknown product" });
    }

    // 이메일로 유저 찾기
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const userSnap = await getDocs(q);

    if (userSnap.empty) {
      // 유저가 없으면 pending으로 저장 (나중에 로그인 시 지급)
      await setDoc(saleRef, {
        saleId,
        email,
        productPermalink,
        stellaAmount,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      console.log("유저 미발견 - pending 저장:", email);
      return NextResponse.json({ success: true, message: "pending" });
    }

    const userDoc = userSnap.docs[0];
    const uid = userDoc.id;

    // 스텔라 충전
    await updateDoc(doc(db, "users", uid), {
      stella: increment(stellaAmount),
    });

    // 판매 기록 저장
    await setDoc(saleRef, {
      saleId,
      email,
      uid,
      productPermalink,
      stellaAmount,
      status: "completed",
      createdAt: serverTimestamp(),
    });

    console.log(`✅ 스텔라 충전 완료: ${email} +${stellaAmount}`);
    return NextResponse.json({ success: true, stellaAmount });
  } catch (error: any) {
    console.error("Gumroad webhook error:", error);
    // Gumroad는 200이 아니면 재시도하므로 오류도 200 반환
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 200 }
    );
  }
}

// GET 요청도 200 반환 (Gumroad 연결 확인용)
export async function GET() {
  return NextResponse.json({ status: "Gumroad webhook endpoint active" });
}
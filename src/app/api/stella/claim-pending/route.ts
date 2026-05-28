// src/app/api/stella/claim-pending/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/firebase";
import {
  collection, query, where, getDocs,
  doc, updateDoc, increment,
} from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const { uid, email } = await req.json();
    if (!uid || !email) {
      return NextResponse.json({ success: false, error: "필수 파라미터 없음" });
    }

    // pending 판매 조회
    const pendingQ = query(
      collection(db, "gumroad_sales"),
      where("email", "==", email),
      where("status", "==", "pending")
    );
    const pendingSnap = await getDocs(pendingQ);

    if (pendingSnap.empty) {
      return NextResponse.json({ success: true, granted: 0 });
    }

    let totalGranted = 0;
    for (const pendingDoc of pendingSnap.docs) {
      const data = pendingDoc.data();
      // 스텔라 지급
      await updateDoc(doc(db, "users", uid), {
        stella: increment(data.stellaAmount),
      });
      // pending → completed
      await updateDoc(doc(db, "gumroad_sales", pendingDoc.id), {
        status: "completed",
        uid,
      });
      totalGranted += data.stellaAmount;
      console.log(`✅ pending 지급: ${email} +${data.stellaAmount}`);
    }

    return NextResponse.json({ success: true, granted: totalGranted });
  } catch (error: any) {
    console.error("claim-pending error:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
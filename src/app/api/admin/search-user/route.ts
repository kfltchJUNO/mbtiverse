// src/app/api/admin/search-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const ADMIN_EMAIL = "ot.helper7@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const { email, requestEmail } = await req.json();

    // 어드민 검증
    if (requestEmail !== ADMIN_EMAIL) {
      return NextResponse.json({ success: false, error: "권한 없음" }, { status: 403 });
    }

    const q = query(
      collection(db, "users"),
      where("email", "==", email.trim().toLowerCase())
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return NextResponse.json({ success: false, error: "유저를 찾을 수 없습니다." });
    }

    const d = snap.docs[0];
    const data = d.data();
    return NextResponse.json({
      success: true,
      user: {
        id: d.id,
        email: data.email,
        stella: data.stella || 0,
        displayName: data.displayName || "",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
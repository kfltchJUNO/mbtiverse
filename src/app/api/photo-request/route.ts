import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Firebase Admin SDK 초기화 (서버 사이드 트랜잭션용)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const adminDb = getFirestore();

const PHOTO_REQUEST_COST = 50; // 스텔라 차감량

export async function POST(req: Request) {
  try {
    const { userId, characterId, requestText } = await req.json();

    if (!userId || !characterId || !requestText?.trim()) {
      return NextResponse.json(
        { success: false, error: "필수 파라미터가 없습니다." },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection("users").doc(userId);
    const requestRef = adminDb.collection("photo_requests").doc();

    // ─────────────────────────────────────────────
    // Firestore 트랜잭션: 잔액 검증 → Hold 차감 → 요청 문서 생성
    // 두 작업이 원자적으로 처리되어 중간 실패 없음
    // ─────────────────────────────────────────────
    await adminDb.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists) {
        throw new Error("유저를 찾을 수 없습니다.");
      }

      const currentStella = userSnap.data()?.stella || 0;

      if (currentStella < PHOTO_REQUEST_COST) {
        throw new Error(`스텔라가 부족합니다. (현재: ${currentStella}, 필요: ${PHOTO_REQUEST_COST})`);
      }

      // 1. 유저 잔액에서 차감 (Hold 상태 — 아직 소멸 아님)
      transaction.update(userRef, {
        stella: currentStella - PHOTO_REQUEST_COST,
      });

      // 2. 사진 요청 문서 생성 (holdStella에 안전하게 묶어둠)
      transaction.set(requestRef, {
        userId,
        characterId: characterId.toUpperCase(),
        requestText: requestText.trim(),
        holdStella: PHOTO_REQUEST_COST,
        status: "pending", // pending | approved | rejected
        imageUrl: null,
        adminMessage: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({
      success: true,
      requestId: requestRef.id,
      message: `사진 요청이 접수되었습니다. ${PHOTO_REQUEST_COST} 스텔라가 보류 처리되었습니다.`,
    });
  } catch (error: any) {
    console.error("Photo Request Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
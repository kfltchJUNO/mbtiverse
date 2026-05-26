import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

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

// 캐릭터별 거절 메시지 템플릿 (페르소나 유지)
const REJECT_MESSAGES: Record<string, string[]> = {
  ENFJ: ["많이 기대했을 텐데 미안해. 이번엔 어렵겠지만 다음엔 꼭 더 좋은 걸로 보여줄게.", "지금은 조금 어려운 상황이야. 기다려줘서 고마워 💙"],
  ENFP: ["앗!! 미안미안ㅠㅠ 이번엔 좀 힘들 것 같아~ 다음엔 진짜 더 잘해줄게!!", "이런... 지금은 아닌 것 같아😭 대신 다른 거 보내줄게~"],
  ENTJ: ["이번 요청은 처리가 어렵겠어. 재요청 시 더 구체적인 설명을 추가해줘.", "현재 조건으로는 진행이 불가능해. 요청 내용을 조정해서 다시 보내줘."],
  ENTP: ["흠, 이건 좀 까다로운 케이스인데... 다른 방향으로 요청해보는 건 어때?", "논리적으로 검토해봤는데 이번엔 패스. 더 흥미로운 아이디어로 다시 와."],
  ESFJ: ["어머, 미안해~ 이번엔 어떻게 못 할 것 같아ㅠㅠ 다음엔 꼭 챙겨줄게!", "이번엔 좀 힘들 것 같아. 그래도 연락해줘서 고마워! 😊"],
  ESFP: ["아ㅠㅠ 이번엔 안 될 것 같아!! 대신 다음엔 더 멋진 거 보내줄게~💃", "에이구~ 미안해!! 조금만 기다려줘, 더 좋은 거 준비해볼게!!"],
  ESTJ: ["요청 검토 결과 이번 건은 처리 불가로 결정됐어. 재요청 시 기준에 맞게 수정 부탁해.", "기준에 부합하지 않아서 거절 처리했어. 내용 수정 후 다시 신청해줘."],
  ESTP: ["이번엔 좀 무리야. 근데 좀 다르게 요청해보면 될 것 같은데?", "패스. 다른 방향으로 요청해봐. 금방 될 거야."],
  INFJ: ["네 마음은 잘 알지만, 이번엔 내가 응해주기 어려울 것 같아. 이해해줄 수 있어?", "조심스럽게 말하는 건데... 이번엔 좀 힘들 것 같아. 다른 방식으로 표현해줘."],
  INFP: ["이번엔 조금 어렵겠지만... 괜찮아? 다음에 더 아름다운 걸 보여줄게 🌸", "음... 지금은 선뜻 응하기가 어려워. 미안해."],
  INTJ: ["요청 내용이 처리 가능한 범위를 벗어났어. 재요청 시 조건을 조정해줘.", "이번 요청은 기각. 구체적이고 실현 가능한 내용으로 다시 보내줘."],
  INTP: ["이 요청이 가능한지 분석해봤는데... 음. 지금 기준으로는 무리야.", "흥미롭긴 한데 현실적으로 처리가 어려운 케이스야. 변수를 바꿔서 다시 시도해봐."],
  ISFJ: ["미안해, 이번엔 내가 도움을 못 줄 것 같아ㅠ 다음에 더 잘 챙겨줄게.", "걱정이 돼서 어쩌지... 이번엔 어렵겠지만 항상 응원하고 있어 💕"],
  ISFP: ["...이번엔 좀 어렵겠어. 미안해.", "음... 지금은 아닌 것 같아. 언제든지 다시 얘기해줘."],
  ISTJ: ["검토 결과 이번 요청은 반려 처리됩니다. 기준을 확인 후 재요청 해주세요.", "현재 기준으로 승인이 어렵습니다. 내용 수정 후 다시 신청해주세요."],
  ISTP: ["이번엔 안 돼. 다음에 다시.", "패스."],
};

function getRandomRejectMessage(characterId: string): string {
  const messages = REJECT_MESSAGES[characterId] || ["이번엔 어렵겠어. 다음에 다시 요청해줘."];
  return messages[Math.floor(Math.random() * messages.length)];
}

export async function POST(req: Request) {
  try {
    const { requestId, action, imageUrl, adminMessage } = await req.json();

    if (!requestId || !action) {
      return NextResponse.json({ success: false, error: "필수 파라미터가 없습니다." }, { status: 400 });
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ success: false, error: "action은 approve 또는 reject여야 합니다." }, { status: 400 });
    }

    if (action === "approve" && !imageUrl) {
      return NextResponse.json({ success: false, error: "승인 시 imageUrl이 필요합니다." }, { status: 400 });
    }

    const requestRef = adminDb.collection("photo_requests").doc(requestId);

    await adminDb.runTransaction(async (transaction) => {
      const requestSnap = await transaction.get(requestRef);

      if (!requestSnap.exists) throw new Error("요청을 찾을 수 없습니다.");

      const requestData = requestSnap.data()!;

      if (requestData.status !== "pending") {
        throw new Error("이미 처리된 요청입니다.");
      }

      const { userId, characterId, holdStella } = requestData;
      const userRef = adminDb.collection("users").doc(userId);
      const chatRef = adminDb.collection("chat_rooms").doc(`${userId}_${characterId}`);
      const messageRef = chatRef.collection("messages").doc();

      if (action === "approve") {
        // ── Confirm: holdStella 소멸 + 채팅방에 이미지 전송 ──
        transaction.update(requestRef, {
          status: "approved",
          imageUrl,
          adminMessage: adminMessage || null,
          updatedAt: FieldValue.serverTimestamp(),
        });

        // 채팅방에 이미지 메시지 전송 (캐릭터가 보낸 것처럼)
        transaction.set(messageRef, {
          role: "assistant",
          type: "image",
          imageUrl,
          content: adminMessage || "특별히 준비했어 💌",
          characterId,
          createdAt: FieldValue.serverTimestamp(),
        });

        // 스텔라는 이미 차감되어 있으므로 추가 처리 없음 (소멸 확정)
      } else {
        // ── Refund: holdStella 유저에게 반환 ──
        const userSnap = await transaction.get(userRef);
        const currentStella = userSnap.data()?.stella || 0;

        transaction.update(userRef, {
          stella: currentStella + holdStella,
        });

        transaction.update(requestRef, {
          status: "rejected",
          updatedAt: FieldValue.serverTimestamp(),
        });

        // 캐릭터 말투로 된 거절 메시지 전송
        const rejectMessage = getRandomRejectMessage(characterId);
        transaction.set(messageRef, {
          role: "assistant",
          type: "text",
          content: rejectMessage,
          characterId,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: action === "approve" ? "승인 완료. 채팅방에 이미지가 전송되었습니다." : "거절 완료. 스텔라가 환불되었습니다.",
    });
  } catch (error: any) {
    console.error("Photo Approve API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
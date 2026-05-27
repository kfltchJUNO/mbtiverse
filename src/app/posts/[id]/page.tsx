// src/app/posts/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";

// MBTI별 기본 이모지 (관리자가 커스텀 이미지 등록 전 폴백용)
const DEFAULT_MBTI_EMOJI: Record<string, string> = {
  ENFJ: "🌟", ENFP: "✨", ENTJ: "🔥", ENTP: "💡",
  ESFJ: "🌸", ESFP: "💃", ESTJ: "🏆", ESTP: "⚡",
  INFJ: "🔮", INFP: "🌙", INTJ: "🧠", INTP: "🔭",
  ISFJ: "🍀", ISFP: "🎨", ISTJ: "📋", ISTP: "🔧",
};

export default function PostDetail({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMBTI, setSelectedMBTI] = useState<string>("ALL");
  // MBTI별 커스텀 이모지/이미지 (관리자가 설정한 값)
  const [mbtiAssets, setMbtiAssets] = useState<Record<string, { emoji?: string; imageUrl?: string }>>({});

  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}

    async function fetchData() {
      // 포스트 로드
      const docSnap = await getDoc(doc(db, "posts", params.id));
      if (docSnap.exists()) setPost(docSnap.data());
      setLoading(false);

      // MBTI 커스텀 에셋 로드 (mbti_assets 컬렉션)
      try {
        const snap = await getDocs(collection(db, "mbti_assets"));
        const assets: Record<string, { emoji?: string; imageUrl?: string }> = {};
        snap.docs.forEach(d => { assets[d.id] = d.data() as any; });
        setMbtiAssets(assets);
      } catch {}
    }
    fetchData();
  }, [params.id]);

  if (loading) return <div className="text-center mt-32">로딩 중...</div>;
  if (!post) return <div className="text-center mt-32 text-gray-500">글을 찾을 수 없습니다 😢</div>;

  const filteredContents = selectedMBTI === "ALL"
    ? post.contents
    : post.contents.filter((item: any) => item.mbti === selectedMBTI);

  // MBTI별 아이콘 결정: 커스텀 이미지 > 커스텀 이모지 > 기본 이모지
  const getMbtiIcon = (mbti: string) => {
    const asset = mbtiAssets[mbti];
    if (asset?.imageUrl) {
      return (
        <img
          src={asset.imageUrl}
          alt={mbti}
          className="w-8 h-8 rounded-full object-cover border border-slate-200"
        />
      );
    }
    return (
      <span className="text-2xl">
        {asset?.emoji || DEFAULT_MBTI_EMOJI[mbti] || "✨"}
      </span>
    );
  };

  return (
    <article className="max-w-2xl mx-auto p-6 mt-8">
      {/* 썸네일 */}
      {post.thumbnailUrl && (
        <div className="w-full h-48 rounded-2xl overflow-hidden mb-6 border border-slate-100">
          <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <h1 className="text-3xl font-extrabold mb-8 text-gray-900 leading-tight">
        {post.title}
      </h1>

      {/* MBTI 필터 탭 */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-4 mb-8 border-b border-gray-100 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedMBTI("ALL")}
          className={`px-4 py-2 rounded-full font-bold text-sm transition ${
            selectedMBTI === "ALL" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          전체 보기
        </button>
        {post.contents?.map((item: any) => (
          <button
            key={item.mbti}
            onClick={() => setSelectedMBTI(item.mbti)}
            className={`px-4 py-2 rounded-full font-bold text-sm transition flex items-center gap-1 ${
              selectedMBTI === item.mbti ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
            }`}
          >
            {item.mbti}
          </button>
        ))}
      </div>

      {/* 상단 광고 */}
      <div className="mb-10">
        <ins className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-4585319125929329"
          data-ad-slot="5169920440"
          data-ad-format="auto"
          data-full-width-responsive="true" />
      </div>

      {/* 콘텐츠 */}
      <div className="prose prose-blue max-w-none space-y-12">
        {filteredContents?.map((item: any, index: number) => (
          <section key={index} className="border-b border-gray-100 pb-10 last:border-0">
            <h2 className="text-2xl font-bold text-blue-600 mb-4 flex items-center gap-2">
              {getMbtiIcon(item.mbti)}
              {item.mbti}
            </h2>
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-lg bg-blue-50/50 p-5 rounded-xl border border-blue-100/50">
              {item.script}
            </p>
          </section>
        ))}
      </div>

      {/* 하단 광고 */}
      <div className="mt-16 mb-20">
        <ins className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-4585319125929329"
          data-ad-slot="2543757105"
          data-ad-format="auto"
          data-full-width-responsive="true" />
      </div>
    </article>
  );
}
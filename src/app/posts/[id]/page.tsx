"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

export default function PostDetail({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMBTI, setSelectedMBTI] = useState<string>("ALL"); // 💡 초기값 ALL

  useEffect(() => {
    async function fetchPost() {
      const docRef = doc(db, "posts", params.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPost(docSnap.data());
      }
      setLoading(false);
    }
    fetchPost();
  }, [params.id]);

  if (loading) return <div className="text-center mt-32">로딩 중...</div>;
  if (!post) return <div className="text-center mt-32 text-gray-500">글을 찾을 수 없습니다 😢</div>;

  // 💡 선택된 MBTI에 따른 필터링 로직
  const filteredContents = selectedMBTI === "ALL" 
    ? post.contents 
    : post.contents.filter((item: any) => item.mbti === selectedMBTI);

  return (
    <article className="max-w-2xl mx-auto p-6 mt-8">
      <h1 className="text-3xl font-extrabold mb-8 text-gray-900 leading-tight">
        {post.title}
      </h1>

      {/* 💡 MBTI 선택 버튼 그룹 */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-4 mb-8 border-b border-gray-100 flex flex-wrap gap-2">
        <button 
          onClick={() => setSelectedMBTI("ALL")}
          className={`px-4 py-2 rounded-full font-bold text-sm transition ${selectedMBTI === "ALL" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          전체 보기
        </button>
        {post.contents?.map((item: any) => (
          <button 
            key={item.mbti}
            onClick={() => setSelectedMBTI(item.mbti)}
            className={`px-4 py-2 rounded-full font-bold text-sm transition ${selectedMBTI === item.mbti ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
          >
            {item.mbti}
          </button>
        ))}
      </div>
      
      <div className="w-full h-24 bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 mb-10 rounded-lg text-sm">
        Google AdSense (상단 배너)
      </div>

      <div className="prose prose-blue max-w-none space-y-12">
        {filteredContents?.map((item: any, index: number) => (
          <section key={index} className="border-b border-gray-100 pb-10 last:border-0">
            <h2 className="text-2xl font-bold text-blue-600 mb-4 flex items-center gap-2">
              <span className="text-3xl">✨</span> {item.mbti}
            </h2>
            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-lg bg-blue-50/50 p-5 rounded-xl border border-blue-100/50">
              {item.script}
            </p>
          </section>
        ))}
      </div>

      <div className="w-full h-24 bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 mt-16 mb-20 rounded-lg text-sm">
        Google AdSense (하단 배너)
      </div>
    </article>
  );
}
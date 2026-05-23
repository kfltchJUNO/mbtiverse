import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

export default async function PostDetail({ params }: { params: { id: string } }) {
  // URL 파라미터로 넘어온 글 ID(params.id)로 Firebase에서 문서 조회
  const docRef = doc(db, "posts", params.id);
  const docSnap = await getDoc(docRef);

  // 문서가 삭제되었거나 잘못된 주소일 경우
  if (!docSnap.exists()) {
    return (
      <div className="text-center mt-32 text-gray-500">
        <h2 className="text-2xl font-bold mb-2">글을 찾을 수 없습니다 😢</h2>
        <p>삭제되었거나 존재하지 않는 게시물입니다.</p>
      </div>
    );
  }

  const post = docSnap.data();

  return (
    <article className="max-w-2xl mx-auto p-6 mt-8">
      <h1 className="text-3xl font-extrabold mb-8 text-gray-900 leading-tight">
        {post.title}
      </h1>
      
      {/* 상단 애드센스 광고 영역 */}
      <div className="w-full h-24 bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 mb-10 rounded-lg text-sm">
        Google AdSense (상단 배너)
      </div>

      <div className="prose prose-blue max-w-none space-y-12">
        {/* DB에 저장된 16개의 MBTI 배열을 순회하며 렌더링 */}
        {post.contents?.map((item: any, index: number) => (
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

      {/* 하단 애드센스 광고 영역 */}
      <div className="w-full h-24 bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 mt-16 mb-20 rounded-lg text-sm">
        Google AdSense (하단 배너)
      </div>
    </article>
  );
}
import Link from "next/link";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";

// 사용자가 접속할 때마다 캐시를 쓰지 않고 DB에서 최신 글을 강제로 불러옵니다.
export const revalidate = 0;

export default async function Home() {
  // Firebase에서 'posts' 컬렉션의 데이터를 생성일자 기준 내림차순(최신순)으로 쿼리
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  
  const posts = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as any[];

  return (
    <main className="max-w-3xl mx-auto p-6 min-h-screen">
      <header className="mb-12 text-center mt-12">
        <h1 className="text-4xl font-extrabold tracking-tight mb-3 text-gray-900">MBTIverse 🌍</h1>
        <p className="text-gray-500 text-lg">실시간 업데이트되는 꿀잼 MBTI 썰 모음</p>
      </header>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center text-gray-400 mt-20 p-10 border border-dashed rounded-xl">
            <p>아직 발행된 썰이 없습니다.</p>
            <p className="text-sm mt-2">관리자 페이지에서 첫 콘텐츠를 발행해보세요!</p>
          </div>
        ) : (
          posts.map((post) => (
            <Link href={`/posts/${post.id}`} key={post.id} className="block group">
              <div className="p-6 border rounded-2xl hover:shadow-lg transition-all bg-white hover:border-blue-200">
                <h2 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-400 mt-3 flex items-center gap-2">
                  <span>📅</span>
                  {/* Firestore Timestamp 객체를 JS Date로 변환 */}
                  {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('ko-KR') : '방금 전'}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
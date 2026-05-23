import Link from "next/link";

// 임시 MVP 데이터 (추후 Firebase 등 DB로 교체)
const mockPosts = [
  { id: "1", title: "MBTI별 카톡 안 읽씹할 때 속마음", date: "2026-05-23" },
  { id: "2", title: "갑자기 약속 취소됐을 때 MBTI 반응", date: "2026-05-22" },
];

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <header className="mb-10 text-center mt-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">MBTIverse 🌍</h1>
        <p className="text-gray-500">실시간 업데이트되는 꿀잼 MBTI 썰 모음</p>
      </header>

      <div className="space-y-4">
        {mockPosts.map((post) => (
          <Link href={`/posts/${post.id}`} key={post.id} className="block">
            <div className="p-5 border rounded-xl hover:shadow-md transition-shadow bg-white">
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="text-sm text-gray-400 mt-2">{post.date}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
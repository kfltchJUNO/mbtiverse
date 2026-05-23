import React from "react";

export default function PostDetail({ params }: { params: { id: string } }) {
  return (
    <article className="max-w-2xl mx-auto p-6 mt-8">
      <h1 className="text-3xl font-bold mb-6">MBTI별 카톡 안 읽씹할 때 속마음</h1>
      
      {/* 상단 애드센스 광고 영역 (임시 플레이스홀더) */}
      <div className="w-full h-24 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 mb-8 rounded">
        Google AdSense (상단)
      </div>

      <div className="prose prose-blue max-w-none space-y-6">
        <section>
          <h2 className="text-2xl font-bold text-blue-600">INFP</h2>
          <p className="text-gray-700 leading-relaxed">
            "혹시 내가 뭐 실수했나? 아까 그 이모티콘이 별로였나...?" (하루 종일 카톡방 들락날락하며 온갖 시나리오 창작 중)
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-blue-600">ESTP</h2>
          <p className="text-gray-700 leading-relaxed">
            "바쁜가 보네." (1초 만에 앱 끄고 유튜브 보러 감. 다음 날까지 본인이 카톡 보낸 사실도 까먹음)
          </p>
        </section>
        
        {/* 본문 중간 광고 등 추가 가능 */}
      </div>

      {/* 하단 애드센스 광고 영역 */}
      <div className="w-full h-24 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 mt-12 rounded">
        Google AdSense (하단)
      </div>
    </article>
  );
}
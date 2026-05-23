import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 text-slate-800">
      <div className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-3xl font-black mb-8">서비스 이용약관</h1>
        <div className="space-y-6 text-sm leading-relaxed text-slate-600">
          <p><strong>제1조 (목적)</strong><br />본 약관은 MBTIverse(이하 '사이트')가 제공하는 제반 서비스의 이용과 관련하여 사이트와 회원의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
          <p><strong>제2조 (서비스의 제공)</strong><br />사이트는 회원에게 MBTI 기반 심리 테스트, 성격 분석 콘텐츠 및 관련 부가 서비스를 제공합니다.</p>
          <p><strong>제3조 (회원의 의무)</strong><br />회원은 본 약관 및 관계 법령을 준수하여야 하며, 사이트의 업무에 방해되는 행위, 타인의 명예를 손상시키는 행위를 하여서는 안 됩니다.</p>
          <p><strong>제4조 (저작권의 귀속)</strong><br />사이트가 작성한 저작물에 대한 저작권 및 기타 지적재산권은 사이트에 귀속됩니다. 회원은 사이트를 이용함으로써 얻은 정보를 사이트의 사전 승낙 없이 복제, 송신, 출판, 배포할 수 없습니다.</p>
          <p><strong>제5조 (책임 제한)</strong><br />사이트에서 제공하는 심리 분석 및 MBTI 관련 콘텐츠는 흥미와 참고를 위한 목적으로 제공되며, 의학적, 심리학적 전문 진단을 대체하지 않습니다.</p>
        </div>
        <div className="mt-10 pt-6 border-t border-slate-100">
          <Link href="/" className="px-6 py-3 bg-slate-100 font-bold rounded-xl hover:bg-slate-200 transition">메인으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 text-slate-800">
      <div className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-3xl font-black mb-8">개인정보처리방침</h1>
        <div className="space-y-6 text-sm leading-relaxed text-slate-600">
          <p><strong>1. 개인정보의 처리 목적</strong><br />MBTIverse(이하 '사이트')는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 사전 동의를 구합니다.<br />- 콘텐츠 제공 및 서비스 운영, 사용자 맞춤형 서비스 제공</p>
          <p><strong>2. 수집하는 개인정보 항목</strong><br />- 필수항목: 이메일 주소, 이름 (Google 소셜 로그인 시 제공받는 기본 정보)<br />- 자동 수집 항목: 서비스 이용 기록, 접속 로그, 쿠키(Cookie), 접속 IP 정보</p>
          <p><strong>3. 개인정보의 처리 및 보유 기간</strong><br />회원 탈퇴 시 또는 서비스 종료 시까지 지체 없이 파기합니다. 단, 관계 법령에 의한 보존이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.</p>
          <p><strong>4. 쿠키(Cookie)의 운용 및 거부</strong><br />본 사이트는 사용자에게 최적화된 맞춤형 정보를 제공하기 위해 '쿠키(cookie)'를 사용합니다. 쿠키 저장을 거부할 경우 맞춤형 서비스 이용에 어려움이 있을 수 있습니다.</p>
          <p><strong>5. 개인정보 보호책임자</strong><br />- 이메일: ohejunho@naver.com</p>
        </div>
        <div className="mt-10 pt-6 border-t border-slate-100">
          <Link href="/" className="px-6 py-3 bg-slate-100 font-bold rounded-xl hover:bg-slate-200 transition">메인으로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
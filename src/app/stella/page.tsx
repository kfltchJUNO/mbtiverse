// src/app/stella/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "../../hooks/useAuthGuard";

const PACKAGES = [
  { permalink: "vbgkvx", stella: 400,  price: "$4.99", name: "스타터",   emoji: "⚡", color: "from-blue-600 to-indigo-600",   url: "https://maedeup.gumroad.com/l/vbgkvx" },
  { permalink: "wbomlk", stella: 900,  price: "$9.99", name: "스탠다드", emoji: "🌟", color: "from-violet-600 to-purple-600", url: "https://maedeup.gumroad.com/l/wbomlk" },
  { permalink: "sreanm", stella: 2000, price: "$19.99", name: "프리미엄", emoji: "💫", color: "from-pink-600 to-rose-600",    url: "https://maedeup.gumroad.com/l/sreanm" },
  { permalink: "ybjbje", stella: 4500, price: "$39.99", name: "VIP",    emoji: "👑", color: "from-amber-500 to-orange-500",  url: "https://maedeup.gumroad.com/l/ybjbje" },
];

export default function StellaPage() {
  const { user, profile, loading } = useAuthGuard();
  const router = useRouter();
  const [licenseKey, setLicenseKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleValidate = async () => {
    if (!licenseKey.trim()) return alert("라이선스 키를 입력해주세요.");
    if (!user) return alert("로그인이 필요합니다.");
    setIsValidating(true);
    setResult(null);
    try {
      const res = await fetch("/api/license/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: licenseKey.trim(), uid: user.uid }),
      });
      const data = await res.json();
      setResult({ success: data.success, message: data.message || data.error });
      if (data.success) {
        setLicenseKey("");
        setTimeout(() => router.push("/"), 2000);
      }
    } catch (e: any) {
      setResult({ success: false, message: e.message });
    }
    setIsValidating(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-10">

        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <img src="/stella.png" className="w-10 h-10" alt="stella" />
            <h1 className="text-2xl font-black">스텔라 충전</h1>
          </div>
          {user && (
            <div className="inline-flex items-center gap-1.5 bg-slate-800 px-4 py-2 rounded-full text-sm">
              <img src="/stella.png" className="w-4 h-4" alt="stella" />
              <span className="font-bold text-amber-400">{profile?.stella ?? 0}</span>
              <span className="text-slate-400">보유 중</span>
            </div>
          )}
        </div>

        {/* 패키지 목록 */}
        <div className="space-y-3 mb-8">
          {PACKAGES.map(pkg => (
            <a
              key={pkg.permalink}
              href={pkg.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block bg-gradient-to-r ${pkg.color} p-px rounded-2xl`}
            >
              <div className="bg-slate-900 hover:bg-slate-800 rounded-2xl p-4 flex items-center gap-4 transition">
                <span className="text-3xl flex-shrink-0">{pkg.emoji}</span>
                <div className="flex-1">
                  <p className="font-black text-white">{pkg.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <img src="/stella.png" className="w-3.5 h-3.5" alt="stella" />
                    <span className="text-amber-400 font-bold text-sm">{pkg.stella.toLocaleString()}</span>
                    <span className="text-slate-500 text-xs">스텔라</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-white text-lg">{pkg.price}</p>
                  <p className="text-slate-400 text-xs">Gumroad →</p>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* 라이선스 키 입력 */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
          <h3 className="font-bold text-slate-200 mb-1">라이선스 키 입력</h3>
          <p className="text-slate-500 text-xs mb-4">
            구매 후 이메일로 받은 라이선스 키를 입력하세요.
          </p>
          <input
            value={licenseKey}
            onChange={e => setLicenseKey(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleValidate()}
            placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
            className="w-full p-3 bg-slate-900 text-slate-100 border border-slate-600 rounded-xl text-sm font-mono focus:outline-none focus:border-indigo-500 mb-3"
          />

          {result && (
            <div className={`p-3 rounded-xl text-sm mb-3 font-bold ${
              result.success
                ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800"
                : "bg-red-900/50 text-red-400 border border-red-800"
            }`}>
              {result.success ? "✅ " : "❌ "}{result.message}
            </div>
          )}

          <button
            onClick={handleValidate}
            disabled={isValidating || !licenseKey.trim()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition disabled:opacity-40"
          >
            {isValidating ? "확인 중..." : "충전하기"}
          </button>
        </div>

        <p className="text-center text-slate-600 text-xs mt-5">
          구매 관련 문의: ot.helper7@gmail.com
        </p>
      </div>
    </div>
  );
}
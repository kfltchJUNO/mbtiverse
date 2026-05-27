'use client';

import { useState } from 'react';

export default function ChargeStella() {
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleValidate = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/license/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('userId') || '', // 사용자 ID
        },
        body: JSON.stringify({ licenseKey }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setLicenseKey('');
        // 3초 후 메인 페이지로 이동
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        setError(data.error || 'Invalid license key');
      }
    } catch (err) {
      setError('요청 실패. 다시 시도해주세요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 p-6">
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-2">스텔라 충전</h1>
          <p className="text-gray-600 text-center mb-8">
            라이선스 키를 입력하여 스텔라를 충전하세요
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                라이선스 키
              </label>
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="예: 6F0E4C97-B72A4E69..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
            </div>

            <button
              onClick={handleValidate}
              disabled={loading || !licenseKey}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 rounded-lg hover:shadow-lg disabled:opacity-50 transition"
            >
              {loading ? '검증 중...' : '충전하기'}
            </button>
          </div>

          {message && (
            <div className="mt-6 p-4 bg-green-100 text-green-700 rounded-lg text-center">
              ✅ {message}
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg text-center">
              ❌ {error}
            </div>
          )}

          <div className="mt-8 pt-8 border-t">
            <p className="text-sm text-gray-600 text-center">
              라이선스 키를 가지고 있지 않으신가요?
            </p>
            <button className="w-full text-center text-purple-600 hover:text-purple-700 font-semibold mt-2">
              스텔라 구매하기 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
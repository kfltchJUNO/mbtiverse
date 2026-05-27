import { NextRequest, NextResponse } from 'next/server';
import { validateLicenseKey, saveLicense } from '@/lib/firebase';
import { getAuth } from 'firebase-admin/auth';

export async function POST(req: NextRequest) {
  try {
    const { licenseKey } = await req.json();

    if (!licenseKey) {
      return NextResponse.json(
        { error: 'License key is required' },
        { status: 400 }
      );
    }

    // License 검증
    const validation = await validateLicenseKey(licenseKey);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.message || 'Invalid license key' },
        { status: 401 }
      );
    }

    // 현재 사용자 ID 가져오기 (세션에서)
    const userId = req.headers.get('x-user-id'); // 클라이언트에서 전송

    // 사용자 계정에 스텔라 추가
    // (다음 단계에서 구현)

    return NextResponse.json({
      success: true,
      stella: validation.stella,
      packageName: validation.packageName,
      message: `${validation.stella}개 스텔라가 충전되었습니다!`,
    });
  } catch (error) {
    console.error('Error validating license:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
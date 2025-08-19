import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json({ error: '위도와 경도가 필요합니다.' }, { status: 400 });
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/cultural-spaces/nearby?latitude=${lat}&longitude=${lng}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.warn(`문화공간 API 호출 실패: ${response.status}`);
        return NextResponse.json([]);
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (backendError) {
      // 백엔드 서버 연결 실패 시 빈 배열 반환 (프론트엔드 동작 유지)
      console.warn('문화공간 백엔드 서버 연결 실패:', backendError);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('문화공간 API 에러:', error);
    return NextResponse.json([]);
  }
}

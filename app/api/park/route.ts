import { NextRequest, NextResponse } from 'next/server';

/**
 * GET 현재 위치 기준 반경 2km 이내 공원 정보 조회
 * Query Parameters: lat(위도), lng(경도)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    if (!latParam || !lngParam) {
      return NextResponse.json(
        { error: '위도(lat)와 경도(lng) 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: '올바른 좌표 형식이 아닙니다.' }, { status: 400 });
    }

    // 백엔드 API 호출
    try {
      const response = await fetch(
        `http://localhost:8080/api/parks/nearby?latitude=${lat}&longitude=${lng}`
      );

      if (!response.ok) {
        console.warn(`공원 API 호출 실패: ${response.status}`);
        return NextResponse.json([]);
      }

      const parks = await response.json();
      return NextResponse.json(parks);
    } catch (backendError) {
      // 백엔드 연결 실패 시 빈 배열 반환 (프론트엔드 동작 유지)
      console.warn('공원 백엔드 서버 연결 실패:', backendError);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('공원 API 조회 중 오류:', error);
    return NextResponse.json([]);
  }
}

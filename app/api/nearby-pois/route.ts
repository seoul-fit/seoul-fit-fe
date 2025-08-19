/**
 * Nearby POIs API Route (단순 프록시)
 * 
 * 역할: Next.js API 라우트 진입점
 * 실제 로직: src/features/poi-search에서 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchNearbyPOIs, formatDistance } from '@/features/poi-search';

/**
 * GET 주변 POI 조회 API
 * Query Parameters: lat(위도), lng(경도), radius(반경, km 단위)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const radiusParam = searchParams.get('radius');

    // 필수 파라미터 검증
    if (!latParam || !lngParam) {
      return NextResponse.json(
        { error: '위도(lat)와 경도(lng) 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);
    const radius = radiusParam ? parseFloat(radiusParam) * 1000 : 1500; // km를 미터로 변환, 기본값 1.5km

    // 좌표 유효성 검증
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: '올바른 좌표 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // POI 검색
    const searchResult = searchNearbyPOIs({
      lat,
      lng,
      radius,
      limit: 20, // 최대 20개까지 반환
    });

    // 응답 데이터 포맷
    const formattedPOIs = searchResult.pois.map(poi => ({
      code: poi.code,
      name: poi.name,
      lat: poi.lat,
      lng: poi.lng,
      distance: poi.distance,
      distanceText: formatDistance(poi.distance),
    }));

    return NextResponse.json({
      success: true,
      data: {
        center: { lat, lng },
        radius: radius / 1000, // 미터를 km로 변환
        count: formattedPOIs.length,
        pois: formattedPOIs,
      },
    });
  } catch (error) {
    console.error('반경 내 POI 조회 중 오류:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
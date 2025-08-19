/**
 * Libraries Nearby V1 API Route (단순 프록시)
 * 
 * 역할: Next.js API 라우트 진입점
 * 실제 로직: src/entities/library에서 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchNearbyLibraries, validateLocationWithRadius } from '@/entities/library';

/**
 * GET 위치 기반 도서관 조회
 * Query Parameters: latitude(위도), longitude(경도), radius(반경km, 기본값 2)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const radius = searchParams.get('radius');

    // 파라미터 검증
    const params = validateLocationWithRadius(latitude, longitude, radius);
    if (!params) {
      return NextResponse.json(
        { error: '올바른 위도와 경도가 필요합니다.' },
        { status: 400 }
      );
    }

    // 위치 기반 도서관 조회
    const libraries = await fetchNearbyLibraries(params.lat, params.lng, params.radius);
    return NextResponse.json(libraries);
  } catch (error) {
    console.error('[Libraries Nearby V1 API] 조회 중 오류:', error);
    return NextResponse.json(
      { error: '도서관 데이터를 가져오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

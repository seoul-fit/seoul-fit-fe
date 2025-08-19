/**
 * Restaurant V1 API Route (단순 프록시)
 * 
 * 역할: Next.js API 라우트 진입점
 * 실제 로직: src/entities/restaurant에서 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetchAllRestaurants,
  fetchNearbyRestaurants,
  validateLocationParams,
} from '@/entities/restaurant';

/**
 * GET 위치 기준 반경 내 맛집 정보 조회
 * Query Parameters: lat(위도), lng(경도), all(전체 데이터 조회)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    const all = searchParams.get('all');

    // 전체 데이터 요청
    if (all === 'true') {
      const restaurants = await fetchAllRestaurants();
      return NextResponse.json(restaurants);
    }

    // 위치 기반 조회 - 파라미터 검증
    const coords = validateLocationParams(latParam, lngParam);
    if (!coords) {
      return NextResponse.json(
        { error: '올바른 위도(lat)와 경도(lng) 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 위치 기반 레스토랑 조회
    const restaurants = await fetchNearbyRestaurants(coords.lat, coords.lng);
    return NextResponse.json(restaurants);
  } catch (error) {
    console.error('[Restaurant V1 API] 조회 중 오류:', error);
    return NextResponse.json([]);
  }
}

/**
 * Cooling Shelters V1 API Route (단순 프록시)
 * 
 * 역할: Next.js API 라우트 진입점
 * 실제 로직: src/entities/cooling-shelter에서 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchNearbyCoolingShelters, validateLocationParams } from '@/entities/cooling-shelter';

/**
 * GET 위치 기반 무더위 쉼터 조회
 * Query Parameters: lat(위도), lng(경도)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    // 파라미터 검증
    const coords = validateLocationParams(lat, lng);
    if (!coords) {
      return NextResponse.json(
        { error: '올바른 위도와 경도가 필요합니다.' },
        { status: 400 }
      );
    }

    // 무더위 쉼터 조회
    const shelters = await fetchNearbyCoolingShelters(coords);
    return NextResponse.json(shelters);
  } catch (error) {
    console.error('[Cooling Shelters V1 API] 조회 중 오류:', error);
    return NextResponse.json([]);
  }
}
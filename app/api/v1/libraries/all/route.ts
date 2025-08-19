/**
 * Libraries V1 API Route (단순 프록시)
 * 
 * 역할: Next.js API 라우트 진입점
 * 실제 로직: src/entities/library에서 처리
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchAllLibraries, validateSearchParams } from '@/entities/library';

/**
 * GET 전체 도서관 데이터 조회
 * Query Parameters: page(페이지, 기본값 0), size(페이지 크기, 기본값 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const sizeParam = searchParams.get('size');

    // 파라미터 검증
    const params = validateSearchParams(pageParam, sizeParam);

    // 도서관 데이터 조회 (백엔드 우선, 실패시 공공데이터)
    const libraries = await fetchAllLibraries(params);
    
    return NextResponse.json(libraries);
  } catch (error) {
    console.error('[Libraries V1 API] 조회 중 오류:', error);
    return NextResponse.json([]);
  }
}

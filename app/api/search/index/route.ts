import { NextRequest, NextResponse } from 'next/server';

// POI 검색 인덱스 응답 타입
interface POISearchItem {
  id: number;
  name: string;
  address?: string;
  remark?: string;
  aliases?: string;
  ref_table: string;
  ref_id: number;
  created_at: string;
  updated_at: string;
}

/**
 * GET POI 검색 인덱스 조회
 * Query Parameters: page(페이지, 기본값 0), size(페이지 크기, 기본값 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const sizeParam = searchParams.get('size');

    const page = pageParam ? parseInt(pageParam) : 0;
    const size = sizeParam ? parseInt(sizeParam) : 20;
    const offset = page * size;

    if (isNaN(page) || isNaN(size) || page < 0 || size <= 0) {
      return NextResponse.json({ error: '올바른 페이지 파라미터가 아닙니다.' }, { status: 400 });
    }

    // 최대 사이즈 제한 (성능상 20000개까지)
    if (size > 20000) {
      return NextResponse.json({ error: '최대 20000개까지 조회 가능합니다.' }, { status: 400 });
    }

    // 백엔드 서버에서 POI 검색 인덱스 조회
    const response = await fetch(
      `http://localhost:8080/api/search/index?page=${page}&size=${size}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`POI 검색 인덱스 API 호출 실패: ${response.status} ${response.statusText}`);

      // 백엔드 연결 실패 시 빈 배열 반환 (프론트엔드 동작 유지)
      if (response.status >= 500) {
        console.warn('POI 검색 인덱스 백엔드 서버 연결 실패');
        return NextResponse.json([]);
      }

      return NextResponse.json(
        { error: `POI 검색 인덱스 데이터를 가져올 수 없습니다. (${response.status})` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // 응답 형태에 따라 처리
    if (Array.isArray(data)) {
      // 직접 배열로 응답하는 경우
      return NextResponse.json(data);
    } else if (data.content && Array.isArray(data.content)) {
      // Spring Boot Pageable 응답 형태인 경우
      return NextResponse.json(data.content);
    } else if (data.data && Array.isArray(data.data)) {
      // 일반적인 API 응답 형태인 경우
      return NextResponse.json(data.data);
    } else {
      // 예상하지 못한 응답 형태
      console.warn('예상하지 못한 POI 검색 인덱스 응답 형태:', data);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('POI 검색 인덱스 조회 중 오류:', error);

    // 에러 발생 시 빈 배열 반환 (프론트엔드 동작 유지)
    return NextResponse.json([]);
  }
}

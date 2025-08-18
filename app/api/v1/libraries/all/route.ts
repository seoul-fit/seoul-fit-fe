import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8080';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '0';
    const size = searchParams.get('size') || '100';

    try {
      const response = await axios.get(`${BACKEND_BASE_URL}/api/v1/libraries/all`, {
        params: {
          page: parseInt(page),
          size: parseInt(size),
        },
        timeout: 15000,
      });

      return NextResponse.json(response.data);
    } catch (backendError) {
      // 백엔드 서버 연결 실패 시 빈 배열 반환 (프론트엔드 동작 유지)
      console.warn('전체 도서관 데이터 백엔드 서버 연결 실패:', backendError);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('전체 도서관 데이터 조회 실패:', error);
    return NextResponse.json([]);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8080';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '0';
    const size = searchParams.get('size') || '100';

    const response = await axios.get(`${BACKEND_BASE_URL}/api/v1/libraries/all`, {
      params: {
        page: parseInt(page),
        size: parseInt(size),
      },
      timeout: 15000,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('전체 도서관 데이터 조회 실패:', error);

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: '도서관 데이터를 가져오는데 실패했습니다.' },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

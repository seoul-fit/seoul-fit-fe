import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8080';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const radius = searchParams.get('radius') || '2';

    if (!latitude || !longitude) {
      return NextResponse.json({ error: '위도와 경도가 필요합니다.' }, { status: 400 });
    }

    const response = await axios.get(`${BACKEND_BASE_URL}/api/parks/nearby`, {
      params: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseFloat(radius),
      },
      timeout: 10000,
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('공원 데이터 조회 실패:', error);

    if (axios.isAxiosError(error)) {
      return NextResponse.json(
        { error: '공원 데이터를 가져오는데 실패했습니다.' },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

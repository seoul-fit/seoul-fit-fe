import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { loadAllParks, ParkRow } from '@/lib/seoulApi';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8080';

// 서울 공공데이터를 앱 타입으로 변환
function convertParkRowToAppFormat(park: ParkRow) {
  return {
    id: park.P_IDX,
    name: park.P_PARK,
    content: park.P_LIST_CONTENT,
    area: park.AREA,
    address: park.P_ADDR,
    adminTel: park.P_ADMINTEL,
    longitude: parseFloat(park.LONGITUDE) || 0,
    latitude: parseFloat(park.LATITUDE) || 0,
    useReference: park.USE_REFER,
    imageUrl: park.P_IMG,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '0';
    const size = searchParams.get('size') || '100';

    // 먼저 백엔드 서버 시도
    try {
      const response = await axios.get(`${BACKEND_BASE_URL}/api/parks/all`, {
        params: {
          page: parseInt(page),
          size: parseInt(size),
        },
        timeout: 5000, // 타임아웃을 5초로 단축
      });

      console.log('[공원API] 백엔드에서 데이터 로드 성공');
      return NextResponse.json(response.data);
    } catch (backendError) {
      console.warn('[공원API] 백엔드 서버 연결 실패, 공공데이터 직접 호출로 전환:', backendError);
      
      // 백엔드 실패 시 서울 공공데이터 직접 호출
      try {
        const parkRows = await loadAllParks();
        const formattedParks = parkRows.map(convertParkRowToAppFormat);
        
        // 페이징 적용
        const startIndex = parseInt(page) * parseInt(size);
        const endIndex = startIndex + parseInt(size);
        const paginatedParks = formattedParks.slice(startIndex, endIndex);
        
        console.log(`[공원API] 공공데이터에서 직접 로드 성공: ${formattedParks.length}개 (페이지: ${paginatedParks.length}개)`);
        return NextResponse.json(paginatedParks);
      } catch (seoulApiError) {
        console.error('[공원API] 공공데이터 호출도 실패:', seoulApiError);
        return NextResponse.json([]);
      }
    }
  } catch (error) {
    console.error('[공원API] 전체 공원 데이터 조회 실패:', error);
    return NextResponse.json([]);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { loadAllLibraries, LibraryRow } from '@/lib/seoulApi';

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || 'http://localhost:8080';

// 서울 공공데이터를 앱 타입으로 변환
function convertLibraryRowToAppFormat(library: LibraryRow) {
  return {
    id: Math.random().toString(36).substr(2, 9), // 고유 ID 생성
    lbrryName: library.LBRRY_NAME,
    name: library.LBRRY_NAME,
    adres: library.ADRES,
    address: library.ADRES,
    telNo: library.TEL_NO,
    phoneNumber: library.TEL_NO,
    hmpgUrl: library.HMPG_URL,
    website: library.HMPG_URL,
    xcnts: parseFloat(library.XCNTS) || 0,
    latitude: parseFloat(library.XCNTS) || 0,
    ydnts: parseFloat(library.YDNTS) || 0,
    longitude: parseFloat(library.YDNTS) || 0,
    opTime: library.OP_TIME,
    operatingHours: library.OP_TIME,
    fdrmCloseDate: library.FDRM_CLOSE_DATE,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '0';
    const size = searchParams.get('size') || '100';

    // 먼저 백엔드 서버 시도
    try {
      const response = await axios.get(`${BACKEND_BASE_URL}/api/v1/libraries/all`, {
        params: {
          page: parseInt(page),
          size: parseInt(size),
        },
        timeout: 5000, // 타임아웃을 5초로 단축
      });

      console.log('[도서관API] 백엔드에서 데이터 로드 성공');
      return NextResponse.json(response.data);
    } catch (backendError) {
      console.warn('[도서관API] 백엔드 서버 연결 실패, 공공데이터 직접 호출로 전환:', backendError);
      
      // 백엔드 실패 시 서울 공공데이터 직접 호출
      try {
        const libraryRows = await loadAllLibraries();
        const formattedLibraries = libraryRows.map(convertLibraryRowToAppFormat);
        
        // 페이징 적용
        const startIndex = parseInt(page) * parseInt(size);
        const endIndex = startIndex + parseInt(size);
        const paginatedLibraries = formattedLibraries.slice(startIndex, endIndex);
        
        console.log(`[도서관API] 공공데이터에서 직접 로드 성공: ${formattedLibraries.length}개 (페이지: ${paginatedLibraries.length}개)`);
        return NextResponse.json(paginatedLibraries);
      } catch (seoulApiError) {
        console.error('[도서관API] 공공데이터 호출도 실패:', seoulApiError);
        return NextResponse.json([]);
      }
    }
  } catch (error) {
    console.error('[도서관API] 전체 도서관 데이터 조회 실패:', error);
    return NextResponse.json([]);
  }
}

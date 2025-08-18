// lib/seoulApi.ts - 서울 API 직접 호출 서비스

const API_KEY = process.env.SEOUL_API_KEY || '4b46766a7673706939395769456b6b';
const BASE_URL = 'http://openapi.seoul.go.kr:8088';

// 지하철 역 정보 타입
export interface SubwayStationRow {
  BLDN_ID: string;
  BLDN_NM: string;
  ROUTE: string;
  LAT: string;
  LOT: string;
}

interface SubwayApiResponse {
  subwayStationMaster: {
    list_total_count: number;
    RESULT: {
      CODE: string;
      MESSAGE: string;
    };
    row: SubwayStationRow[];
  };
}

// 따릉이 대여소 타입
export interface BikeStationRow {
  rackTotCnt: string;
  stationName: string;
  parkingBikeTotCnt: string;
  shared: string;
  stationLatitude: string;
  stationLongitude: string;
  stationId: string;
}

interface BikeApiResponse {
  rentBikeStatus: {
    list_total_count: number;
    RESULT: {
      CODE: string;
      MESSAGE: string;
    };
    row: BikeStationRow[];
  };
}

// 지하철 전체 데이터 로드 (서버 시작시 1회)
export async function loadAllSubwayStations(): Promise<SubwayStationRow[]> {
  try {
    console.log('[서울API] 지하철 전체 데이터 로드 시작...');

    const apiUrl = `${BASE_URL}/${API_KEY}/json/subwayStationMaster/1/800/`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`지하철 API 호출 실패: ${response.status}`);
    }

    const data: SubwayApiResponse = await response.json();

    if (data.subwayStationMaster.RESULT.CODE !== 'INFO-000') {
      throw new Error(`지하철 API 응답 에러: ${data.subwayStationMaster.RESULT.MESSAGE}`);
    }

    const stations = data.subwayStationMaster.row;
    console.log(`[서울API] 지하철 데이터 로드 완료: ${stations.length}개 역`);

    return stations;
  } catch (error) {
    console.error('[서울API] 지하철 데이터 로드 실패:', error);
    throw error;
  }
}

// 따릉이 전체 데이터 로드 (1분마다 갱신)
// 타입 가드 함수
function isBikeApiResponse(data: unknown): data is BikeApiResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'rentBikeStatus' in data &&
    typeof (data as Record<string, unknown>).rentBikeStatus === 'object' &&
    (data as Record<string, unknown>).rentBikeStatus !== null &&
    'RESULT' in ((data as Record<string, unknown>).rentBikeStatus as Record<string, unknown>) &&
    'row' in ((data as Record<string, unknown>).rentBikeStatus as Record<string, unknown>)
  );
}

// 따릉이 API 단일 호출 함수
async function fetchBikeBatch(startIndex: number, endIndex: number): Promise<BikeStationRow[]> {
  const apiUrl = `${BASE_URL}/${API_KEY}/json/bikeList/${startIndex}/${endIndex}/`;
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`따릉이 API 호출 실패: ${response.status}`);
  }

  const responseText = await response.text();

  if (responseText.trim().startsWith('<')) {
    console.error(
      `[서울API] HTML 응답 받음 (${startIndex}-${endIndex}):`,
      responseText.substring(0, 300)
    );
    throw new Error(`따릉이 API에서 HTML 응답을 받았습니다. API 키나 URL을 확인해주세요.`);
  }

  let data: unknown;
  try {
    data = JSON.parse(responseText);
  } catch (parseError) {
    throw new Error('따릉이 API 응답을 JSON으로 파싱할 수 없습니다.');
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    'RESULT' in data &&
    !('rentBikeStatus' in data)
  ) {
    const errorResult = (data as { RESULT: { CODE: string; MESSAGE: string } }).RESULT;
    throw new Error(`따릉이 API 에러: ${errorResult.CODE} - ${errorResult.MESSAGE}`);
  }

  if (!isBikeApiResponse(data)) {
    throw new Error('따릉이 API 응답 구조가 예상과 다릅니다.');
  }

  if (data.rentBikeStatus.RESULT.CODE !== 'INFO-000') {
    throw new Error(`따릉이 API 응답 에러: ${data.rentBikeStatus.RESULT.MESSAGE}`);
  }

  return data.rentBikeStatus.row;
}

export async function loadAllBikeStations(): Promise<BikeStationRow[]> {
  try {
    console.log('[서울API] 따릉이 전체 데이터 로드 시작...');

    // 1000개씩 두 번 호출
    const [batch1, batch2] = await Promise.all([
      fetchBikeBatch(1, 1000),
      fetchBikeBatch(1001, 2000),
    ]);

    const allStations = [...batch1, ...batch2];
    console.log(
      `[서울API] 따릉이 데이터 로드 완료: ${allStations.length}개 대여소 (batch1: ${batch1.length}, batch2: ${batch2.length})`
    );

    return allStations;
  } catch (error) {
    console.error('[서울API] 따릉이 데이터 로드 실패:', error);
    throw error;
  }
}

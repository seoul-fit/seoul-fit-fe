import { CongestionData } from '@/lib/types';

/**
 * 현재 위치에서 가장 가까운 장소의 혼잡도 정보 조회
 * (API Route를 통해 API 호출)
 * @param lat 현재 위치 위도
 * @param lng 현재 위치 경도
 * @return 가장 가까운 장소의 혼잡도 정보
 */
export async function getNearestCongestionData(
  lat: number,
  lng: number
): Promise<CongestionData | null> {
  try {
    // 좌표 유효성 검증
    if (isNaN(lat) || isNaN(lng)) {
      console.error('올바르지 않은 좌표입니다 : ', { lat, lng });
      return null;
    }

    // Next.js API Route 호출
    const apiUrl = `/api/congestion?lat=${lat}&lng=${lng}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'default', // 브라우저 캐시 활용
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`혼잡도 API 호출 실패: ${response.status}`, errorData);
      return null;
    }

    const result = await response.json();

    // 에러 응답 처리
    if (!result.success) {
      console.error('혼잡도 API 에러 : ', result.error);
      return null;
    }

    // 데이터가 없는 경우
    if (!result.data) {
      console.error('혼잡도 데이터가 없습니다.');
      return null;
    }

    return {
      AREA_NM: result.data.areaName,
      AREA_CD: result.data.areaCode,
      AREA_CONGEST_LVL: result.data.areaCongestLevel,
      AREA_CONGEST_MSG: result.data.areaCongestMessage,
    };
  } catch (error) {
    console.error('혼잡도 데이터 조회 실패 : ', error);
    return null;
  }
}

/**
 * 혼잡도 레벨에 따른 CSS 클래스 반환
 * @param congestionLevel 혼잡도 레벨
 * @return CSS 클래스
 */
export function getCongestionClass(congestionLevel: string): string {
  switch (congestionLevel) {
    case '여유':
      return 'bg-green-500 text-white';
    case '보통':
      return 'bg-yellow-500 text-white';
    case '약간 붐빔':
      return 'bg-orange-500 text-white';
    case '붐빔':
      return 'bg-red-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

/**
 * 혼잡도 레벨에 따른 Hex 색상 반환
 * @param congestionLevel 혼잡도 레벨
 * @return Hex 색상 코드
 */
export function getCongestionColor(congestionLevel: string): string {
  switch (congestionLevel) {
    case '여유':
      return '#22c55e';
    case '보통':
      return '#eab308';
    case '약간 붐빔':
      return '#f97316';
    case '붐빔':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}

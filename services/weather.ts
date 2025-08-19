import { WeatherData } from '@/lib/types';

/**
 * 현재 위치에서 가장 가까운 장소의 날씨 정보 조회
 * (API Route를 통해 API 호출)
 * @param lat 현재 위치 위도
 * @param lng 현재 위치 경도
 * @return 가장 가까운 장소의 날씨 정보
 */
export async function getNearestWeatherData(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    // 좌표 유효성 검증
    if (isNaN(lat) || isNaN(lng)) {
      console.error('올바르지 않은 좌표입니다 : ', { lat, lng });
      return null;
    }

    // Next.js API Route 호출
    const apiUrl = `/api/weather?lat=${lat}&lng=${lng}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'default', // 브라우저 캐시 활용
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`날씨 API 호출 실패: ${response.status}`, errorData);
      return null;
    }

    const result = await response.json();

    // 에러 응답 처리
    if (!result.success) {
      console.error('날씨 API 에러 : ', result.error);
      return null;
    }

    // 데이터가 없는 경우
    if (!result.data) {
      console.error('날씨 데이터가 없습니다.');
      return null;
    }

    // API는 이제 원시 API 형식으로 직접 반환
    return {
      AREA_NM: result.data.AREA_NM,
      AREA_CD: result.data.AREA_CD,
      WEATHER_STTS: result.data.WEATHER_STTS,
      TEMP: result.data.TEMP,
      SENSIBLE_TEMP: result.data.SENSIBLE_TEMP,
      MAX_TEMP: result.data.MAX_TEMP,
      MIN_TEMP: result.data.MIN_TEMP,
      HUMIDITY: result.data.HUMIDITY,
      PRECIPITATION: result.data.PRECIPITATION,
      PCP_MSG: result.data.PCP_MSG,
      UV_INDEX_LVL: result.data.UV_INDEX_LVL,
      UV_MSG: result.data.UV_MSG,
      PM25_INDEX: result.data.PM25_INDEX,
      PM10_INDEX: result.data.PM10_INDEX,
    };
  } catch (error) {
    console.error('날씨 데이터 조회 실패 : ', error);
    return null;
  }
}

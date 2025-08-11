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

        return {
            AREA_NM: result.data.areaName,
            AREA_CD: result.data.areaCode,
            WEATHER_STTS: result.data.weatherStts,
            TEMP: result.data.temp,
            SENSIBLE_TEMP: result.data.sensibleTemp,
            MAX_TEMP: result.data.maxTemp,
            MIN_TEMP: result.data.minTemp,
            HUMIDITY: result.data.humidity,
            PRECIPITATION: result.data.precipitation,
            PCP_MSG: result.data.pcpMsg,
            UV_INDEX_LVL: result.data.uvIndexLvl,
            UV_MSG: result.data.uvMsg,
            PM25_INDEX: result.data.pm25Index,
            PM10_INDEX: result.data.pm10Index,
        };
    } catch (error) {
        console.error('날씨 데이터 조회 실패 : ', error);
        return null;
    }
}
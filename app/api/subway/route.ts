import { NextRequest, NextResponse } from "next/server";

// 서울 열린데이터 광장 API 키
const API_KEY = process.env.SEOUL_API_KEY || '4b46766a7673706939395769456b6b';
const BASE_URL = 'http://openapi.seoul.go.kr:8088';

// 서울시 역사마스터 정보 API 응답 데이터
interface SubwayStationRow {
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

// 지하철 데이터 캐시
let subwayCache: {
    data: SubwayStationRow[] | null,
    fetchTime: string | null
} = {
    data: null,
    fetchTime: null
};

/**
 * GET 반경 내 지하철 역 조회
 * Query Parameters: lat(위도), lng(경도), radius(반경km, 기본값 1.5)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const latParam = searchParams.get('lat');
        const lngParam = searchParams.get('lng');

        if (!latParam || !lngParam) {
            return NextResponse.json(
                { error: '위도(lat)와 경도(lng) 파라미터가 필요합니다.' },
                { status: 400 }
            );
        }

        const lat = parseFloat(latParam);
        const lng = parseFloat(lngParam);

        if (isNaN(lat) || isNaN(lng)) {
            return NextResponse.json(
                { error: '올바른 좌표 형식이 아닙니다.' },
                { status: 400 }
            );
        }

        // 지하철 캐시 확인
        if (subwayCache.data) {
            const allStations = subwayCache.data.map((station) => ({
                code: `SUBWAY_${station.BLDN_ID}`,
                name: `${station.BLDN_NM} 역`,
                lat: parseFloat(station.LAT),
                lng: parseFloat(station.LOT),
                stationId: station.BLDN_ID,
                route: station.ROUTE
            }));

            return NextResponse.json({
                success: true,
                data: {
                    count: allStations.length,
                    stations: allStations,
                    cached: true,
                    fetchTime: subwayCache.fetchTime
                }
            });
        }

        // 캐시 없으면 서울시 역사마스터 정보 API 호출
        const fetchTime = new Date().toISOString();

        const apiUrl1 = `${BASE_URL}/${API_KEY}/json/subwayStationMaster/1/800/`; // 2025.08.12 기준 780개 역 데이터 반환
        const response = await fetch(apiUrl1, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`지하철 API 호출 실패: ${response.status} ${response.statusText}`);
            return NextResponse.json(
                { error: `지하철 API 호출 실패: ${response.status}` },
                { status: 502 }
            );
        }

        const data: SubwayApiResponse = await response.json();

        // API 응답 결과 코드 확인
        if (data.subwayStationMaster.RESULT.CODE !== 'INFO-000') {
            console.error(`지하철 API 응답 에러: ${data.subwayStationMaster.RESULT.MESSAGE}`);
            return NextResponse.json(
                { error: `지하철 API 응답 에러: ${data.subwayStationMaster.RESULT.MESSAGE}` },
                { status: 502 }
            );
        }

        const stations = data.subwayStationMaster.row;

        // 캐시 업데이트
        subwayCache = {
            data: stations,
            fetchTime: fetchTime
        };

        console.log(`캐시 업데이트 완료: ${stations.length}개 역 저장`);

        const allStations = stations.map((station) => ({
            code: `SUBWAY_${station.BLDN_ID}`,
            name: `${station.BLDN_NM} 역`,
            lat: parseFloat(station.LAT),
            lng: parseFloat(station.LOT),
            stationId: station.BLDN_ID,
            route: station.ROUTE
        }));

        return NextResponse.json({
            success: true,
            data: {
                count: allStations.length,
                stations: allStations,
                cached: false,
                fetchTime: fetchTime
            }
        });
    } catch (error) {
        console.error('지하철 역 조회 중 오류:', error);
        return NextResponse.json(
            { error: '서버 내부 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
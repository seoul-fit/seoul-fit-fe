import { NextRequest, NextResponse } from "next/server";

// 서울시 공통 API 키
const API_KEY = process.env.SEOUL_API_KEY || '4b46766a7673706939395769456b6b';
const BASE_URL = 'http://openapi.seoul.go.kr:8088';

// 서울시 따릉이 API 응답 타입
interface BikeStationRaw {
    stationId: string;
    stationName: string;
    stationLatitude: string;
    stationLongitude: string;
    rackTotCnt: string;
    parkingBikeTotCnt: string;
    shared: string;
}

// 캐시 설정
const CACHE_DURATION = 60 * 1000; // 1분
let bikeCache: {
    data: BikeStationRaw[] | null,
    timestamp: number,
    fetchTime: string | null
} = {
    data: null,
    timestamp: 0,
    fetchTime: null
};

/**
 * 두 좌표 간의 거리 계산 (km)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

/**
 * GET 반경 내 따릉이 대여소 조회
 * Query Parameters: lat(위도), lng(경도), radius(반경km, 기본값 1.5)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const latParam = searchParams.get('lat');
        const lngParam = searchParams.get('lng');
        const radiusParam = searchParams.get('radius');

        if (!latParam || !lngParam) {
            return NextResponse.json(
                { error: '위도(lat)와 경도(lng) 파라미터가 필요합니다.' },
                { status: 400 }
            );
        }

        const lat = parseFloat(latParam);
        const lng = parseFloat(lngParam);
        const radius = radiusParam ? parseFloat(radiusParam) : 1.5;

        if (isNaN(lat) || isNaN(lng)) {
            return NextResponse.json(
                { error: '올바른 좌표 형식이 아닙니다.' },
                { status: 400 }
            );
        }

        // 캐시 확인
        const now = Date.now();
        if (bikeCache.data && (now - bikeCache.timestamp) < CACHE_DURATION) {
            console.log('따릉이 데이터 캐시 사용');
            const cachedData = bikeCache.data as BikeStationRaw[];
            
            // 반경 내 대여소 필터링 (캐시된 데이터에서)
            const nearbyStations = cachedData
                .filter((station: BikeStationRaw) => {
                    const stationLat = parseFloat(station.stationLatitude);
                    const stationLng = parseFloat(station.stationLongitude);
                    
                    if (isNaN(stationLat) || isNaN(stationLng)) return false;
                    
                    const distance = calculateDistance(lat, lng, stationLat, stationLng);
                    return distance <= radius;
                })
                .map((station: BikeStationRaw) => ({
                    code: `BIKE_${station.stationId}`,
                    name: `${station.stationName} 따릉이 대여소`,
                    lat: parseFloat(station.stationLatitude),
                    lng: parseFloat(station.stationLongitude),
                    distance: calculateDistance(lat, lng, parseFloat(station.stationLatitude), parseFloat(station.stationLongitude)),
                    stationId: station.stationId,
                    rackTotCnt: station.rackTotCnt,
                    parkingBikeTotCnt: station.parkingBikeTotCnt,
                    shared: station.shared
                }))
                .sort((a, b) => a.distance - b.distance);

            return NextResponse.json({
                success: true,
                data: {
                    center: { lat, lng },
                    radius,
                    count: nearbyStations.length,
                    stations: nearbyStations,
                    cached: true,
                    fetchTime: bikeCache.fetchTime
                }
            });
        }

        // 캐시가 없거나 만료된 경우 API 호출 (2회 나누어 호출)
        console.log('따릉이 데이터 API 호출 (2회 분할)');
        const fetchTime = new Date().toISOString();
        
        // 첫 번째 호출: 1~1000
        const apiUrl1 = `${BASE_URL}/${API_KEY}/json/bikeList/1/1000/`;
        const response1 = await fetch(apiUrl1, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response1.ok) {
            console.error(`따릉이 API 첫 번째 호출 실패: ${response1.status} ${response1.statusText}`);
            return NextResponse.json(
                { error: `따릉이 API 첫 번째 호출 실패: ${response1.status}` },
                { status: 502 }
            );
        }

        const responseText1 = await response1.text();
        
        // XML 응답인지 확인
        if (responseText1.startsWith('<')) {
            console.error('따릉이 API 첫 번째 호출이 XML 형태로 응답했습니다:', responseText1.substring(0, 100));
            return NextResponse.json([], { status: 200 });
        }
        
        let data1;
        try {
            data1 = JSON.parse(responseText1);
        } catch (parseError) {
            console.error('따릉이 API 첫 번째 응답 JSON 파싱 실패:', parseError);
            return NextResponse.json([], { status: 200 });
        }
        
        // 두 번째 호출: 1001~2000
        const apiUrl2 = `${BASE_URL}/${API_KEY}/json/bikeList/1001/2000/`;
        const response2 = await fetch(apiUrl2, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response2.ok) {
            console.error(`따릉이 API 두 번째 호출 실패: ${response2.status} ${response2.statusText}`);
            return NextResponse.json(
                { error: `따릉이 API 두 번째 호출 실패: ${response2.status}` },
                { status: 502 }
            );
        }

        const responseText2 = await response2.text();
        
        // XML 응답인지 확인
        if (responseText2.startsWith('<')) {
            console.error('따릉이 API 두 번째 호출이 XML 형태로 응답했습니다:', responseText2.substring(0, 100));
            return NextResponse.json([], { status: 200 });
        }
        
        let data2;
        try {
            data2 = JSON.parse(responseText2);
        } catch (parseError) {
            console.error('따릉이 API 두 번째 응답 JSON 파싱 실패:', parseError);
            return NextResponse.json([], { status: 200 });
        }
        
        // API 응답 결과 코드 확인
        if ((data1.RESULT && data1.RESULT.CODE !== 'INFO-000') || 
            (data2.RESULT && data2.RESULT.CODE !== 'INFO-000')) {
            console.error(`API 응답 에러: ${data1.RESULT?.MESSAGE || data2.RESULT?.MESSAGE}`);
            return NextResponse.json(
                { error: `따릉이 API 응답 에러: ${data1.RESULT?.MESSAGE || data2.RESULT?.MESSAGE}` },
                { status: 502 }
            );
        }

        // 두 응답 데이터 합치기
        const bikeStations1 = data1.rentBikeStatus?.row || data1.row || [];
        const bikeStations2 = data2.rentBikeStatus?.row || data2.row || [];
        const bikeStations = [...bikeStations1, ...bikeStations2];
        
        console.log(`따릉이 데이터 로드 완료: 첫 번째 ${bikeStations1.length}개, 두 번째 ${bikeStations2.length}개, 총 ${bikeStations.length}개`);
        
        // 캐시 업데이트
        bikeCache = {
            data: bikeStations,
            timestamp: now,
            fetchTime: fetchTime
        };
        
        console.log(`캐시 업데이트 완료: ${bikeStations.length}개 대여소 저장`);
        
        // 반경 내 대여소 필터링
        const nearbyStations = bikeStations
            .filter((station: { stationLatitude: string; stationLongitude: string }) => {
                const stationLat = parseFloat(station.stationLatitude);
                const stationLng = parseFloat(station.stationLongitude);
                
                if (isNaN(stationLat) || isNaN(stationLng)) return false;
                
                const distance = calculateDistance(lat, lng, stationLat, stationLng);
                return distance <= radius;
            })
            .map((station: { stationId: string; stationName: string; stationLatitude: string; stationLongitude: string; rackTotCnt: number; parkingBikeTotCnt: number; shared: number }) => ({
                code: `BIKE_${station.stationId}`,
                name: `${station.stationName} 따릉이 대여소`,
                lat: parseFloat(station.stationLatitude),
                lng: parseFloat(station.stationLongitude),
                distance: calculateDistance(lat, lng, parseFloat(station.stationLatitude), parseFloat(station.stationLongitude)),
                // 추가 따릉이 정보
                stationId: station.stationId,
                rackTotCnt: station.rackTotCnt, // 거치대 총 개수
                parkingBikeTotCnt: station.parkingBikeTotCnt, // 주차 자전거 총 건수
                shared: station.shared // 거치율
            }))
            .sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance);

        return NextResponse.json({
            success: true,
            data: {
                center: { lat, lng },
                radius,
                count: nearbyStations.length,
                stations: nearbyStations,
                cached: false,
                fetchTime: fetchTime
            }
        });

    } catch (error) {
        console.error('따릉이 대여소 조회 중 오류:', error);
        return NextResponse.json(
            { error: '서버 내부 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
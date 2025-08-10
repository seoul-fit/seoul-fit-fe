import { NextRequest, NextResponse } from "next/server";

// 따릉이 전용 API 키
const BIKE_API_KEY = '64595272627065613536416d487963';
const BASE_URL = 'http://openapi.seoul.go.kr:8088';

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

        // 서울시 공공자전거 실시간 대여정보 API 호출
        const apiUrl = `${BASE_URL}/${BIKE_API_KEY}/json/bikeList/1/1000/`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`따릉이 API 호출 실패: ${response.status} ${response.statusText}`);
            return NextResponse.json(
                { error: `따릉이 API 호출 실패: ${response.status}` },
                { status: 502 }
            );
        }

        const data = await response.json();
        
        // 디버깅용 로그
        console.log('API Response:', JSON.stringify(data, null, 2));

        // API 응답 결과 코드 확인 (성공 시 CODE가 없을 수 있음)
        if (data.RESULT && data.RESULT.CODE !== 'INFO-000') {
            console.error(`API 응답 에러: ${data.RESULT?.MESSAGE}`);
            return NextResponse.json(
                { error: `따릉이 API 응답 에러: ${data.RESULT?.MESSAGE}` },
                { status: 502 }
            );
        }

        const bikeStations = data.rentBikeStatus?.row || data.row || [];
        
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
                stations: nearbyStations
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
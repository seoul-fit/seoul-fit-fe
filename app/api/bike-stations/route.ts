import { NextRequest, NextResponse } from 'next/server';
import { serverCache } from '@/lib/serverCache';
import { dataScheduler } from '@/lib/scheduler';
import type { BikeStationRow } from '@/lib/seoulApi';

/**
 * 두 좌표 간의 거리 계산 (km)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * GET 반경 내 따릉이 대여소 조회 (캐시 기반)
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
      return NextResponse.json({ error: '올바른 좌표 형식이 아닙니다.' }, { status: 400 });
    }

    // 스케줄러 초기화 확인 및 대기
    if (!serverCache.has('bike_stations')) {
      console.log('[따릉이API] 캐시 없음, 초기화 대기...');
      // instrumentation 초기화 완료 대기
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 여전히 캐시가 없으면 초기화 실행
      if (!serverCache.has('bike_stations')) {
        await dataScheduler.initialize();
      }
    }

    // 캐시에서 따릉이 데이터 조회
    const stations = serverCache.get<BikeStationRow[]>('bike_stations');
    const cacheInfo = serverCache.getInfo('bike_stations');

    if (!stations) {
      return NextResponse.json({ error: '따릉이 데이터를 불러올 수 없습니다.' }, { status: 503 });
    }

    console.log(`[따릉이API] 캐시에서 조회: ${stations.length}개 대여소`);

    // 반경 내 대여소 필터링
    const nearbyStations = stations
      .filter(station => {
        const stationLat = parseFloat(station.stationLatitude);
        const stationLng = parseFloat(station.stationLongitude);

        if (isNaN(stationLat) || isNaN(stationLng)) return false;

        const distance = calculateDistance(lat, lng, stationLat, stationLng);
        return distance <= radius;
      })
      .map(station => ({
        code: station.stationId,
        name: station.stationName,
        lat: parseFloat(station.stationLatitude),
        lng: parseFloat(station.stationLongitude),
        distance: calculateDistance(
          lat,
          lng,
          parseFloat(station.stationLatitude),
          parseFloat(station.stationLongitude)
        ),
        stationId: station.stationId,
        rackTotCnt: station.rackTotCnt,
        parkingBikeTotCnt: station.parkingBikeTotCnt,
        shared: station.shared,
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
        fetchTime: new Date(cacheInfo?.timestamp || 0).toISOString(),
      },
    });
  } catch (error) {
    console.error('[따릉이API] 조회 중 오류:', error);
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}

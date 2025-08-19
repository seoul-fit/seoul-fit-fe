import { NextRequest, NextResponse } from 'next/server';
import { serverCache } from '@/lib/serverCache';
import { dataScheduler } from '@/lib/scheduler';
import type { SubwayStationRow } from '@/lib/seoulApi';

/**
 * GET 지하철 역 조회 (캐시 기반)
 * Query Parameters: lat(위도), lng(경도) - 호환성을 위해 유지하지만 전체 데이터 반환
 */
export async function GET(request: NextRequest) {
  try {
    // 스케줄러 초기화 확인 및 대기
    if (!serverCache.has('subway_stations')) {
      console.log('[지하철API] 캐시 없음, 초기화 대기...');
      // instrumentation 초기화 완료 대기
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 여전히 캐시가 없으면 초기화 실행
      if (!serverCache.has('subway_stations')) {
        await dataScheduler.initialize();
      }
    }

    // 캐시에서 지하철 데이터 조회
    const stations = serverCache.get<SubwayStationRow[]>('subway_stations');
    const cacheInfo = serverCache.getInfo('subway_stations');

    if (!stations) {
      return NextResponse.json({ error: '지하철 데이터를 불러올 수 없습니다.' }, { status: 503 });
    }

    // 데이터 변환
    const allStations = stations.map(station => ({
      code: `SUBWAY_${station.BLDN_ID}`,
      name: `${station.BLDN_NM}역`,
      lat: parseFloat(station.LAT),
      lng: parseFloat(station.LOT),
      stationId: station.BLDN_ID,
      route: station.ROUTE,
    }));

    return NextResponse.json({
      success: true,
      data: {
        count: allStations.length,
        stations: allStations,
        cached: true,
        fetchTime: new Date(cacheInfo?.timestamp || 0).toISOString(),
      },
    });
  } catch (error) {
    console.error('[지하철API] 조회 중 오류:', error);
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}

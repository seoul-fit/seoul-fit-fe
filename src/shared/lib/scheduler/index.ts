// lib/scheduler.ts - 데이터 갱신 스케줄러

import { serverCache } from './serverCache';
import { loadAllSubwayStations, loadAllBikeStations } from './seoulApi';

class DataScheduler {
  private static instance: DataScheduler;
  private bikeInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  static getInstance(): DataScheduler {
    if (!DataScheduler.instance) {
      DataScheduler.instance = new DataScheduler();
    }
    return DataScheduler.instance;
  }

  // 초기화 (서버 시작시 1회 실행)
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[스케줄러] 이미 초기화됨 - 스킵');
      return;
    }

    // 중복 초기화 방지
    this.isInitialized = true;
    console.log('[스케줄러] 초기화 시작...');

    try {
      // 1. 지하철 데이터 로드 (1회만)
      await this.loadSubwayData();

      // 2. 따릉이 데이터 로드 (초기 1회)
      await this.loadBikeData();

      // 3. 따릉이 스케줄러 시작 (1분마다)
      this.startBikeScheduler();

      console.log('[스케줄러] 초기화 완료');
    } catch (error) {
      console.error('[스케줄러] 초기화 실패:', error);
      this.isInitialized = false; // 실패 시 다시 초기화 가능하도록
      throw error;
    }
  }

  // 지하철 데이터 로드 (서버 시작시 1회만)
  private async loadSubwayData(): Promise<void> {
    try {
      const stations = await loadAllSubwayStations();
      serverCache.setStatic('subway_stations', stations);
      const cacheStatus = serverCache.getStatus();
      const actualCount = cacheStatus['subway_stations']?.dataSize || 0;
      console.log(`[스케줄러] 지하철 데이터 캐싱 완료: ${actualCount}개 역`);
    } catch (error) {
      console.error('[스케줄러] 지하철 데이터 로드 실패:', error);
      // 지하철 데이터는 필수이므로 에러 발생시 빈 배열로 설정
      serverCache.setStatic('subway_stations', []);
      const cacheStatus = serverCache.getStatus();
      const actualCount = cacheStatus['subway_stations']?.dataSize || 0;
      console.log(`[스케줄러] 지하철 데이터 캐싱 완료: ${actualCount}개 역 (에러로 인한 빈 배열)`);
    }
  }

  // 따릉이 데이터 로드
  private async loadBikeData(): Promise<void> {
    try {
      const stations = await loadAllBikeStations();
      serverCache.setDynamic('bike_stations', stations);
      const cacheStatus = serverCache.getStatus();
      const actualCount = cacheStatus['bike_stations']?.dataSize || 0;
      console.log(`[스케줄러] 따릉이 데이터 캐싱 완료: ${actualCount}개 대여소`);
    } catch (error) {
      console.error('[스케줄러] 따릉이 데이터 로드 실패:', error);
      // 실패 시 기존 캐시 유지
      const cacheStatus = serverCache.getStatus();
      const actualCount = cacheStatus['bike_stations']?.dataSize || 0;
      console.log(`[스케줄러] 따릉이 데이터 캐싱 유지: ${actualCount}개 대여소 (기존 캐시 유지)`);
    }
  }

  // 따릉이 스케줄러 시작 (1분마다)
  private startBikeScheduler(): void {
    if (this.bikeInterval) {
      clearInterval(this.bikeInterval);
    }

    console.log('[스케줄러] 따릉이 1분 주기 갱신 시작');

    this.bikeInterval = setInterval(async () => {
      await this.loadBikeData();
    }, 60 * 1000); // 1분
  }

  // 스케줄러 중지
  stop(): void {
    if (this.bikeInterval) {
      clearInterval(this.bikeInterval);
      this.bikeInterval = null;
      console.log('[스케줄러] 중지됨');
    }
  }

  // 상태 확인
  getStatus(): { initialized: boolean; cacheStatus: Record<string, unknown> } {
    return {
      initialized: this.isInitialized,
      cacheStatus: serverCache.getStatus(),
    };
  }
}

export const dataScheduler = DataScheduler.getInstance();
export { DataScheduler };

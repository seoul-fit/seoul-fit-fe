/**
 * @fileoverview Location Finder Utility
 * @description 가장 가까운 위치 찾기 유틸리티
 */

import { SEOUL_LOCATIONS } from '../model/locations';
import type { Location } from '../model/types';

/**
 * 현재 위치에서 가장 가까운 장소 코드 찾기
 * @param lat 현재 위치 위도
 * @param lng 현재 위치 경도
 * @return 가장 가까운 장소 코드 (POI001~POI128)
 */
export function findNearestAreaCode(lat: number, lng: number): string {
  let minDistance = Infinity;
  let nearestCode = 'POI001'; // 기본값은 강남

  // 유클리드 거리 계산
  for (const location of SEOUL_LOCATIONS) {
    const distance = Math.sqrt(
      Math.pow(lat - location.lat, 2) + Math.pow(lng - location.lng, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestCode = location.code;
    }
  }

  return nearestCode;
}

/**
 * 위치 코드로 위치 정보 가져오기
 * @param code 위치 코드
 * @return 위치 정보 또는 undefined
 */
export function getLocationByCode(code: string): Location | undefined {
  return SEOUL_LOCATIONS.find(location => location.code === code);
}
// services/parks.ts - Seoul Parks service implementation (Updated with correct URLs)
import { SeoulPark, ParkDataStatistics } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

/**
 * 공원 전체 조회
 */
export async function getAllParks(accessToken?: string): Promise<SeoulPark[]> {
  const response = await fetch(`${BASE_URL}/api/parks/all`, {
    method: 'GET',
    headers: {
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`공원 전체 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 근처 공원 조회
 */
export async function getNearbyParks(
  latitude: number,
  longitude: number,
  accessToken?: string
): Promise<SeoulPark[]> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
  });

  const response = await fetch(`${BASE_URL}/api/parks/nearby?${params}`, {
    method: 'GET',
    headers: {
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`근처 공원 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 공원 상세 정보 조회 (향후 구현)
 */
export async function getParkDetail(
  parkId: number,
  accessToken?: string
): Promise<SeoulPark> {
  const params = new URLSearchParams({
    parkId: parkId.toString(),
  });

  const response = await fetch(`${BASE_URL}/api/parks/detail?${params}`, {
    method: 'GET',
    headers: {
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('공원을 찾을 수 없습니다.');
    }
    throw new Error(`공원 상세 정보 조회 실패: ${response.status}`);
  }

  return response.json();
}

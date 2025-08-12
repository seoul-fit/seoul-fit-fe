// services/location.ts - Location-based data service implementation
import { LocationDataResponse } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export interface LocationQuery {
  latitude: number;
  longitude: number;
  radius?: number; // default: 2.0km
}

/**
 * 위치 기반 통합 데이터 조회
 */
export async function getNearbyLocationData(
  query: LocationQuery,
  accessToken: string
): Promise<LocationDataResponse> {
  const params = new URLSearchParams({
    latitude: query.latitude.toString(),
    longitude: query.longitude.toString(),
    ...(query.radius && { radius: query.radius.toString() }),
  });

  const response = await fetch(`${BASE_URL}/api/location/nearby?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`위치 기반 통합 데이터 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 개인화된 위치 기반 데이터 조회
 */
export async function getPersonalizedLocationData(
  query: LocationQuery,
  accessToken: string
): Promise<LocationDataResponse> {
  const params = new URLSearchParams({
    latitude: query.latitude.toString(),
    longitude: query.longitude.toString(),
    ...(query.radius && { radius: query.radius.toString() }),
  });

  const response = await fetch(`${BASE_URL}/api/location/nearby/personalized?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`개인화된 위치 기반 데이터 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 위치 기반 맛집 조회
 */
export async function getNearbyRestaurants(
  query: LocationQuery,
  accessToken: string
) {
  const params = new URLSearchParams({
    latitude: query.latitude.toString(),
    longitude: query.longitude.toString(),
    ...(query.radius && { radius: query.radius.toString() }),
  });

  const response = await fetch(`${BASE_URL}/api/location/restaurants?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`위치 기반 맛집 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 위치 기반 도서관 조회
 */
export async function getNearbyLibraries(
  query: LocationQuery,
  accessToken: string
) {
  const params = new URLSearchParams({
    latitude: query.latitude.toString(),
    longitude: query.longitude.toString(),
    ...(query.radius && { radius: query.radius.toString() }),
  });

  const response = await fetch(`${BASE_URL}/api/location/libraries?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`위치 기반 도서관 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 위치 기반 공원 조회
 */
export async function getNearbyParksFromBackend(
  query: LocationQuery,
  accessToken: string
) {
  const params = new URLSearchParams({
    latitude: query.latitude.toString(),
    longitude: query.longitude.toString(),
    ...(query.radius && { radius: query.radius.toString() }),
  });

  const response = await fetch(`${BASE_URL}/api/location/parks?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`위치 기반 공원 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 위치 기반 체육시설 조회
 */
export async function getNearbySportsFacilities(
  query: LocationQuery,
  accessToken: string
) {
  const params = new URLSearchParams({
    latitude: query.latitude.toString(),
    longitude: query.longitude.toString(),
    ...(query.radius && { radius: query.radius.toString() }),
  });

  const response = await fetch(`${BASE_URL}/api/location/sports-facilities?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`위치 기반 체육시설 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 위치 기반 무더위쉼터 조회 (백엔드 API)
 */
export async function getNearbyCoolingCentersFromBackend(
  query: LocationQuery,
  accessToken: string
) {
  const params = new URLSearchParams({
    latitude: query.latitude.toString(),
    longitude: query.longitude.toString(),
    ...(query.radius && { radius: query.radius.toString() }),
  });

  const response = await fetch(`${BASE_URL}/api/location/cooling-centers?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`위치 기반 무더위쉼터 조회 실패: ${response.status}`);
  }

  return response.json();
}

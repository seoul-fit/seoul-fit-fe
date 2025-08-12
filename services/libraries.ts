// services/libraries.ts - Libraries service implementation
import { Library } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

/**
 * 도서관 전체 조회
 */
export async function getAllLibraries(accessToken?: string): Promise<Library[]> {
  const response = await fetch(`${BASE_URL}/api/v1/libraries/all`, {
    method: 'GET',
    headers: {
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`도서관 전체 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 근처 도서관 조회
 */
export async function getNearbyLibraries(
  latitude: number,
  longitude: number,
  accessToken?: string
): Promise<Library[]> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
  });

  const response = await fetch(`${BASE_URL}/api/v1/libraries/nearby?${params}`, {
    method: 'GET',
    headers: {
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`근처 도서관 조회 실패: ${response.status}`);
  }

  return response.json();
}

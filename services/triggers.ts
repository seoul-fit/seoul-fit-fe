const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export interface LocationTriggerRequest {
  userId: string;
  latitude: number;
  longitude: number;
  radius?: number;
  triggerTypes?: string[];
}

/**
 * 위치 기반 트리거 평가 (성공 여부만 반환)
 */
export async function evaluateLocationTriggers(
  request: LocationTriggerRequest,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/api/triggers/evaluate/location`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      console.error('사용자 위치 기반 트리거 호출 실패:', response.status);
      return false;
    }

    return response.ok;
  } catch (error) {
    console.error('💥 위치 기반 트리거 평가 실패:', error);
    return false;
  }
}
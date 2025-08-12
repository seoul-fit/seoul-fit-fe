// services/triggers.ts - Triggers service implementation
import { TriggerEvaluationResult } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export interface LocationTriggerRequest {
  userId: string;
  latitude: number;
  longitude: number;
  radius: number;
}

/**
 * 위치 기반 트리거 평가
 */
export async function evaluateLocationTriggers(
  request: LocationTriggerRequest,
  accessToken: string
): Promise<TriggerEvaluationResult> {
  const response = await fetch(`${BASE_URL}/api/triggers/evaluate/location`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`위치 기반 트리거 평가 실패: ${response.status}`);
  }

  return response.json();
}

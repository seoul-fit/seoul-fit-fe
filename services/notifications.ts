// services/notifications.ts - Notifications service implementation
import { Notification } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

/**
 * 알림 목록 조회
 */
export async function getNotifications(accessToken: string): Promise<Notification[]> {
  const response = await fetch(`${BASE_URL}/api/notifications`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`알림 목록 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 알림 읽음 처리
 */
export async function markNotificationAsRead(
  notificationId: number,
  accessToken: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/notifications/${notificationId}/read`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`알림 읽음 처리 실패: ${response.status}`);
  }
}

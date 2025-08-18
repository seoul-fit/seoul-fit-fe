// services/notifications.ts - Notifications service implementation
import { Notification, NotificationPage } from '@/lib/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

/**
 * 알림 목록 조회
 */
export async function getNotifications(accessToken: string): Promise<Notification[]> {
  const response = await fetch(`${BASE_URL}/api/notifications`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`알림 목록 조회 실패: ${response.status}`);
  }

  return response.json();
}

/**
 * 읽지 않은 알림 개수 조회
 */
export async function getUnreadNotificationCount(
  userId: number,
  accessToken: string
): Promise<number> {
  try {
    const response = await fetch(`${BASE_URL}/api/notifications/unread-count?userId=${userId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`읽지 않은 알림 개수 조회 실패: ${response.status}`);
      return 0; // 백엔드 연결 실패 시 기본값 반환
    }

    return response.json();
  } catch (error) {
    // CORS 또는 네트워크 에러 시 기본값 반환
    console.warn('알림 서버 연결 실패:', error);
    return 0;
  }
}

/**
 * 알림 히스토리 조회 (페이지네이션)
 */
export async function getNotificationHistory(
  userId: number,
  accessToken: string,
  page: number = 0,
  size: number = 20
): Promise<NotificationPage> {
  const response = await fetch(
    `${BASE_URL}/api/notifications?userId=${userId}&page=${page}&size=${size}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`알림 히스토리 조회 실패: ${response.status}`);
  }

  const result = await response.json();

  return {
    content: result.content || [],
    pageNumber: result.pageNumber || 0,
    pageSize: result.pageSize || size,
    totalElements: result.totalElements || 0,
    totalPages: result.totalPages || 0,
    first: result.first || true,
    last: result.last || true,
  };
}

/**
 * 알림 읽음 처리
 */
export async function markNotificationAsRead(
  notificationId: number,
  userId: number,
  accessToken: string
): Promise<void> {
  const response = await fetch(
    `${BASE_URL}/api/notifications/${notificationId}/read?userId=${userId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`알림 읽음 처리 실패: ${response.status}`);
  }
}

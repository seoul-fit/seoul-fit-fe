import { create } from 'zustand';
import { getUnreadNotificationCount } from '@/services/notifications';

interface NotificationState {
  unreadCount: number;
  isLoading: boolean;
  fetchUnreadCount: (userId: number, accessToken: string) => Promise<void>;
  setUnreadCount: (count: number) => void;
  decrementUnreadCount: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  isLoading: false,

  fetchUnreadCount: async (userId: number, accessToken: string) => {
    set({ isLoading: true });
    try {
      const count = await getUnreadNotificationCount(userId, accessToken);
      set({ unreadCount: count, isLoading: false });
    } catch (error) {
      console.error('읽지 않은 알림 개수 조회 실패:', error);
      set({ isLoading: false });
    }
  },

  setUnreadCount: (count: number) => {
    set({ unreadCount: count });
  },

  decrementUnreadCount: () => {
    const currentCount = get().unreadCount;
    set({ unreadCount: Math.max(0, currentCount - 1) });
  },
}));
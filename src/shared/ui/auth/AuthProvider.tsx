'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/shared/model/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuthStatus } = useAuthStore();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return <>{children}</>;
}

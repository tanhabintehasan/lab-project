'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });
        const data = await res.json();
        if (mounted) {
          if (data?.success && data.data) {
            setUser(data.data);
          } else {
            setUser(null);
          }
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [setUser]);

  // Always render children immediately to avoid hydration/DOM replacement issues
  return children;
}

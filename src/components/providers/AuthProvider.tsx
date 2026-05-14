'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double-run in Strict Mode or re-mount scenarios.
    // We use a ref (not state) so this check does not trigger a render.
    if (initialized.current) return;
    initialized.current = true;

    let active = true;

    const initAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        });
        const data = await res.json();
        if (!active) return;

        if (data?.success && data.data) {
          setUser(data.data);
        } else {
          // Only clear user if currently set — prevents unnecessary
          // re-renders of every component subscribed to auth state.
          const currentUser = useAuthStore.getState().user;
          if (currentUser !== null) {
            setUser(null);
          }
        }
      } catch {
        if (!active) return;
        const currentUser = useAuthStore.getState().user;
        if (currentUser !== null) {
          setUser(null);
        }
      }
    };

    initAuth();

    return () => {
      active = false;
    };
  }, [setUser]);

  // Always render children immediately to avoid hydration/DOM replacement issues
  return children;
}

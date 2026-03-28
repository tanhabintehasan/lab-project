'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuthStore } from '@/store/auth-store';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export function RouteGuard({ children, allowedRoles, redirectTo = '/admin/dashboard' }: RouteGuardProps) {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkComplete, setCheckComplete] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      // Always fetch fresh user data from API to ensure accuracy
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();

        if (!isMounted) return;

        if (data.success && data.data) {
          // Update Zustand store with fresh data
          setUser(data.data);
          
          // Check if user role is allowed (SUPER_ADMIN bypasses all restrictions)
          const userRole = data.data.role;
          const isSuperAdmin = userRole === 'SUPER_ADMIN';
          const isAllowed = allowedRoles.includes(userRole);
          
          if (isSuperAdmin || isAllowed) {
            setAuthorized(true);
            setCheckComplete(true);
          } else {
            // User is not authorized for this page, redirect
            setAuthorized(false);
            setCheckComplete(true);
            router.replace(redirectTo);
          }
        } else {
          // Not authenticated, redirect to login
          if (isMounted) {
            setUser(null);
            router.replace('/auth/login');
          }
        }
      } catch (error) {
        if (isMounted) {
          setUser(null);
          router.replace('/auth/login');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, [allowedRoles, redirectTo, router, setUser]);

  // Don't render anything until check is complete
  if (loading || !checkComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // If not authorized, return null (redirect is happening in useEffect)
  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}

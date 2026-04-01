'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * React Query Provider
 * Wrap your app with this to enable React Query
 */
export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: data is considered fresh for 30 seconds
            staleTime: 30 * 1000,
            // Refetch on window focus
            refetchOnWindowFocus: true,
            // Refetch on mount if data is stale
            refetchOnMount: true,
            // Retry failed requests
            retry: (failureCount, error: any) => {
              // Don't retry on 401/403 (auth errors)
              if (error?.status === 401 || error?.status === 403) {
                return false;
              }
              // Retry up to 2 times for other errors
              return failureCount < 2;
            },
            // Retry delay with exponential backoff
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
          },
          mutations: {
            // Don't retry mutations by default
            retry: false
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

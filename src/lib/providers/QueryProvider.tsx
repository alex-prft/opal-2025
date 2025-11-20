'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React, { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  /**
   * REACT HOOK SAFETY PATTERN
   *
   * Problem: Next.js static generation can execute this provider before React is initialized,
   * causing "Cannot read properties of null (reading 'useState')" build failures.
   *
   * Solution: Provide mock QueryClient during static generation so components can use React Query hooks safely.
   * - During static generation: Provide static QueryClient instance
   * - During runtime: Normal React Query provider behavior
   *
   * Performance: Zero runtime impact - check only runs during build phase
   * Reference: docs/react-hook-static-generation-troubleshooting.md
   */
  if (typeof window === 'undefined') {
    // Provide static QueryClient during static generation
    const staticQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          gcTime: 10 * 60 * 1000,
          // Disable queries during static generation
          enabled: false,
          retry: false,
        },
      },
    });

    return (
      <QueryClientProvider client={staticQueryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
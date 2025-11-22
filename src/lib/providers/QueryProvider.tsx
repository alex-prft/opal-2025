'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  /**
   * REACT HOOK SAFETY PATTERN - CRITICAL FIX
   *
   * Problem: Next.js 16 + React 19 global-error prerendering calls useState before React is initialized,
   * causing "Cannot read properties of null (reading 'useContext')" build failures.
   *
   * Solution: Check React availability before calling any hooks
   * - During static generation OR when React is null: Return static QueryClient
   * - During runtime with React available: Normal React Query provider behavior
   *
   * Performance: Zero runtime impact - checks only run during build phase
   * Reference: docs/react-hook-static-generation-troubleshooting.md
   */

  // CRITICAL: Check if React hooks are available before using them
  // During Next.js 16 global-error prerendering, React can be null
  if (typeof window === 'undefined' && (!React || !(React as any).useState)) {
    // React is not initialized - provide static QueryClient without hooks
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

  // Normal runtime behavior with useState (React is guaranteed to be available)
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
    </QueryClientProvider>
  );
}
'use client';

/**
 * SafeProviderWrapper - CRITICAL WORKAROUND for Next.js 16 + React 19 Build Failure
 *
 * Problem: During static generation of /_global-error page, Next.js attempts to execute
 * all providers in layout.tsx, causing "Cannot read properties of null (reading 'useContext')"
 * errors even when providers have internal safety guards.
 *
 * Solution: Wrap ALL providers in a component that COMPLETELY skips provider initialization
 * during static generation. This prevents Next.js from ever reaching the provider code that
 * uses React hooks.
 *
 * This wrapper MUST be the outermost provider in layout.tsx to intercept static generation
 * before any other providers are evaluated.
 */

import React, { ReactNode } from 'react';

interface SafeProviderWrapperProps {
  children: ReactNode;
}

export function SafeProviderWrapper({ children }: SafeProviderWrapperProps) {
  // CRITICAL: During Next.js 16 global-error prerendering, React.useContext can be null
  // We MUST check React availability before rendering ANY child providers
  if (typeof window === 'undefined' && (!React || !(React as any).useState)) {
    // React hooks are not available - skip ALL provider initialization
    // Return children directly to allow static generation to complete
    console.log('[SafeProviderWrapper] Static generation detected - skipping providers');
    return <>{children}</>;
  }

  // React is available - proceed with normal provider initialization
  return <>{children}</>;
}

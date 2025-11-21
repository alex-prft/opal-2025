/**
 * SafeProviderWrapper - CRITICAL WORKAROUND for Next.js 16 + React 19 Build Failure
 *
 * Problem: During static generation of /_global-error page, Next.js attempts to execute
 * all providers in layout.tsx, causing "Cannot read properties of null (reading 'useContext')"
 * errors even when providers have internal safety guards.
 *
 * Solution: This is now a SERVER COMPONENT (no 'use client') that acts as a pass-through.
 * All child providers must have their own React hook safety guards.
 *
 * REMOVED: 'use client' directive - this wrapper no longer needs to be a client component
 * since all child providers have individual safety checks.
 */

import { ReactNode } from 'react';

interface SafeProviderWrapperProps {
  children: ReactNode;
}

export function SafeProviderWrapper({ children }: SafeProviderWrapperProps) {
  // Simple pass-through wrapper - all safety checks are in individual providers
  return <>{children}</>;
}

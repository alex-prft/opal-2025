/**
 * Date formatting utilities that prevent hydration mismatches
 * between server and client rendering
 */

'use client';

import React, { useState, useEffect } from 'react';

/**
 * Hook to safely format dates that avoids hydration mismatches
 * Returns null on server-side and formatted date on client-side
 */
export function useSafeDate(dateInput?: string | Date | null): {
  formattedTime: string | null;
  formattedDate: string | null;
  formattedDateTime: string | null;
  isLoaded: boolean;
} {
  // CRITICAL: React hook safety during Next.js static generation
  // During static generation, React hooks are null and cause useState/useEffect errors
  if (typeof window === 'undefined' && (!React || !useState || !useEffect)) {
    // Safe fallback for static generation - return unloaded state
    return {
      formattedTime: null,
      formattedDate: null,
      formattedDateTime: null,
      isLoaded: false,
    };
  }

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !dateInput) {
    return {
      formattedTime: null,
      formattedDate: null,
      formattedDateTime: null,
      isLoaded: isClient,
    };
  }

  const date = new Date(dateInput);

  // Validate date
  if (isNaN(date.getTime())) {
    return {
      formattedTime: null,
      formattedDate: null,
      formattedDateTime: null,
      isLoaded: true,
    };
  }

  return {
    formattedTime: date.toLocaleTimeString(),
    formattedDate: date.toLocaleDateString(),
    formattedDateTime: date.toLocaleString(),
    isLoaded: true,
  };
}

/**
 * Safe date formatter component that prevents hydration mismatches
 */
interface SafeDateProps {
  date?: string | Date | null;
  format?: 'time' | 'date' | 'datetime';
  fallback?: string;
  className?: string;
}

export function SafeDate({
  date,
  format = 'datetime',
  fallback = '—',
  className = ''
}: SafeDateProps) {
  const { formattedTime, formattedDate, formattedDateTime, isLoaded } = useSafeDate(date);

  if (!isLoaded) {
    // Return fallback or loading state during SSR
    return <span className={className}>{fallback}</span>;
  }

  const formatted =
    format === 'time' ? formattedTime :
    format === 'date' ? formattedDate :
    formattedDateTime;

  return (
    <span className={className} suppressHydrationWarning>
      {formatted || fallback}
    </span>
  );
}

/**
 * Utility function for safe date formatting without React hooks
 * Should only be used in client-side contexts
 */
export function formatDateSafe(
  dateInput?: string | Date | null,
  format: 'time' | 'date' | 'datetime' = 'datetime'
): string {
  if (typeof window === 'undefined' || !dateInput) {
    return '—';
  }

  const date = new Date(dateInput);

  if (isNaN(date.getTime())) {
    return '—';
  }

  switch (format) {
    case 'time':
      return date.toLocaleTimeString();
    case 'date':
      return date.toLocaleDateString();
    case 'datetime':
    default:
      return date.toLocaleString();
  }
}
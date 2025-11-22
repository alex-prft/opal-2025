import { useState, useEffect, useCallback, useRef } from 'react';

export interface OsaRecentStatus {
  /** Timestamp of the last successful webhook reception (ISO 8601) */
  lastWebhookAt: string | null;
  /** Timestamp of the last agent data reception (ISO 8601) */
  lastAgentDataAt: string | null;
  /** Timestamp of the last Force Sync execution (ISO 8601) */
  lastForceSyncAt: string | null;
  /** Current workflow execution status */
  lastWorkflowStatus: 'idle' | 'running' | 'completed' | 'failed';
}

export interface UseRecentOsaStatusOptions {
  /** Whether the query should be enabled (default: true) */
  enabled?: boolean;
  /** Stale time in milliseconds (default: 5 minutes) */
  staleTime?: number;
  /** Whether to refetch on window focus (default: false) */
  refetchOnWindowFocus?: boolean;
}

export interface UseRecentOsaStatusResult {
  data: OsaRecentStatus | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Native React hook for fetching OSA recent status without streaming.
 * Replaces aggressive SSE polling with simple HTTP requests for better performance.
 * Maintains intelligent caching and retry logic from React Query.
 */
export function useRecentOsaStatus(
  options: UseRecentOsaStatusOptions = {}
): UseRecentOsaStatusResult {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes intelligent caching
    refetchOnWindowFocus = false
  } = options;

  const [data, setData] = useState<OsaRecentStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchRef = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (retryCount = 0) => {
    // Check if data is still fresh
    const now = Date.now();
    if (data && (now - lastFetchRef.current) < staleTime) {
      return;
    }

    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/osa/recent-status', {
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) {
        throw new Error(
          `Failed to load OSA recent status: ${res.status} ${res.statusText}`
        );
      }

      const result = await res.json();
      setData(result);
      lastFetchRef.current = now;
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled, don't update state
      }

      const error = err instanceof Error ? err : new Error('Unknown error');

      // Retry logic: max 3 retries with exponential backoff
      if (retryCount < 3) {
        const delay = Math.min(1000 * 2 ** retryCount, 30000);
        retryTimeoutRef.current = setTimeout(() => {
          fetchData(retryCount + 1);
        }, delay);
      } else {
        setError(error);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [data, staleTime]);

  const refetch = useCallback(() => {
    // Clear stale data timestamp to force refetch
    lastFetchRef.current = 0;
    fetchData();
  }, [fetchData]);

  // Initial fetch and enabled state handling
  useEffect(() => {
    if (!enabled) return;

    fetchData();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [enabled, fetchData]);

  // Handle refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus || !enabled) return;

    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, enabled, fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
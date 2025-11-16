import { useQuery, UseQueryResult } from '@tanstack/react-query';

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

/**
 * React Query hook for fetching OSA recent status without streaming.
 * Replaces aggressive SSE polling with simple HTTP requests for better performance.
 */
export function useRecentOsaStatus(
  options: UseRecentOsaStatusOptions = {}
): UseQueryResult<OsaRecentStatus, Error> {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes intelligent caching
    refetchOnWindowFocus = false
  } = options;

  return useQuery<OsaRecentStatus, Error>({
    queryKey: ['osa-recent-status'],
    queryFn: async ({ signal }): Promise<OsaRecentStatus> => {
      const res = await fetch('/api/admin/osa/recent-status', { signal });
      if (!res.ok) {
        throw new Error(
          `Failed to load OSA recent status: ${res.status} ${res.statusText}`
        );
      }
      return res.json();
    },
    enabled,
    refetchOnWindowFocus,
    staleTime,
    retry: 3,
    retryDelay: (attemptIndex) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
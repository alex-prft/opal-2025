import { useState, useEffect, useCallback, useRef } from 'react';

export interface IntegrationStatus {
  overallStatus: 'green' | 'red' | 'yellow';
  summary: string;
  validatedAt: string;
  workflowId: string;
  correlationId: string | null;

  forceSync: {
    lastAt: string | null;
    status: string | null;
    agentCount: number | null;
  };

  opal: {
    workflowStatus: string | null;
    agentStatuses: Record<string, string>;
    agentResponseCount: number;
  };

  osa: {
    lastWebhookAt: string | null;
    lastAgentDataAt: string | null;
    lastForceSyncAt: string | null;
    workflowData: any;
    receptionRate: number;
  };

  health: {
    overallStatus: string | null;
    signatureValidRate: number;
    errorRate24h: number;
    lastWebhookMinutesAgo: number;
  };

  errors: any;

  meta: {
    tenantId: string | null;
    validationStatus: string;
    recordId: string;
  };
}

export interface IntegrationStatusResponse {
  success: boolean;
  integrationStatus?: IntegrationStatus;
  error?: string;
  fallback?: boolean;
  hint?: string;
}

export interface UseIntegrationStatusResult {
  data: IntegrationStatusResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useIntegrationStatus(
  forceSyncWorkflowId?: string,
  tenantId?: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
  }
): UseIntegrationStatusResult {
  const {
    enabled = true,
    staleTime = 2 * 60 * 1000, // 2 minutes default
    refetchInterval = false
  } = options || {};

  const [data, setData] = useState<IntegrationStatusResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
      const params = new URLSearchParams();
      if (forceSyncWorkflowId) {
        params.append('forceSyncWorkflowId', forceSyncWorkflowId);
      }
      if (tenantId) {
        params.append('tenantId', tenantId);
      }

      const url = `/api/admin/osa/integration-status${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, {
        signal: abortControllerRef.current.signal
      });
      const responseData = await res.json();

      // Handle expected fallback responses gracefully
      if (!res.ok) {
        // Check if this is an expected fallback response (503 with fallback flag)
        if (res.status === 503 && responseData.fallback === true) {
          // Return the fallback response data instead of throwing
          const fallbackData = {
            success: false,
            error: responseData.error,
            fallback: true,
            hint: responseData.hint
          };
          setData(fallbackData);
          lastFetchRef.current = now;
          return;
        }

        // For other non-OK responses, throw an error
        throw new Error(`Failed to load integration status: ${res.status} ${res.statusText}`);
      }

      setData(responseData);
      lastFetchRef.current = now;
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled, don't update state
      }

      const error = err instanceof Error ? err : new Error('Unknown error');

      // Don't retry on 404 (no records found)
      if (error.message.includes('404')) {
        setError(error);
        return;
      }

      // Retry logic: max 3 retries
      if (retryCount < 3) {
        setTimeout(() => {
          fetchData(retryCount + 1);
        }, 1000 * (retryCount + 1));
      } else {
        setError(error);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [forceSyncWorkflowId, tenantId, data, staleTime]);

  const refetch = useCallback(() => {
    // Clear stale data timestamp to force refetch
    lastFetchRef.current = 0;
    fetchData();
  }, [fetchData]);

  // Initial fetch and enabled state handling
  useEffect(() => {
    if (!enabled) return;

    fetchData();

    // Setup interval if specified
    if (refetchInterval && typeof refetchInterval === 'number') {
      intervalRef.current = setInterval(() => {
        fetchData();
      }, refetchInterval);
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, fetchData, refetchInterval]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

export function useLatestIntegrationStatus() {
  return useIntegrationStatus(undefined, undefined, {
    staleTime: 1 * 60 * 1000, // 1 minute for latest status
    refetchInterval: 30 * 1000 // Auto-refresh every 30 seconds
  });
}

/**
 * Hook for monitoring a specific Force Sync workflow validation
 */
export function useForceSyncValidation(
  forceSyncWorkflowId: string,
  options?: {
    pollUntilComplete?: boolean;
    maxPollDuration?: number; // in milliseconds
  }
): UseIntegrationStatusResult {
  const {
    pollUntilComplete = false,
    maxPollDuration = 5 * 60 * 1000
  } = options || {};

  const [data, setData] = useState<IntegrationStatusResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxPollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const staleTime = 30 * 1000; // 30 seconds

  const shouldContinuePolling = useCallback((responseData: IntegrationStatusResponse | undefined) => {
    if (!pollUntilComplete || !responseData?.success || !responseData.integrationStatus) {
      return false;
    }

    const status = responseData.integrationStatus.overallStatus;
    return status === 'yellow' ||
           !responseData.integrationStatus.forceSync?.status ||
           responseData.integrationStatus.forceSync.status === 'running';
  }, [pollUntilComplete]);

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
      const res = await fetch(
        `/api/admin/osa/integration-status?forceSyncWorkflowId=${encodeURIComponent(forceSyncWorkflowId)}`,
        { signal: abortControllerRef.current.signal }
      );
      const responseData = await res.json();

      // Handle expected fallback responses gracefully
      if (!res.ok) {
        // Check if this is an expected fallback response (503 with fallback flag)
        if (res.status === 503 && responseData.fallback === true) {
          // Return the fallback response data instead of throwing
          const fallbackData = {
            success: false,
            error: responseData.error,
            fallback: true,
            hint: responseData.hint
          };
          setData(fallbackData);
          lastFetchRef.current = now;
          return;
        }

        // For other non-OK responses, throw an error
        throw new Error(`Failed to load Force Sync validation: ${res.status} ${res.statusText}`);
      }

      setData(responseData);
      lastFetchRef.current = now;
      setError(null);

      // Setup polling if needed
      if (shouldContinuePolling(responseData)) {
        intervalRef.current = setTimeout(() => {
          fetchData();
        }, 10 * 1000); // Poll every 10 seconds
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled, don't update state
      }

      const error = err instanceof Error ? err : new Error('Unknown error');

      // Retry logic: max 3 retries
      if (retryCount < 3) {
        setTimeout(() => {
          fetchData(retryCount + 1);
        }, 1000 * (retryCount + 1));
      } else {
        setError(error);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [forceSyncWorkflowId, data, staleTime, shouldContinuePolling]);

  const refetch = useCallback(() => {
    // Clear stale data timestamp to force refetch
    lastFetchRef.current = 0;
    fetchData();
  }, [fetchData]);

  // Initial fetch and enabled state handling
  useEffect(() => {
    if (!forceSyncWorkflowId) return;

    fetchData();

    // Setup max polling duration timeout
    if (pollUntilComplete) {
      maxPollTimeoutRef.current = setTimeout(() => {
        if (intervalRef.current) {
          clearTimeout(intervalRef.current);
          intervalRef.current = null;
        }
      }, maxPollDuration);
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
      if (maxPollTimeoutRef.current) {
        clearTimeout(maxPollTimeoutRef.current);
      }
    };
  }, [forceSyncWorkflowId, fetchData, pollUntilComplete, maxPollDuration]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

export interface CreateIntegrationValidationData {
  tenantId?: string;
  forceSyncWorkflowId: string;
  opalCorrelationId?: string;
  overallStatus: 'green' | 'red' | 'yellow';
  summary: string;
  forceSyncData?: any;
  opalData?: any;
  osaData?: any;
  healthData?: any;
  errors?: any;
}

export interface UseCreateIntegrationValidationResult {
  mutateAsync: (validationData: CreateIntegrationValidationData) => Promise<any>;
}

/**
 * Mutation hook for creating integration validation records
 */
export function useCreateIntegrationValidation(): UseCreateIntegrationValidationResult {
  const mutateAsync = useCallback(async (validationData: CreateIntegrationValidationData) => {
    const res = await fetch('/api/admin/osa/integration-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validationData),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
    }

    return res.json();
  }, []);

  return {
    mutateAsync
  };
}
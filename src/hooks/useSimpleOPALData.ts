/**
 * Simple OPAL Data Hook (SOP-Free)
 *
 * React hook for fetching OPAL data without any SOP validation or restrictions.
 * Focuses on functionality and ease of use over compliance.
 */

import { useState, useEffect, useCallback } from 'react';
import { simpleOpalService, TierDataResponse } from '@/lib/simple-opal-data-service';

export interface UseOPALDataOptions {
  enabled?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  refreshInterval?: number;
}

export interface UseOPALDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  metadata: any;
  refresh: () => Promise<void>;
  isStale: boolean;
}

/**
 * Simple OPAL data fetching hook
 */
export function useSimpleOPALData<T = any>(
  tier1: string,
  tier2?: string,
  tier3?: string,
  options: UseOPALDataOptions = {}
): UseOPALDataResult<T> {
  const {
    enabled = true,
    retryAttempts = 2,
    retryDelay = 1000,
    refreshInterval
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  const fetchData = useCallback(async (isRetry = false): Promise<void> => {
    if (!enabled) return;

    if (!isRetry) {
      setLoading(true);
      setError(null);
    }

    let retryCount = 0;

    while (retryCount <= retryAttempts) {
      try {
        console.log(`🔄 [Simple OPAL Hook] Fetching data for ${tier1}${tier2 ? `.${tier2}` : ''}${tier3 ? `.${tier3}` : ''}`);

        const response: TierDataResponse<T> = await simpleOpalService.fetchTierData<T>(tier1, tier2, tier3);

        setData(response.data);
        setMetadata(response.metadata);
        setIsStale(response.metadata.freshness !== 'fresh');
        setError(null);

        console.log(`✅ [Simple OPAL Hook] Data loaded successfully from ${response.metadata.source}`);
        break;

      } catch (fetchError: any) {
        console.error(`❌ [Simple OPAL Hook] Fetch attempt ${retryCount + 1} failed:`, fetchError);

        if (retryCount < retryAttempts) {
          retryCount++;
          console.log(`🔄 [Simple OPAL Hook] Retrying in ${retryDelay}ms... (attempt ${retryCount}/${retryAttempts})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          // Final failure - set error state
          setError(fetchError.message || 'Failed to fetch data');
          setData(null);
          setMetadata(null);
          console.error(`💥 [Simple OPAL Hook] All retry attempts exhausted`);
          break;
        }
      }
    }

    if (!isRetry) {
      setLoading(false);
    }
  }, [tier1, tier2, tier3, enabled, retryAttempts, retryDelay]);

  // Manual refresh function
  const refresh = useCallback(async (): Promise<void> => {
    console.log(`🔄 [Simple OPAL Hook] Manual refresh requested`);
    await fetchData(false);
  }, [fetchData]);

  // Initial data fetch
  useEffect(() => {
    if (enabled) {
      fetchData(false);
    }
  }, [fetchData, enabled]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval && enabled && !loading) {
      const interval = setInterval(() => {
        console.log(`⏰ [Simple OPAL Hook] Auto-refresh triggered`);
        fetchData(true);
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, enabled, loading, fetchData]);

  return {
    data,
    loading,
    error,
    metadata,
    refresh,
    isStale
  };
}

/**
 * Hook for fetching multiple tier data simultaneously
 */
export function useSimpleMultiTierData(
  tier1: string,
  tier2?: string,
  tier3?: string,
  options: UseOPALDataOptions = {}
) {
  const tier1Data = useSimpleOPALData(tier1, undefined, undefined, options);
  const tier2Data = useSimpleOPALData(tier1, tier2, undefined, {
    ...options,
    enabled: options.enabled && !!tier2
  });
  const tier3Data = useSimpleOPALData(tier1, tier2, tier3, {
    ...options,
    enabled: options.enabled && !!tier3
  });

  const loading = tier1Data.loading || tier2Data.loading || tier3Data.loading;
  const error = tier1Data.error || tier2Data.error || tier3Data.error;

  const refresh = useCallback(async () => {
    const promises = [tier1Data.refresh()];
    if (tier2) promises.push(tier2Data.refresh());
    if (tier3) promises.push(tier3Data.refresh());
    await Promise.all(promises);
  }, [tier1Data.refresh, tier2Data.refresh, tier3Data.refresh, tier2, tier3]);

  return {
    tier1: tier1Data,
    tier2: tier2Data,
    tier3: tier3Data,
    loading,
    error,
    refresh
  };
}

/**
 * Specialized hook for strategy data
 */
export function useStrategyData(options: UseOPALDataOptions = {}) {
  return useSimpleOPALData('strategy', 'plans', undefined, options);
}

/**
 * Specialized hook for insights data
 */
export function useInsightsData(options: UseOPALDataOptions = {}) {
  return useSimpleOPALData('insights', 'content', undefined, options);
}

/**
 * Specialized hook for optimization data
 */
export function useOptimizationData(options: UseOPALDataOptions = {}) {
  return useSimpleOPALData('optimization', 'experimentation', undefined, options);
}

/**
 * Specialized hook for DXP tools data
 */
export function useDXPToolsData(options: UseOPALDataOptions = {}) {
  return useSimpleOPALData('dxptools', 'webx', undefined, options);
}
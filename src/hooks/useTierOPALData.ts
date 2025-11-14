/**
 * Enhanced OPAL Data Hook with Tier-Specific Integration
 * Fetches tier-1 summary metrics, tier-2 section KPIs, and tier-3 detailed content
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  opalDataService,
  TierDataRequest,
  TierDataResponse,
  Tier1SummaryMetrics,
  Tier2SectionKPIs,
  Tier3DetailedContent
} from '@/lib/opal-data-service';

export interface TierOPALDataResult {
  // Tier-1: Summary metrics (always available)
  tier1: {
    data: Tier1SummaryMetrics | null;
    loading: boolean;
    error: string | null;
    metadata?: TierDataResponse['metadata'];
  };

  // Tier-2: Section KPIs (available when tier2 specified)
  tier2: {
    data: Tier2SectionKPIs | null;
    loading: boolean;
    error: string | null;
    metadata?: TierDataResponse['metadata'];
  };

  // Tier-3: Detailed content (available when tier3 specified)
  tier3: {
    data: Tier3DetailedContent | null;
    loading: boolean;
    error: string | null;
    metadata?: TierDataResponse['metadata'];
  };

  // Combined state and actions
  isLoading: boolean;
  hasError: boolean;
  refresh: () => Promise<void>;
  clearCache: () => void;
}

export function useTierOPALData(
  tier1: string,
  tier2?: string,
  tier3?: string,
  options: {
    refreshInterval?: number;
    enableAutoRefresh?: boolean;
    prefetchTiers?: boolean;
  } = {}
): TierOPALDataResult {

  const {
    refreshInterval = 60000, // 1 minute default
    enableAutoRefresh = true,
    prefetchTiers = true
  } = options;

  // State for each tier
  const [tier1State, setTier1State] = useState({
    data: null as Tier1SummaryMetrics | null,
    loading: true,
    error: null as string | null,
    metadata: undefined as TierDataResponse['metadata'] | undefined
  });

  const [tier2State, setTier2State] = useState({
    data: null as Tier2SectionKPIs | null,
    loading: false,
    error: null as string | null,
    metadata: undefined as TierDataResponse['metadata'] | undefined
  });

  const [tier3State, setTier3State] = useState({
    data: null as Tier3DetailedContent | null,
    loading: false,
    error: null as string | null,
    metadata: undefined as TierDataResponse['metadata'] | undefined
  });

  // Refs for managing intervals and preventing stale closures
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestRef = useRef<string>('');

  // Create request identifier for change detection
  const requestId = `${tier1}:${tier2 || ''}:${tier3 || ''}`;

  // Fetch data for all applicable tiers
  const fetchTierData = useCallback(async () => {
    const request: TierDataRequest = { tier1, tier2, tier3 };
    currentRequestRef.current = requestId;

    try {
      // Set loading states
      setTier1State(prev => ({ ...prev, loading: true, error: null }));
      if (tier2) {
        setTier2State(prev => ({ ...prev, loading: true, error: null }));
      }
      if (tier3 && tier2) {
        setTier3State(prev => ({ ...prev, loading: true, error: null }));
      }

      // Fetch data based on strategy
      if (prefetchTiers) {
        // Fetch all tiers in parallel for better performance
        const results = await opalDataService.fetchAllTierData(request);

        // Only update if this is still the current request
        if (currentRequestRef.current === requestId) {
          setTier1State({
            data: results.tier1.data,
            loading: false,
            error: results.tier1.error || null,
            metadata: results.tier1.metadata
          });

          if (tier2 && results.tier2) {
            setTier2State({
              data: results.tier2.data,
              loading: false,
              error: results.tier2.error || null,
              metadata: results.tier2.metadata
            });
          }

          if (tier3 && tier2 && results.tier3) {
            setTier3State({
              data: results.tier3.data,
              loading: false,
              error: results.tier3.error || null,
              metadata: results.tier3.metadata
            });
          }
        }
      } else {
        // Sequential fetching for lower resource usage
        const tier1Result = await opalDataService.fetchTier1Data(tier1);
        if (currentRequestRef.current === requestId) {
          setTier1State({
            data: tier1Result.data,
            loading: false,
            error: tier1Result.error || null,
            metadata: tier1Result.metadata
          });
        }

        if (tier2 && currentRequestRef.current === requestId) {
          const tier2Result = await opalDataService.fetchTier2Data(tier1, tier2);
          if (currentRequestRef.current === requestId) {
            setTier2State({
              data: tier2Result.data,
              loading: false,
              error: tier2Result.error || null,
              metadata: tier2Result.metadata
            });
          }
        }

        if (tier3 && tier2 && currentRequestRef.current === requestId) {
          const tier3Result = await opalDataService.fetchTier3Data(tier1, tier2, tier3);
          if (currentRequestRef.current === requestId) {
            setTier3State({
              data: tier3Result.data,
              loading: false,
              error: tier3Result.error || null,
              metadata: tier3Result.metadata
            });
          }
        }
      }

    } catch (error) {
      console.error('Error fetching tier data:', error);

      if (currentRequestRef.current === requestId) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        setTier1State(prev => ({ ...prev, loading: false, error: errorMessage }));
        if (tier2) {
          setTier2State(prev => ({ ...prev, loading: false, error: errorMessage }));
        }
        if (tier3 && tier2) {
          setTier3State(prev => ({ ...prev, loading: false, error: errorMessage }));
        }
      }
    }
  }, [tier1, tier2, tier3, requestId, prefetchTiers]);

  // Setup auto-refresh interval
  useEffect(() => {
    if (enableAutoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        // Only refresh if data is stale or expired
        const shouldRefresh =
          tier1State.metadata?.freshness === 'stale' ||
          tier1State.metadata?.freshness === 'expired' ||
          (tier2State.metadata?.freshness === 'stale') ||
          (tier3State.metadata?.freshness === 'stale');

        if (shouldRefresh) {
          fetchTierData();
        }
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [enableAutoRefresh, refreshInterval, fetchTierData, tier1State.metadata, tier2State.metadata, tier3State.metadata]);

  // Initial data fetch and refetch on parameter changes
  useEffect(() => {
    fetchTierData();
  }, [fetchTierData]);

  // Reset tier-2 and tier-3 state when parameters change
  useEffect(() => {
    if (!tier2) {
      setTier2State({ data: null, loading: false, error: null, metadata: undefined });
    }
    if (!tier3 || !tier2) {
      setTier3State({ data: null, loading: false, error: null, metadata: undefined });
    }
  }, [tier2, tier3]);

  // Clear cache function
  const clearCache = useCallback(() => {
    opalDataService.clearCache(`${tier1}`);
  }, [tier1]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchTierData();
  }, [fetchTierData]);

  // Computed properties
  const isLoading = tier1State.loading ||
    (tier2 ? tier2State.loading : false) ||
    (tier3 && tier2 ? tier3State.loading : false);

  const hasError = Boolean(tier1State.error || tier2State.error || tier3State.error);

  return {
    tier1: tier1State,
    tier2: tier2State,
    tier3: tier3State,
    isLoading,
    hasError,
    refresh,
    clearCache
  };
}

/**
 * Lightweight hook for single-tier data fetching
 */
export function useTier1Data(tier1: string) {
  const { tier1: result, refresh, clearCache } = useTierOPALData(tier1);

  return {
    data: result.data,
    loading: result.loading,
    error: result.error,
    metadata: result.metadata,
    refresh,
    clearCache
  };
}

export function useTier2Data(tier1: string, tier2: string) {
  const { tier2: result, refresh, clearCache } = useTierOPALData(tier1, tier2);

  return {
    data: result.data,
    loading: result.loading,
    error: result.error,
    metadata: result.metadata,
    refresh,
    clearCache
  };
}

export function useTier3Data(tier1: string, tier2: string, tier3: string) {
  const { tier3: result, refresh, clearCache } = useTierOPALData(tier1, tier2, tier3);

  return {
    data: result.data,
    loading: result.loading,
    error: result.error,
    metadata: result.metadata,
    refresh,
    clearCache
  };
}
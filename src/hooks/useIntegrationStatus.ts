import { useQuery } from '@tanstack/react-query';

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
}

export function useIntegrationStatus(
  forceSyncWorkflowId?: string,
  tenantId?: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
  }
) {
  return useQuery<IntegrationStatusResponse>({
    queryKey: ['osa-integration-status', forceSyncWorkflowId, tenantId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (forceSyncWorkflowId) {
        params.append('forceSyncWorkflowId', forceSyncWorkflowId);
      }
      if (tenantId) {
        params.append('tenantId', tenantId);
      }

      const url = `/api/admin/osa/integration-status${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Failed to load integration status: ${res.status} ${res.statusText}`);
      }
      
      return res.json();
    },
    staleTime: options?.staleTime ?? 2 * 60 * 1000, // 2 minutes default
    refetchInterval: options?.refetchInterval ?? false, // No auto-refetch by default
    enabled: options?.enabled ?? true,
    retry: (failureCount, error) => {
      // Don't retry on 404 (no records found)
      if (error.message.includes('404')) {
        return false;
      }
      return failureCount < 3;
    }
  });
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
) {
  const { pollUntilComplete = false, maxPollDuration = 5 * 60 * 1000 } = options || {};

  return useQuery<IntegrationStatusResponse>({
    queryKey: ['force-sync-validation', forceSyncWorkflowId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/osa/integration-status?forceSyncWorkflowId=${encodeURIComponent(forceSyncWorkflowId)}`);
      
      if (!res.ok) {
        throw new Error(`Failed to load Force Sync validation: ${res.status} ${res.statusText}`);
      }
      
      return res.json();
    },
    enabled: !!forceSyncWorkflowId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: (data) => {
      // If polling is enabled and status is not final, keep polling
      if (pollUntilComplete && data?.integrationStatus) {
        const status = data.integrationStatus.overallStatus;
        if (status === 'yellow' || !data.integrationStatus.forceSync.status || 
            data.integrationStatus.forceSync.status === 'running') {
          return 10 * 1000; // Poll every 10 seconds
        }
      }
      return false; // Stop polling
    },
    refetchIntervalInBackground: false,
    retry: 3
  });
}

/**
 * Mutation hook for creating integration validation records
 */
export function useCreateIntegrationValidation() {
  return {
    mutateAsync: async (validationData: {
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
    }) => {
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
    }
  };
}
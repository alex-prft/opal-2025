/**
 * Unified Force Sync Hook
 * Consistent force sync behavior across all components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchWithRetry, RetryPresets } from '@/lib/utils/fetch-with-retry';

export interface ForceSyncOptions {
  sync_scope?: 'quick' | 'full';
  client_context?: {
    client_name?: string;
    industry?: string;
    recipients?: string[];
  };
  triggered_by?: string;
  onProgress?: (progress: number, message: string) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export interface SyncStatus {
  status: 'idle' | 'loading' | 'polling' | 'completed' | 'failed' | 'timeout';
  progress: number;
  message: string;
  session_id?: string;
  correlation_id?: string;
  started_at?: string;
  error?: string;
  result?: any;
}

export function useForceSyncUnified() {
  // CRITICAL: React hook safety during Next.js static generation
  // During static generation, React can be null, so check before using hooks
  if (typeof window === 'undefined') {
    // Return safe fallback object during static generation
    return {
      syncStatus: {
        status: 'idle' as const,
        progress: 0,
        message: 'Unavailable during static generation'
      },
      startSync: async () => ({ success: false, error: 'Unavailable during static generation' }),
      stopSync: () => {},
      resetSync: () => {}
    };
  }

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'idle',
    progress: 0,
    message: ''
  });

  const pollingRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const triggerSync = useCallback(async (options: ForceSyncOptions = {}) => {
    // Clear any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // Create new abort controller for this sync
    abortControllerRef.current = new AbortController();

    setSyncStatus({
      status: 'loading',
      progress: 0,
      message: 'Initiating force sync...',
      started_at: new Date().toISOString()
    });

    try {
      // Check for active syncs first
      const activeCheckResult = await fetchWithRetry(
        '/api/force-sync/trigger',
        {
          method: 'GET',
          signal: abortControllerRef.current.signal
        },
        RetryPresets.standard
      );

      if (activeCheckResult.success && activeCheckResult.data.has_active_sync) {
        const activeSync = activeCheckResult.data.active_syncs[0];
        setSyncStatus({
          status: 'polling',
          progress: activeSync.progress || 0,
          message: 'Resuming existing sync operation...',
          session_id: activeSync.session_id,
          started_at: activeSync.started_at
        });

        startPolling(activeSync.session_id, options);
        return;
      }

      // Trigger new sync
      const triggerResult = await fetchWithRetry(
        '/api/force-sync/trigger',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sync_scope: options.sync_scope || 'quick',
            client_context: options.client_context,
            triggered_by: options.triggered_by || 'ui_component',
            metadata: {
              component: 'useForceSyncUnified',
              user_initiated: true
            }
          }),
          signal: abortControllerRef.current.signal
        },
        RetryPresets.standard
      );

      if (!triggerResult.success) {
        throw new Error(triggerResult.error || 'Failed to trigger sync');
      }

      const result = triggerResult.data;

      setSyncStatus(prev => ({
        ...prev,
        status: 'polling',
        progress: 10,
        message: 'Sync initiated, monitoring progress...',
        session_id: result.session_id,
        correlation_id: result.correlation_id
      }));

      if (result.session_id) {
        startPolling(result.session_id, options);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      setSyncStatus(prev => ({
        ...prev,
        status: 'failed',
        progress: 0,
        message: 'Failed to initiate sync',
        error: errorMessage
      }));

      options.onError?.(errorMessage);
    }
  }, []);

  const startPolling = useCallback((sessionId: string, options: ForceSyncOptions) => {
    let attempts = 0;
    const maxAttempts = 300; // 10 minutes with 2-second intervals

    const poll = async () => {
      attempts++;

      if (attempts > maxAttempts) {
        setSyncStatus(prev => ({
          ...prev,
          status: 'timeout',
          progress: 0,
          message: 'Sync monitoring timed out'
        }));

        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }

        options.onError?.('Sync monitoring timed out');
        return;
      }

      try {
        const statusResult = await fetchWithRetry(
          `/api/force-sync/status/${sessionId}`,
          {
            method: 'GET',
            signal: abortControllerRef.current?.signal
          },
          { ...RetryPresets.healthCheck, retries: 1 }
        );

        if (statusResult.success) {
          const status = statusResult.data;

          setSyncStatus(prev => ({
            ...prev,
            status: status.status === 'in_progress' ? 'polling' :
                   status.status === 'completed' ? 'completed' :
                   status.status === 'failed' ? 'failed' : 'polling',
            progress: status.progress || 0,
            message: status.message || 'Processing...',
            result: status.details
          }));

          options.onProgress?.(status.progress || 0, status.message || '');

          // Handle completion
          if (status.status === 'completed' || status.status === 'failed' || status.status === 'timeout') {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
            }

            if (status.status === 'completed') {
              options.onComplete?.(status.details);
            } else {
              options.onError?.(status.message || 'Sync operation failed');
            }
          }
        }
      } catch (error) {
        console.warn('Polling error (will retry):', error);
        // Continue polling on error - it might be temporary
      }
    };

    // Start polling immediately, then every 2 seconds
    poll();
    pollingRef.current = setInterval(poll, 2000);
  }, []);

  const cancelSync = useCallback(async () => {
    if (!syncStatus.session_id) {
      return false;
    }

    try {
      const result = await fetchWithRetry(
        `/api/force-sync/status/${syncStatus.session_id}`,
        { method: 'DELETE' },
        RetryPresets.standard
      );

      if (result.success) {
        setSyncStatus(prev => ({
          ...prev,
          status: 'failed',
          message: 'Sync operation cancelled',
          error: 'Cancelled by user'
        }));

        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to cancel sync:', error);
      return false;
    }
  }, [syncStatus.session_id]);

  const retrySync = useCallback((options: ForceSyncOptions = {}) => {
    // Reset status and trigger new sync
    setSyncStatus({
      status: 'idle',
      progress: 0,
      message: ''
    });

    // Trigger sync with retry flag
    triggerSync({
      ...options,
      triggered_by: 'retry'
    });
  }, [triggerSync]);

  const resetSync = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setSyncStatus({
      status: 'idle',
      progress: 0,
      message: ''
    });
  }, []);

  return {
    syncStatus,
    triggerSync,
    cancelSync,
    retrySync,
    resetSync,
    isLoading: syncStatus.status === 'loading' || syncStatus.status === 'polling',
    isActive: ['loading', 'polling'].includes(syncStatus.status),
    canCancel: ['loading', 'polling'].includes(syncStatus.status) && syncStatus.session_id,
    canRetry: syncStatus.status === 'failed'
  };
}
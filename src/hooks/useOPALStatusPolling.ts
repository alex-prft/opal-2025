/**
 * OPAL Status Polling Hook
 * Provides real-time OPAL workflow status updates for UI components
 * Automatically polls /api/opal/workflow-status/[workflowId] after Force Sync completion
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface OPALStatus {
  workflow_id: string;
  correlation_id: string;
  status: 'initiated' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  progress_percentage: number;
  started_at: string;
  updated_at: string;
  completed_at?: string;
  duration_ms?: number;
  workflow_name: string;
  client_name: string;
  callback_received: boolean;
  callback_timestamp?: string;
}

export interface OPALStatusResponse {
  success: boolean;
  workflow_id: string;
  opal_status: OPALStatus;
  callbacks: {
    total_callbacks: number;
    latest_callback: any;
  };
  polling: {
    should_continue: boolean;
    interval_ms: number | null;
    next_poll_at: string | null;
  };
  execution_details?: any;
  error_details?: any;
  timestamp: string;
}

interface UseOPALStatusPollingOptions {
  /** Whether to start polling immediately */
  enabled?: boolean;
  /** Custom polling interval (default: 3000ms) */
  pollInterval?: number;
  /** Maximum polling duration (default: 5 minutes) */
  maxPollDuration?: number;
  /** Callback when OPAL workflow completes */
  onCompleted?: (status: OPALStatus) => void;
  /** Callback when OPAL workflow fails */
  onFailed?: (status: OPALStatus, error?: any) => void;
  /** Callback on each status update */
  onStatusUpdate?: (status: OPALStatus) => void;
}

export function useOPALStatusPolling(
  workflowId: string | null,
  options: UseOPALStatusPollingOptions = {}
) {
  const {
    enabled = true,
    pollInterval = 3000,
    maxPollDuration = 60 * 1000, // 1 minute max duration
    onCompleted,
    onFailed,
    onStatusUpdate
  } = options;

  const [status, setStatus] = useState<OPALStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollStartTimeRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const attemptCountRef = useRef<number>(0);
  const maxAttempts = 5; // Maximum 5 attempts to prevent infinite loops

  // Circuit breaker state
  const [circuitBreakerOpen, setCircuitBreakerOpen] = useState(false);
  const failureCountRef = useRef<number>(0);
  const maxFailures = 5; // Open circuit after 5 consecutive failures

  // Reset circuit breaker after successful operation
  const resetCircuitBreaker = useCallback(() => {
    if (circuitBreakerOpen) {
      console.log('🔄 [OPAL Polling] Circuit breaker reset - service recovered');
      setCircuitBreakerOpen(false);
      failureCountRef.current = 0;
    }
  }, [circuitBreakerOpen]);

  // Open circuit breaker on consecutive failures
  const handleFailure = useCallback(() => {
    failureCountRef.current += 1;
    console.log(`⚠️ [OPAL Polling] Failure count: ${failureCountRef.current}/${maxFailures}`);

    if (failureCountRef.current >= maxFailures) {
      console.log('🚨 [OPAL Polling] Circuit breaker opened - too many failures');
      setCircuitBreakerOpen(true);
      setError('Service temporarily unavailable - too many failures');
    }
  }, [maxFailures]);

  // Validate workflow exists before starting polling
  const validateWorkflowExists = useCallback(async (workflowId: string): Promise<boolean> => {
    if (!workflowId) return false;

    try {
      console.log(`🔍 [OPAL Polling] Validating workflow exists: ${workflowId}`);

      const response = await fetch(`/api/opal/workflow-status/${workflowId}`, {
        method: 'HEAD', // Use HEAD request for validation to avoid full response
        headers: { 'Cache-Control': 'no-cache' }
      });

      const exists = response.ok;

      if (!exists && response.status === 404) {
        console.log(`❌ [OPAL Polling] Workflow does not exist: ${workflowId}`);
        setError(`Workflow ${workflowId} does not exist or is no longer active`);
      }

      return exists;
    } catch (error) {
      console.error(`❌ [OPAL Polling] Validation error for ${workflowId}:`, error);
      return false; // Assume doesn't exist on validation error
    }
  }, []);

  // Fetch OPAL status with circuit breaker protection
  const fetchStatus = useCallback(async (workflowId: string): Promise<OPALStatusResponse | null> => {
    // Check circuit breaker
    if (circuitBreakerOpen) {
      console.log('🚫 [OPAL Polling] Circuit breaker open - skipping request');
      throw new Error('Service temporarily unavailable - circuit breaker open');
    }

    try {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const response = await fetch(`/api/opal/workflow-status/${workflowId}`, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Handle 404 gracefully - workflow not found
          console.log(`⚠️ [OPAL Polling] Workflow not found: ${workflowId} (attempt ${attemptCountRef.current})`);

          // Try to parse 404 response to check if polling should stop
          try {
            const errorData = await response.json();
            if (errorData.polling && errorData.polling.should_continue === false) {
              console.log(`🛑 [OPAL Polling] Server indicates stop polling for: ${workflowId}`);
              return {
                success: false,
                workflow_id: workflowId,
                opal_status: null,
                callbacks: { total_callbacks: 0, latest_callback: null },
                polling: { should_continue: false, interval_ms: 0, next_poll_at: null },
                error_details: errorData,
                timestamp: new Date().toISOString()
              } as any;
            }
          } catch (parseError) {
            // Continue with normal 404 handling
          }

          // If we've seen too many 404s, stop polling
          if (attemptCountRef.current >= 5) {
            throw new Error(`Workflow not found after ${attemptCountRef.current} attempts`);
          }

          // Otherwise, return null to continue polling
          return null;
        }

        // For other HTTP errors, treat as failure
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: OPALStatusResponse = await response.json();

      // Reset circuit breaker on successful response
      resetCircuitBreaker();

      return data;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🚫 [OPAL Polling] Request aborted');
        return null; // Request was cancelled
      }

      // Handle failure for circuit breaker
      handleFailure();
      throw error;
    }
  }, [circuitBreakerOpen, resetCircuitBreaker, handleFailure]);

  // Start polling with enhanced safety mechanisms
  const startPolling = useCallback(async (workflowId: string) => {
    if (isPolling || !workflowId || circuitBreakerOpen) {
      if (circuitBreakerOpen) {
        console.log('🚫 [OPAL Polling] Cannot start - circuit breaker is open');
        setError('Service temporarily unavailable');
      }
      return;
    }

    // Validate workflow exists before starting polling
    const workflowExists = await validateWorkflowExists(workflowId);
    if (!workflowExists) {
      console.log(`❌ [OPAL Polling] Skipping polling - workflow does not exist: ${workflowId}`);
      return;
    }

    console.log(`🔄 [OPAL Polling] Starting polling for validated workflow: ${workflowId}`);
    setIsPolling(true);
    setError(null);
    pollStartTimeRef.current = Date.now();
    attemptCountRef.current = 0; // Reset attempt counter

    const poll = async () => {
      try {
        // Check if we should stop polling
        if (!isPolling || circuitBreakerOpen) {
          console.log('🛑 [OPAL Polling] Stopping - polling disabled or circuit breaker open');
          return;
        }

        // Increment attempt count and check limits
        attemptCountRef.current += 1;
        console.log(`🔄 [OPAL Polling] Attempt ${attemptCountRef.current}/${maxAttempts} for: ${workflowId}`);

        if (attemptCountRef.current > maxAttempts) {
          console.log(`🚨 [OPAL Polling] Max attempts (${maxAttempts}) reached for: ${workflowId}`);
          setIsPolling(false);
          setError(`Polling stopped: Maximum attempts (${maxAttempts}) reached`);
          onFailed?.({} as OPALStatus, 'Maximum polling attempts reached');
          return;
        }

        // Check max polling duration
        const elapsed = Date.now() - (pollStartTimeRef.current || 0);
        if (elapsed > maxPollDuration) {
          console.log(`⏰ [OPAL Polling] Max polling duration (${maxPollDuration}ms) reached: ${workflowId}`);
          setIsPolling(false);
          setError('Polling timeout - maximum duration reached');
          onFailed?.({} as OPALStatus, 'Polling timeout');
          return;
        }

        const data = await fetchStatus(workflowId);

        if (!data) {
          // Request was cancelled or returned null (404), continue polling if within limits
          console.log(`⚠️ [OPAL Polling] No data received, continuing... (${attemptCountRef.current}/${maxAttempts})`);

          // Schedule next poll with exponential backoff for 404s
          const backoffDelay = Math.min(pollInterval * Math.pow(1.5, Math.floor(attemptCountRef.current / 3)), 10000);
          pollIntervalRef.current = setTimeout(poll, backoffDelay);
          return;
        }

        // Check if polling should continue based on server response
        if (!data.polling?.should_continue) {
          console.log(`⏹️ [OPAL Polling] Server indicated stop polling: ${workflowId}`);
          setIsPolling(false);
          setError(null);
          return;
        }

        const opalStatus = data.opal_status;

        if (!opalStatus) {
          console.log(`⚠️ [OPAL Polling] No OPAL status data: ${workflowId}`);
          setError('Workflow status unavailable');
        } else {
          setStatus(opalStatus);
          setError(null);

          // Call status update callback
          onStatusUpdate?.(opalStatus);

          console.log(`📊 [OPAL Polling] Status update:`, {
            workflow_id: opalStatus.workflow_id,
            status: opalStatus.status,
            progress: opalStatus.progress_percentage,
            callback_received: opalStatus.callback_received
          });

          // Check if workflow is complete
          if (opalStatus.status === 'completed') {
            console.log(`✅ [OPAL Polling] Workflow completed: ${workflowId}`);
            setIsPolling(false);
            onCompleted?.(opalStatus);
            return;
          }

          // Check if workflow failed
          if (opalStatus.status === 'failed') {
            console.log(`❌ [OPAL Polling] Workflow failed: ${workflowId}`);
            setIsPolling(false);
            onFailed?.(opalStatus, data.error_details);
            return;
          }
        }

        setLastUpdated(data.timestamp);

        // Schedule next poll using server-recommended interval or fallback
        const nextInterval = data.polling?.interval_ms || pollInterval;
        pollIntervalRef.current = setTimeout(poll, nextInterval);

      } catch (error) {
        console.error(`❌ [OPAL Polling] Error polling ${workflowId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown polling error';
        setError(errorMessage);

        // Stop polling on error unless it's a temporary network issue
        if (errorMessage.includes('circuit breaker') || errorMessage.includes('too many failures')) {
          setIsPolling(false);
          onFailed?.({} as OPALStatus, errorMessage);
        } else {
          // For other errors, retry with exponential backoff
          const retryDelay = Math.min(pollInterval * 2, 10000);
          pollIntervalRef.current = setTimeout(poll, retryDelay);
        }
      }
    };

    // Start initial poll
    poll();
  }, [isPolling, circuitBreakerOpen, fetchStatus, pollInterval, maxPollDuration, maxAttempts, onCompleted, onFailed, onStatusUpdate]);

  // Stop polling
  const stopPolling = useCallback(() => {
    console.log(`⏹️ [OPAL Polling] Stopping polling`);
    setIsPolling(false);

    if (pollIntervalRef.current) {
      clearTimeout(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Effect to start/stop polling based on workflowId and enabled
  useEffect(() => {
    if (!workflowId || !enabled || circuitBreakerOpen) {
      stopPolling();
      return;
    }

    console.log(`🔄 [OPAL Polling] Effect: workflowId=${workflowId}, enabled=${enabled}, circuit=${circuitBreakerOpen ? 'OPEN' : 'CLOSED'}`);

    // Auto-start polling if not already polling (async call)
    if (!isPolling) {
      startPolling(workflowId).catch((error) => {
        console.error('❌ [OPAL Polling] Error starting polling:', error);
        setError('Failed to start polling: ' + (error instanceof Error ? error.message : 'Unknown error'));
      });
    }

    return () => {
      stopPolling();
    };
  }, [workflowId, enabled, circuitBreakerOpen]); // Remove other dependencies to prevent loops

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    status,
    isPolling,
    error,
    lastUpdated,
    startPolling: (id: string) => startPolling(id),
    stopPolling,
    // Computed values
    isActive: status?.status === 'initiated' || status?.status === 'in_progress',
    isCompleted: status?.status === 'completed',
    isFailed: status?.status === 'failed',
    progress: status?.progress_percentage || 0,
    hasCallbacks: status?.callback_received || false,
    // Circuit breaker status
    circuitBreakerOpen,
    attemptCount: attemptCountRef.current,
    maxAttempts,
    // Enhanced info
    timeRemaining: pollStartTimeRef.current
      ? Math.max(0, maxPollDuration - (Date.now() - pollStartTimeRef.current))
      : maxPollDuration
  };
}
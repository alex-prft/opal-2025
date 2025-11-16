'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw, Calendar, Zap, AlertCircle, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, TestTube, Eye, Heart, Database } from 'lucide-react';
import { SafeDate } from '@/lib/utils/date-formatter';
import { useOPALStatusPolling } from '@/hooks/useOPALStatusPolling';
import { useWebhookStream } from '@/hooks/useWebhookStream';
import {
  RecentDataSkeleton,
  ConnectionStatus,
  DataFetchingIndicator,
  ErrorState,
  OPALStatusIndicator
} from '@/components/ui/loading-states';

interface AgentErrorPattern {
  agent_id: string;
  agent_name?: string;
  error_count: number;
  last_error: string;
  recent_errors: Array<{
    timestamp: string;
    message: string;
  }>;
}

// New TypeScript interfaces for OSA integration enhancements
interface WebhookEvent {
  id: string;
  workflow_id: string;
  agent_id: string;
  http_status: number;
  signature_valid: boolean;
  processing_time_ms: number;
  timestamp: string;
  event_type?: string;
}

interface HealthCheckData {
  overall_status: 'green' | 'yellow' | 'red';
  signature_valid_rate: number;
  error_rate_24h: number;
  last_webhook_minutes_ago: number;
  uptime_percentage?: number;
}

interface PayloadValidationResult {
  success: boolean;
  payload?: any;
  validation_errors?: string[];
  timestamp: string;
}

interface AgentTestResult {
  success: boolean;
  message: string;
  response_time_ms?: number;
  workflow_id?: string;
}

interface RecentDataComponentProps {
  className?: string;
  compact?: boolean;
}

interface ForceSyncData {
  lastForceSync: string | null;
  forceSyncWorkflowId: string | null;
  forceSyncSuccess: boolean;
  forceSyncAgentCount: number;
  // OPAL workflow tracking fields
  opalWorkflowId?: string | null;
  opalCorrelationId?: string | null;
  opalStatus?: 'initiated' | 'in_progress' | 'completed' | 'failed' | null;
  opalProgress?: number;
}

interface OSAWorkflowData {
  lastOSAToolExecution: string | null;
  totalOSAToolExecutions: number;
  agentDataReception: {[key: string]: any};
  successfulReceptions: number;
  dataReceptionRate: number;
}

export default function RecentDataComponent({ className = '', compact = false }: RecentDataComponentProps) {
  const [lastWebhookTrigger, setLastWebhookTrigger] = useState<string | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<'success' | 'failed' | 'processing' | 'none'>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingOperation, setLoadingOperation] = useState<string>('Initializing...');
  const [usingMockData, setUsingMockData] = useState<boolean>(false);
  const [mockDataNotice, setMockDataNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workflowAnalysis, setWorkflowAnalysis] = useState<any>(null);
  const [agentStatuses, setAgentStatuses] = useState<{[key: string]: 'unknown' | 'success' | 'failed'}>({
    integration_health: 'unknown',
    content_review: 'unknown',
    geo_audit: 'unknown',
    audience_suggester: 'unknown',
    experiment_blueprinter: 'unknown',
    personalization_idea_generator: 'unknown',
    customer_journey: 'unknown',
    roadmap_generator: 'unknown',
    cmp_organizer: 'unknown'
  });
  const [agentErrorPatterns, setAgentErrorPatterns] = useState<AgentErrorPattern[]>([]);

  // New state for enhanced OPAL integration
  const [forceSyncData, setForceSyncData] = useState<ForceSyncData | null>(null);
  const [osaWorkflowData, setOSAWorkflowData] = useState<OSAWorkflowData | null>(null);

  // Polling control state
  const [isPollingEnabled, setIsPollingEnabled] = useState(false);

  // Event deduplication and throttling state
  const lastFetchTimeRef = useRef<number>(0);
  const fetchThrottleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processedEventIdsRef = useRef<Set<string>>(new Set());
  const FETCH_THROTTLE_DELAY = 10000; // 10 seconds between fetches (reduced from 2s for performance)
  const EVENT_DEDUP_TTL = 30000; // 30 seconds event deduplication window

  // Load polling preference from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('opal-polling-enabled');
    setIsPollingEnabled(savedState === 'true');
  }, []);

  // OPAL status polling integration with toggle control
  const {
    status: opalStatus,
    isPolling: isOPALPolling,
    error: opalError,
    isCompleted: isOPALCompleted,
    progress: opalProgress,
    circuitBreakerOpen,
    attemptCount,
    maxAttempts,
    timeRemaining
  } = useOPALStatusPolling(
    forceSyncData?.opalCorrelationId || null,
    {
      enabled: isPollingEnabled, // Control via toggle
      maxPollDuration: 60 * 1000, // 60 seconds max duration (reduced from 90s)
      pollInterval: 10000, // 10 second intervals (reduced from 3s for performance)
      onCompleted: (status) => {
        console.log('🎉 [RecentData] OPAL workflow completed:', status);
        // Refresh dashboard data when OPAL completes (throttled)
        throttledFetchDashboardData();
      },
      onFailed: (status, error) => {
        console.error('❌ [RecentData] OPAL workflow failed:', status, error);
        // Refresh dashboard data when OPAL fails (throttled)
        throttledFetchDashboardData();
      },
      onStatusUpdate: (status) => {
        console.log('📊 [RecentData] OPAL status update:', status);
        // Update local force sync data with latest OPAL status
        if (forceSyncData) {
          setForceSyncData({
            ...forceSyncData,
            opalStatus: status.status,
            opalProgress: status.progress_percentage
          });
        }
        // Only fetch dashboard data on significant status changes (not on progress updates)
        if (status.status === 'completed' || status.status === 'failed') {
          throttledFetchDashboardData();
        }
      }
    }
  );

  // Real-time webhook stream with proper correlation logic
  const webhookStream = useWebhookStream({
    enabled: true,
    maxEvents: 100,
    // Ensure we ALWAYS provide either sessionId or workflowId (SSE endpoint requires one)
    sessionId: forceSyncData?.opalCorrelationId || forceSyncData?.forceSyncWorkflowId || 'recent-data-widget',
    workflowId: forceSyncData?.forceSyncWorkflowId || null,
    onEvent: (event) => {
      console.log('📡 [RecentData] New webhook event received:', event);

      // Skip heartbeat events to prevent performance cascade
      if (!event.event_type || event.event_type === 'heartbeat') {
        console.log('📡 [RecentData] Skipping heartbeat/empty event (performance optimization)');
        return;
      }

      // Event deduplication check
      const eventId = event.id || `${event.workflow_id}_${event.timestamp}`;
      if (isDuplicateEvent(eventId)) {
        return; // Skip duplicate event
      }

      // Only refresh if event is relevant to current workflow
      const isRelevantEvent =
        event.workflow_id === forceSyncData?.forceSyncWorkflowId ||
        event.correlation_id === forceSyncData?.opalCorrelationId ||
        !forceSyncData; // If no specific workflow, process all events

      if (isRelevantEvent) {
        console.log('📡 [RecentData] Processing relevant webhook event:', eventId);
        throttledFetchDashboardData();
      } else {
        console.log('📡 [RecentData] Skipping irrelevant webhook event:', eventId);
      }
    },
    onConnect: () => {
      const sessionInfo = forceSyncData?.opalCorrelationId || forceSyncData?.forceSyncWorkflowId || 'recent-data-widget';
      const workflowInfo = forceSyncData?.forceSyncWorkflowId || 'none';
      console.log(`📡 [RecentData] Webhook stream connected successfully (session: ${sessionInfo}, workflow: ${workflowInfo})`);
      // Skip initial fetch on connect to reduce API call frequency
      // Data will be fetched when actual events arrive or via manual refresh
    },
    onError: (error) => {
      const sessionInfo = forceSyncData?.opalCorrelationId || forceSyncData?.forceSyncWorkflowId || 'recent-data-widget';
      const workflowInfo = forceSyncData?.forceSyncWorkflowId || 'none';
      console.error(`📡 [RecentData] Webhook stream error: ${error} (session: ${sessionInfo}, workflow: ${workflowInfo})`);
      // Note: Component will fall back to manual refresh button when stream fails
    }
  });

  // New state variables for OSA integration enhancements
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [webhookEventsExpanded, setWebhookEventsExpanded] = useState(false);
  const [webhookEventsLoading, setWebhookEventsLoading] = useState(false);
  const [healthData, setHealthData] = useState<HealthCheckData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [payloadModalOpen, setPayloadModalOpen] = useState(false);
  const [payloadResult, setPayloadResult] = useState<PayloadValidationResult | null>(null);
  const [payloadLoading, setPayloadLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [agentTestLoading, setAgentTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<AgentTestResult | null>(null);

  // Throttled fetch dashboard data with event deduplication
  const throttledFetchDashboardData = useCallback(() => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;

    // Clear existing timeout if any
    if (fetchThrottleTimeoutRef.current) {
      clearTimeout(fetchThrottleTimeoutRef.current);
    }

    if (timeSinceLastFetch >= FETCH_THROTTLE_DELAY) {
      // Execute immediately if enough time has passed
      console.log('🔄 [RecentData] Executing immediate fetch (throttle satisfied)');
      lastFetchTimeRef.current = now;
      fetchDashboardData();
    } else {
      // Schedule for later if too recent
      const delay = FETCH_THROTTLE_DELAY - timeSinceLastFetch;
      console.log(`⏰ [RecentData] Scheduling throttled fetch in ${delay}ms`);
      fetchThrottleTimeoutRef.current = setTimeout(() => {
        lastFetchTimeRef.current = Date.now();
        fetchDashboardData();
      }, delay);
    }
  }, []);

  // Event deduplication helper
  const isDuplicateEvent = useCallback((eventId: string): boolean => {
    const eventKey = `${eventId}_${Date.now()}`;

    if (processedEventIdsRef.current.has(eventId)) {
      console.log(`🔄 [RecentData] Skipping duplicate event: ${eventId}`);
      return true;
    }

    // Add to processed events
    processedEventIdsRef.current.add(eventId);

    // Clean up old events (TTL cleanup)
    if (processedEventIdsRef.current.size > 100) {
      const eventsArray = Array.from(processedEventIdsRef.current);
      const keepEvents = eventsArray.slice(-50); // Keep last 50 events
      processedEventIdsRef.current = new Set(keepEvents);
      console.log(`🧹 [RecentData] Cleaned up event deduplication cache (kept ${keepEvents.length} events)`);
    }

    return false;
  }, []);

  // Helper function to safely parse JSON responses and handle errors
  const safeJsonFetch = async (url: string, options?: RequestInit): Promise<any> => {
    const fetchId = Math.random().toString(36).substr(2, 9);
    console.log(`🔍 [FETCH-${fetchId}] Starting request to:`, url);
    console.log(`🔍 [FETCH-${fetchId}] Request options:`, options || 'default');

    try {
      // Use normal caching instead of cache-busting for better performance
      const enhancedOptions: RequestInit = {
        ...options,
        headers: {
          'Cache-Control': 'max-age=10', // Allow 10-second cache for performance
          ...options?.headers
        }
      };

      console.log(`🔍 [FETCH-${fetchId}] Enhanced headers:`, enhancedOptions.headers);
      const startTime = Date.now();
      const response = await fetch(url, enhancedOptions);
      const responseTime = Date.now() - startTime;

      console.log(`🔍 [FETCH-${fetchId}] Response received:`, {
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      });

      // Check if response is ok (status 200-299)
      if (!response.ok) {
        // For non-ok responses, try to get error details
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          // If it's JSON, parse it for error details
          try {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
          } catch (jsonError) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } else {
          // If it's not JSON (likely HTML error page), don't try to parse
          throw new Error(`HTTP ${response.status}: ${response.statusText} - Server returned non-JSON response`);
        }
      }

      // Check content type for successful responses
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      // Safe to parse JSON
      return await response.json();
    } catch (error) {
      // Re-throw with more context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  };

  // Fetch webhook statistics and agent statuses
  const fetchDashboardData = async () => {
    const requestId = Math.random().toString(36).substr(2, 9);
    console.log(`🔍 [DEBUG-${requestId}] fetchDashboardData called at:`, new Date().toISOString());
    console.log(`🔍 [DEBUG-${requestId}] Component mounted, sidebar visible:`, true);

    try {
      setError(null);
      setLoadingOperation('Fetching webhook statistics and agent logs...');
      console.log(`🔍 [DEBUG-${requestId}] Starting API requests...`);

      // Fetch webhook stats and agent error patterns in parallel using safe JSON fetch
      const [statsData, logsData] = await Promise.all([
        safeJsonFetch('/api/webhook-events/stats?hours=24'),
        safeJsonFetch('/api/monitoring/agent-logs?level=error&hours=24&limit=100')
      ]);

      console.log(`🔍 [DEBUG-${requestId}] API responses received:`, {
        statsSuccess: statsData.success,
        logsSuccess: logsData.success,
        statsLastTriggerTime: statsData.lastTriggerTime,
        statsWorkflowStatus: statsData.workflowStatus,
        statsTimestamp: statsData.timestamp,
        responseTime: new Date().toISOString()
      });

      if (statsData.success) {
        setLoadingOperation('Processing webhook data and agent statuses...');
        console.log(`🔍 [DEBUG-${requestId}] Processing successful API response...`);

        // Check if we're using mock data and update UI accordingly
        if (statsData._isMockData || statsData.stats?._isMockData) {
          setUsingMockData(true);
          setMockDataNotice(statsData._mockDataNotice || statsData.stats?._mockDataNotice ||
            'Database unavailable - showing simulated data for demonstration');
          console.log('⚠️ [RecentData] Using mock/fallback data due to database unavailability');
        } else {
          setUsingMockData(false);
          setMockDataNotice(null);
        }

        // Update last webhook trigger time and status
        if (statsData.lastTriggerTime) {
          console.log(`🔍 [DEBUG-${requestId}] Setting lastWebhookTrigger:`, {
            oldValue: lastWebhookTrigger,
            newValue: statsData.lastTriggerTime,
            changed: lastWebhookTrigger !== statsData.lastTriggerTime
          });
          setLastWebhookTrigger(statsData.lastTriggerTime);
          setWebhookStatus(statsData.workflowStatus || 'success');
        } else {
          console.log(`🔍 [DEBUG-${requestId}] No lastTriggerTime in response, setting to null`);
          setLastWebhookTrigger(null);
          setWebhookStatus('none');
        }

        // Update workflow analysis data
        if (statsData.workflowAnalysis) {
          console.log(`🔍 [DEBUG-${requestId}] Updating workflow analysis:`, statsData.workflowAnalysis);
          setWorkflowAnalysis(statsData.workflowAnalysis);
        }

        // Update agent statuses
        if (statsData.agentStatuses) {
          console.log(`🔍 [DEBUG-${requestId}] Updating agent statuses:`, statsData.agentStatuses);
          setAgentStatuses(statsData.agentStatuses);
        }

        // Update enhanced OPAL force sync data
        if (statsData.forceSync) {
          console.log(`🔍 [DEBUG-${requestId}] Updating force sync data:`, statsData.forceSync);
          setForceSyncData(statsData.forceSync);
        }

        // Update OSA Workflow Data Tools data
        if (statsData.osaWorkflowData) {
          console.log(`🔍 [DEBUG-${requestId}] Updating OSA workflow data:`, statsData.osaWorkflowData);
          setOSAWorkflowData(statsData.osaWorkflowData);
        }

        console.log('📊 Recent data component updated:', {
          lastTrigger: statsData.lastTriggerTime,
          workflowStatus: statsData.workflowStatus,
          agentStatuses: statsData.agentStatuses,
          forceSync: statsData.forceSync,
          osaWorkflowData: statsData.osaWorkflowData
        });
      } else {
        console.error(`🔍 [DEBUG-${requestId}] API returned failure:`, statsData.error);
        setWebhookStatus('failed');
        setError(statsData.error || 'Failed to fetch recent data');
      }

      // Update agent error patterns
      if (logsData.success && logsData.agent_error_patterns) {
        setAgentErrorPatterns(logsData.agent_error_patterns);
      }

    } catch (error) {
      console.error(`🔍 [DEBUG-${requestId}] Error fetching recent data:`, error);
      console.error(`🔍 [DEBUG-${requestId}] Error type:`, error instanceof Error ? 'Error' : typeof error);
      console.error(`🔍 [DEBUG-${requestId}] Error message:`, error instanceof Error ? error.message : error);
      setWebhookStatus('failed');
      setError(error instanceof Error ? error.message : 'Network error occurred');
    } finally {
      console.log(`🔍 [DEBUG-${requestId}] fetchDashboardData completed at:`, new Date().toISOString());
      setIsLoading(false);
    }
  };

  // New fetch functions for OSA integration enhancements

  // 1. Fetch webhook event logs
  const fetchWebhookEvents = async () => {
    try {
      setWebhookEventsLoading(true);
      const data = await safeJsonFetch('/api/diagnostics/last-webhook?limit=10&status=all&hours=24');

      if (data.success && data.events) {
        setWebhookEvents(data.events);
      } else {
        console.warn('Failed to fetch webhook events:', data.error);
        setWebhookEvents([]);
      }
    } catch (error) {
      console.error('Error fetching webhook events:', error);
      setWebhookEvents([]);
    } finally {
      setWebhookEventsLoading(false);
    }
  };

  // 2. Fetch health check data
  const fetchHealthData = async () => {
    try {
      setHealthLoading(true);
      const data = await safeJsonFetch('/api/opal/health-with-fallback');

      // Health-with-fallback always returns 200, and safeJsonFetch ensures we get valid data
      if (data) {
        setHealthData({
          overall_status: data.overall_status || 'red',
          signature_valid_rate: data.signature_valid_rate || 0,
          error_rate_24h: data.error_rate_24h || 0,
          last_webhook_minutes_ago: data.last_webhook_minutes_ago || 999,
          uptime_percentage: data.uptime_percentage
        });
      } else {
        // This should rarely happen with health-with-fallback endpoint
        console.error('Unexpected health API error:', response.status, data);
        setHealthData({
          overall_status: 'red',
          signature_valid_rate: 0,
          error_rate_24h: 100,
          last_webhook_minutes_ago: 999
        });
      }
    } catch (error) {
      // Only log network errors, not expected API responses
      console.error('Network error fetching health data:', error);
      setHealthData({
        overall_status: 'red',
        signature_valid_rate: 0,
        error_rate_24h: 100,
        last_webhook_minutes_ago: 999
      });
    } finally {
      setHealthLoading(false);
    }
  };

  // 3. Validate payload
  const validatePayload = async () => {
    try {
      setPayloadLoading(true);
      const data = await safeJsonFetch('/api/opal/test-payload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_mode: true })
      });

      setPayloadResult({
        success: data.success || false,
        payload: data.payload,
        validation_errors: data.validation_errors || [],
        timestamp: new Date().toISOString()
      });
      setPayloadModalOpen(true);
    } catch (error) {
      setPayloadResult({
        success: false,
        validation_errors: [`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        timestamp: new Date().toISOString()
      });
      setPayloadModalOpen(true);
    } finally {
      setPayloadLoading(false);
    }
  };

  // 4. Test agent execution
  const testAgent = async (agentId: string) => {
    try {
      setAgentTestLoading(true);
      const startTime = Date.now();

      const data = await safeJsonFetch('/api/opal/enhanced-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: "send_data_to_osa_enhanced",
          parameters: {
            workflow_id: "test-workflow-ui",
            agent_id: agentId,
            execution_status: "success",
            agent_data: { test: "data", timestamp: new Date().toISOString() }
          }
        })
      });
      const responseTime = Date.now() - startTime;

      setTestResult({
        success: data.success || false,
        message: data.message || (data.success ? 'Agent test completed successfully' : 'Agent test failed'),
        response_time_ms: responseTime,
        workflow_id: "test-workflow-ui"
      });

      // Show success/failure toast notification
      setTimeout(() => setTestResult(null), 5000);
    } catch (error) {
      setTestResult({
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      setTimeout(() => setTestResult(null), 5000);
    } finally {
      setAgentTestLoading(false);
      setSelectedAgent('');
    }
  };

  useEffect(() => {
    const componentId = Math.random().toString(36).substr(2, 9);
    console.log(`🔍 [STREAM-${componentId}] Component mounted, using real-time webhook stream at:`, new Date().toISOString());

    // Initial fetch only for health data (webhook data comes via stream)
    console.log(`🔍 [STREAM-${componentId}] Calling initial fetchHealthData`);
    fetchHealthData();

    // Health check every 5 minutes (reduced from 60s for performance)
    console.log(`🔍 [STREAM-${componentId}] Setting up health interval (5m)`);
    const healthInterval = setInterval(() => {
      console.log(`🔍 [STREAM-${componentId}] Health timer fired at:`, new Date().toISOString());
      fetchHealthData();
    }, 300000);

    console.log(`🔍 [STREAM-${componentId}] Configuration:`, {
      streamEnabled: true,
      healthInterval: healthInterval,
      nextHealthFire: new Date(Date.now() + 60000).toISOString(),
      streamEvents: webhookStream.eventCount
    });

    return () => {
      console.log(`🔍 [STREAM-${componentId}] Component unmounting, clearing health timer at:`, new Date().toISOString());
      clearInterval(healthInterval);
    };
  }, [webhookStream.eventCount]); // React to stream event changes

  // Cleanup throttle timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchThrottleTimeoutRef.current) {
        console.log('🧹 [RecentData] Cleaning up throttle timeout on unmount');
        clearTimeout(fetchThrottleTimeoutRef.current);
        fetchThrottleTimeoutRef.current = null;
      }
    };
  }, []);

  // Fetch webhook events when expanded
  useEffect(() => {
    if (webhookEventsExpanded) {
      fetchWebhookEvents();
    }
  }, [webhookEventsExpanded]);

  // Check if an agent has repeated failures
  const hasRepeatedFailures = (agentId: string): AgentErrorPattern | null => {
    return agentErrorPatterns.find(pattern =>
      pattern.agent_id === agentId && pattern.error_count >= 2
    ) || null;
  };

  const getAgentStatusColor = (agentId: string, status: 'unknown' | 'success' | 'failed') => {
    const errorPattern = hasRepeatedFailures(agentId);

    // Check OSA Workflow Data Tools reception status
    const osaReception = osaWorkflowData?.agentDataReception?.[agentId];
    const hasOSAData = osaReception && osaReception.success;

    // Priority: Repeated failures > OSA Tool Status > Current status
    if (errorPattern && errorPattern.error_count >= 3) {
      return 'bg-red-600'; // Dark red for multiple failures
    } else if (errorPattern && errorPattern.error_count >= 2) {
      return 'bg-orange-500'; // Orange for repeated failures warning
    }

    // Enhanced status with OSA tool integration
    if (hasOSAData) {
      return 'bg-green-500'; // Green for successful OSA Workflow Data Tools reception
    } else if (status === 'success') {
      return 'bg-blue-500'; // Blue for webhook success but no OSA tool data
    } else if (status === 'failed') {
      return 'bg-red-500'; // Red for failed webhook reception
    } else {
      return 'bg-gray-400'; // Gray for unknown status (default)
    }
  };

  const getAgentTooltipText = (agentId: string, status: 'unknown' | 'success' | 'failed') => {
    const errorPattern = hasRepeatedFailures(agentId);
    const osaReception = osaWorkflowData?.agentDataReception?.[agentId];
    const agentName = getAgentDisplayName(agentId);

    let statusText = '';
    if (errorPattern && errorPattern.error_count >= 2) {
      statusText = `${errorPattern.error_count} failures`;
    } else if (osaReception && osaReception.success) {
      const dataAge = Math.floor((Date.now() - new Date(osaReception.timestamp).getTime()) / (1000 * 60));
      statusText = `OSA Data Active (${dataAge}m ago)`;
    } else if (status === 'success') {
      statusText = 'Webhook Active (No OSA Data)';
    } else if (status === 'failed') {
      statusText = 'Failed';
    } else {
      statusText = 'Idle';
    }

    const errorTime = errorPattern ? ` (Last: ${new Date(errorPattern.last_error).toLocaleTimeString()})` : '';
    return `${agentName}: ${statusText}${errorTime}`;
  };

  const getAgentDisplayName = (agentId: string) => {
    const displayNames: {[key: string]: string} = {
      integration_health: 'Integration Health',
      content_review: 'Content Review',
      geo_audit: 'Geographic Audit',
      audience_suggester: 'Audience Suggester',
      experiment_blueprinter: 'Experiment Blueprinter',
      personalization_idea_generator: 'Personalization Ideas',
      customer_journey: 'Customer Journey',
      roadmap_generator: 'Roadmap Generator',
      cmp_organizer: 'CMP Organizer'
    };
    return displayNames[agentId] || agentId;
  };

  const formatLastTriggerTime = (timestamp: string | null) => {
    if (!timestamp) return null;

    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;

      return timestamp;
    } catch (error) {
      return null;
    }
  };

  if (compact) {
    if (isLoading) {
      return (
        <Card id="recent-data" className={`${className}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-gray-300" />
              <span className="text-sm font-semibold text-gray-500">Recent Data</span>
              <ConnectionStatus status="connecting" showIcon={false} />
            </div>
            <DataFetchingIndicator
              operation={loadingOperation}
              details="Loading webhook data and agent status"
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card id="recent-data" className={`${className}`}>
        {/* Mock Data Notice Banner */}
        {usingMockData && mockDataNotice && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
            <div className="flex items-center gap-2 text-amber-800 text-xs">
              <Database className="h-3 w-3" />
              <span className="font-medium">Demo Mode:</span>
              <span>{mockDataNotice}</span>
            </div>
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold">Recent Data</span>
              {/* Stream Status Indicator */}
              <ConnectionStatus
                status={
                  webhookStream.isConnected ? 'connected' :
                  webhookStream.error ? 'error' :
                  'connecting'
                }
                message={
                  webhookStream.isConnected ? `Live (${webhookStream.eventCount} events)` :
                  webhookStream.error ? 'Stream Error' :
                  'Connecting...'
                }
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchDashboardData}
              className="h-6 w-6 p-0"
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Webhook Status Indicator */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {webhookStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {webhookStatus === 'processing' && <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />}
              {webhookStatus === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
              {webhookStatus === 'none' && <AlertCircle className="h-4 w-4 text-gray-400" />}
              <span className="text-xs text-gray-600">
                {webhookStatus === 'success' ? 'Workflow Active' :
                 webhookStatus === 'processing' ? 'Processing...' :
                 webhookStatus === 'failed' ? 'Connection Failed' :
                 'No Recent Activity'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              {(() => {
                const formattedTime = formatLastTriggerTime(lastWebhookTrigger);
                if (formattedTime && typeof formattedTime === 'string' && formattedTime !== lastWebhookTrigger) {
                  return <span>{formattedTime}</span>;
                } else if (formattedTime === lastWebhookTrigger) {
                  return <SafeDate date={lastWebhookTrigger} format="time" fallback="Never" />;
                } else {
                  return <span>Never</span>;
                }
              })()}
            </div>
          </div>

          {/* Agent Status Indicators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">OPAL Agents</span>
              {workflowAnalysis && (
                <Badge variant="outline" className="text-xs">
                  {workflowAnalysis.agentResponseCount || 0}/9 Active
                </Badge>
              )}
            </div>

            {/* Agent Status Bubbles */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(agentStatuses).map(([agentId, status]) => {
                const errorPattern = hasRepeatedFailures(agentId);
                const hasErrors = errorPattern && errorPattern.error_count >= 2;

                return (
                  <div
                    key={agentId}
                    className={`w-3 h-3 rounded-full ${getAgentStatusColor(agentId, status)} flex-shrink-0 cursor-help`}
                    title={getAgentTooltipText(agentId, status)}
                  />
                );
              })}
            </div>

            {/* Error Warning */}
            {agentErrorPatterns.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <AlertTriangle className="h-3 w-3 text-orange-500" />
                <span className="text-xs text-orange-600">
                  {agentErrorPatterns.length} agent{agentErrorPatterns.length > 1 ? 's' : ''} with issues
                </span>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {webhookStatus === 'success' && workflowAnalysis && workflowAnalysis.agentResponseCount >= 9 && (
            <div className="mt-3 p-2 bg-green-50 rounded text-xs text-green-800">
              All OPAL agents processing data
            </div>
          )}

          {webhookStatus === 'failed' && (
            <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-800">
              Connection issue detected
            </div>
          )}

          {error && (
            <div className="mt-3">
              <ErrorState
                title="Connection Error"
                message={error}
                canRetry={true}
                onRetry={() => {
                  setError(null);
                  fetchDashboardData();
                }}
                suggestions={[
                  "Check your internet connection",
                  "Verify API endpoints are accessible",
                  "Try refreshing the page"
                ]}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full version (non-compact)
  if (isLoading) {
    return (
      <div id="recent-data" className={`space-y-6 ${className}`}>
        <DataFetchingIndicator
          operation={loadingOperation}
          details="Connecting to real-time webhook stream and fetching latest data"
        />
        <RecentDataSkeleton compact={false} />
      </div>
    );
  }

  return (
    <div id="recent-data" className={`space-y-6 ${className}`}>
      {/* Mock Data Notice Banner */}
      {usingMockData && mockDataNotice && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-amber-800">
              <Database className="h-5 w-5" />
              <div>
                <p className="font-medium text-sm">Demo Mode Active</p>
                <p className="text-xs text-amber-700">{mockDataNotice}</p>
                <p className="text-xs text-amber-600 mt-1">
                  Data shown is simulated with current timestamps for demonstration purposes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhook Trigger Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-blue-600" />
            Webhook Trigger for Strategy Assistant
          </CardTitle>
          <CardDescription>
            Last successful webhook trigger and workflow execution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {webhookStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                {webhookStatus === 'processing' && <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />}
                {webhookStatus === 'failed' && <XCircle className="h-5 w-5 text-red-600" />}
                {webhookStatus === 'none' && <AlertCircle className="h-5 w-5 text-gray-400" />}
                <span className="font-medium">
                  {webhookStatus === 'success' && 'Last Successful Trigger:'}
                  {webhookStatus === 'processing' && 'Workflow Processing:'}
                  {webhookStatus === 'failed' && 'Connection Failed'}
                  {webhookStatus === 'none' && 'No Recent Triggers'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                {(() => {
                  const formattedTime = formatLastTriggerTime(lastWebhookTrigger);
                  if (formattedTime && typeof formattedTime === 'string' && formattedTime !== lastWebhookTrigger) {
                    return <span>{formattedTime}</span>;
                  } else if (formattedTime === lastWebhookTrigger) {
                    return <SafeDate date={lastWebhookTrigger} format="datetime" fallback="Never" />;
                  } else {
                    return <span>Never</span>;
                  }
                })()}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Enhanced Force Sync Status Display with OPAL Integration */}
          {forceSyncData && forceSyncData.lastForceSync && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">
                    Last OPAL Force Sync
                  </span>
                  {isOPALPolling && (
                    <div className="animate-spin h-3 w-3 border border-blue-600 border-t-transparent rounded-full"></div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* OPAL Workflow Status Badge */}
                  {forceSyncData.opalStatus && (
                    <Badge
                      variant={
                        forceSyncData.opalStatus === 'completed' ? "default" :
                        forceSyncData.opalStatus === 'failed' ? "destructive" :
                        forceSyncData.opalStatus === 'in_progress' ? "secondary" : "outline"
                      }
                      className="text-xs"
                    >
                      OPAL: {forceSyncData.opalStatus}
                    </Badge>
                  )}
                  {/* Force Sync Status Badge */}
                  <Badge
                    variant={forceSyncData.forceSyncSuccess ? "default" : "destructive"}
                    className="text-xs"
                  >
                    Sync: {forceSyncData.forceSyncSuccess ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              </div>

              <div className="text-sm text-blue-700">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <SafeDate date={forceSyncData.lastForceSync} format="datetime" />
                </div>

                {/* OPAL Progress Bar */}
                {forceSyncData.opalProgress !== undefined && forceSyncData.opalStatus !== 'completed' && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-blue-600 mb-1">
                      <span>OPAL Workflow Progress</span>
                      <span>{forceSyncData.opalProgress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${forceSyncData.opalProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Agent Count */}
                {forceSyncData.forceSyncAgentCount > 0 && (
                  <div className="mt-1 text-xs text-blue-600">
                    {forceSyncData.forceSyncAgentCount} agents received force sync data
                  </div>
                )}

                {/* OPAL Error Display */}
                {opalError && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      OPAL Polling Error: {opalError}
                    </div>
                  </div>
                )}

                {/* OPAL Completion Message */}
                {isOPALCompleted && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      OPAL workflow completed successfully
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OSA Workflow Data Tools Status */}
          {osaWorkflowData && osaWorkflowData.lastOSAToolExecution && (
            <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-800">
                    OSA Workflow Data Tools
                  </span>
                </div>
                <Badge variant="outline" className="text-xs text-purple-700 border-purple-300">
                  {osaWorkflowData.successfulReceptions}/{Object.keys(agentStatuses).length} Active
                </Badge>
              </div>
              <div className="text-sm text-purple-700">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Last Tool Execution: </span>
                  <SafeDate date={osaWorkflowData.lastOSAToolExecution} format="datetime" />
                </div>
                <div className="mt-1 text-xs text-purple-600">
                  {osaWorkflowData.totalOSAToolExecutions} total executions |
                  {Math.round(osaWorkflowData.dataReceptionRate * 100)}% reception rate
                </div>
              </div>
            </div>
          )}

          {webhookStatus === 'success' && lastWebhookTrigger && workflowAnalysis && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-800">
                <strong>Strategy Assistant workflow triggered successfully</strong>
                <br />
                {workflowAnalysis.agentResponseCount >= 9
                  ? 'All 9 OPAL agents are processing data for strategic recommendations'
                  : workflowAnalysis.agentResponseCount > 0
                    ? `${workflowAnalysis.agentResponseCount} agents responded - strategic recommendations available`
                    : 'Workflow triggered but no agent responses received yet'
                }
              </div>
            </div>
          )}

          {webhookStatus === 'processing' && lastWebhookTrigger && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-800">
                <strong>Workflow is currently processing</strong>
                <br />
                OPAL agents are analyzing data and generating strategic recommendations...
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4">
              <ErrorState
                title="Error Loading Recent Data"
                message={error}
                errorId={`RDC_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`}
                canRetry={true}
                onRetry={() => {
                  setError(null);
                  fetchDashboardData();
                }}
                suggestions={[
                  "Check your internet connection",
                  "Verify webhook endpoints are accessible",
                  "Check system status page",
                  "Try refreshing the page",
                  "Contact support if the issue persists"
                ]}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* OPAL Agent Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-blue-600" />
              OPAL Agent Status
              {/* Health Check Widget - inline badge next to title */}
              {healthData && (
                <div className="flex items-center gap-2">
                  <Heart
                    className={`h-4 w-4 ${
                      healthData.overall_status === 'green' ? 'text-green-600' :
                      healthData.overall_status === 'yellow' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}
                  />
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      healthData.overall_status === 'green' ? 'bg-green-50 text-green-700 border-green-200' :
                      healthData.overall_status === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}
                    title={`Error rate: ${healthData.error_rate_24h.toFixed(1)}% | Last webhook: ${healthData.last_webhook_minutes_ago}m ago`}
                  >
                    {Math.round(healthData.signature_valid_rate)}% valid
                  </Badge>
                </div>
              )}
            </div>

            {/* Enhanced Controls Row */}
            <div className="flex items-center gap-2">
              {/* Agent Test Dropdown */}
              <div className="flex items-center gap-1">
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-700"
                  disabled={agentTestLoading}
                >
                  <option value="">Test Agent</option>
                  {Object.keys(agentStatuses).map((agentId) => (
                    <option key={agentId} value={agentId}>
                      {getAgentDisplayName(agentId)}
                    </option>
                  ))}
                </select>
                {selectedAgent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testAgent(selectedAgent)}
                    disabled={agentTestLoading}
                    className="h-7 px-2 text-xs"
                  >
                    <TestTube className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Payload Preview Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={validatePayload}
                disabled={payloadLoading}
                className="h-7 px-2 text-xs flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                {payloadLoading ? 'Validating...' : 'Validate Payload'}
              </Button>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchDashboardData();
                  fetchHealthData();
                }}
                className="h-7 px-2"
                disabled={isLoading}
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Real-time status of all 9 OPAL strategy agents with OSA integration monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-sm text-gray-600">Loading agent status...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Agents with Repeated Failures Alert */}
              {agentErrorPatterns.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <h4 className="font-semibold text-red-800">
                      {agentErrorPatterns.length} Agent{agentErrorPatterns.length > 1 ? 's' : ''} with Repeated Failures
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {agentErrorPatterns.slice(0, 3).map((pattern) => (
                      <Badge key={pattern.agent_id} variant="destructive" className="text-xs">
                        {pattern.agent_name || pattern.agent_id} ({pattern.error_count})
                      </Badge>
                    ))}
                    {agentErrorPatterns.length > 3 && (
                      <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                        +{agentErrorPatterns.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {Object.entries(agentStatuses).map(([agentId, status]) => {
                  const errorPattern = hasRepeatedFailures(agentId);
                  const hasErrors = errorPattern && errorPattern.error_count >= 2;

                  return (
                    <div key={agentId} className={`flex items-center gap-4 p-4 rounded-lg border ${
                      hasErrors ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full ${getAgentStatusColor(agentId, status)} flex-shrink-0`}
                          title={`Agent Status: ${status}${hasErrors ? ' (Repeated Failures)' : ''}`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{getAgentDisplayName(agentId)}</h3>
                            {hasErrors && (
                              <AlertTriangle className="h-4 w-4 text-red-600" title="Repeated failures detected" />
                            )}
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                hasErrors ? 'bg-red-100 text-red-800 border-red-300' :
                                status === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
                                status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                              }`}
                            >
                              {hasErrors ? `${errorPattern!.error_count} failures` :
                               status === 'success' ? 'Active' :
                               status === 'failed' ? 'Failed' : 'Idle'}
                            </Badge>
                          </div>
                          {hasErrors && (
                            <div className="text-xs text-red-600 mt-1">
                              Last error: <SafeDate date={errorPattern!.last_error} format="time" />
                              {errorPattern!.recent_errors.length > 0 && (
                                <span className="ml-2">• {errorPattern!.recent_errors[0].message}</span>
                              )}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            <code>{agentId}.json</code>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Webhook Event Logs Panel - Collapsible */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    Recent Webhook Events
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setWebhookEventsExpanded(!webhookEventsExpanded)}
                    className="h-6 px-2 text-xs text-gray-500"
                  >
                    {webhookEventsExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Hide
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Show Last 10
                      </>
                    )}
                  </Button>
                </div>

                {webhookEventsExpanded && (
                  <div className="space-y-2">
                    {webhookEventsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <RefreshCw className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                        <span className="text-xs text-gray-600">Loading events...</span>
                      </div>
                    ) : webhookEvents.length > 0 ? (
                      <div className="max-h-64 overflow-y-auto">
                        {webhookEvents.map((event, index) => (
                          <div
                            key={event.id || index}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs border"
                          >
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                className={`${
                                  event.http_status >= 200 && event.http_status < 300
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                {event.http_status}
                              </Badge>
                              <span className="font-mono text-gray-600">{event.workflow_id?.substring(0, 12) || 'N/A'}...</span>
                              <span className="text-gray-500">{getAgentDisplayName(event.agent_id)}</span>
                              {event.signature_valid !== undefined && (
                                <span className={`${event.signature_valid ? 'text-green-600' : 'text-red-600'}`}>
                                  {event.signature_valid ? '✓' : '✗'} Signature
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {event.processing_time_ms && (
                                <span className="text-gray-400">{event.processing_time_ms}ms</span>
                              )}
                              <SafeDate date={event.timestamp} format="time" fallback="Unknown" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs text-gray-500">
                        No recent webhook events found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Agent Test Result Toast Notification */}
          {testResult && (
            <div
              className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg border z-50 ${
                testResult.success
                  ? 'bg-green-50 text-green-800 border-green-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <div>
                  <div className="text-sm font-semibold">
                    {testResult.success ? 'Test Successful' : 'Test Failed'}
                  </div>
                  <div className="text-xs mt-1">{testResult.message}</div>
                  {testResult.response_time_ms && (
                    <div className="text-xs text-gray-600 mt-1">
                      Response time: {testResult.response_time_ms}ms
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payload Validation Modal */}
          {payloadModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Payload Validation Result</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPayloadModalOpen(false)}
                      className="h-8 w-8 p-0"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  {payloadResult && (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        {payloadResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className={`font-semibold ${
                          payloadResult.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {payloadResult.success ? 'Validation Successful' : 'Validation Failed'}
                        </span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          <SafeDate date={payloadResult.timestamp} format="datetime" />
                        </Badge>
                      </div>

                      {payloadResult.validation_errors && payloadResult.validation_errors.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-red-800 mb-2">Validation Errors:</h4>
                          <ul className="text-xs text-red-700 space-y-1">
                            {payloadResult.validation_errors.map((error, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-red-500">•</span>
                                <span>{error}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {payloadResult.payload && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Payload Preview:</h4>
                          <pre className="text-xs bg-gray-100 p-3 rounded border overflow-x-auto">
                            {JSON.stringify(payloadResult.payload, null, 2)}
                          </pre>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setPayloadModalOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
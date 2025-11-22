'use client';

/**
 * Enhanced Recent Data Component
 * Production-ready monitoring dashboard with unified force sync integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  RefreshCw,
  Calendar,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  TestTube,
  Eye,
  Heart,
  Database,
  Wifi,
  WifiOff,
  Clock,
  Shield,
  Server,
  Loader2,
  PlayCircle,
  StopCircle
} from 'lucide-react';
import { SafeDate } from '@/lib/utils/date-formatter';
import { useForceSyncUnified, type ForceSyncOptions } from '@/hooks/useForceSyncUnified';

// Enhanced interfaces for improved type safety
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

// Enhanced health check interface with production monitoring
interface EnhancedHealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: {
    status: 'connected' | 'degraded' | 'disconnected';
    latency_ms?: number;
  };
  opal_api: {
    status: 'available' | 'degraded' | 'unavailable';
    response_time_ms?: number;
  };
  webhooks: {
    status: 'active' | 'degraded' | 'inactive';
    last_received?: string;
  };
  workflow_engine: {
    status: 'operational' | 'degraded' | 'down';
    active_workflows?: number;
  };
  last_updated: string;
  fallback_used: boolean;
  cache_age_ms?: number;
}

// Enhanced force sync metrics interface
interface ForceSyncMetrics {
  lastForceSync: string | null;
  forceSyncWorkflowId: string | null;
  forceSyncSuccess: boolean;
  forceSyncAgentCount: number;
  total_syncs_24h: number;
  success_rate_24h: number;
}

interface OSAWorkflowData {
  lastOSAToolExecution: string | null;
  totalOSAToolExecutions: number;
  agentDataReception: {[key: string]: any};
  successfulReceptions: number;
  dataReceptionRate: number;
}

interface ComponentState {
  isOnline: boolean;
  lastSuccessfulUpdate: string | null;
  retryCount: number;
  adaptiveInterval: number;
}

interface EnhancedRecentDataProps {
  className?: string;
  compact?: boolean;
  showForceSync?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function EnhancedRecentDataComponent({
  className = '',
  compact = false,
  showForceSync = true,
  autoRefresh = true,
  refreshInterval = 30000
}: EnhancedRecentDataProps) {
  // Core state
  const [lastWebhookTrigger, setLastWebhookTrigger] = useState<string | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<'success' | 'failed' | 'processing' | 'none' | 'degraded'>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workflowAnalysis, setWorkflowAnalysis] = useState<any>(null);

  // Enhanced agent status with more granular states
  const [agentStatuses, setAgentStatuses] = useState<{[key: string]: 'unknown' | 'success' | 'failed' | 'degraded'}>({
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

  // Enhanced OPAL integration state
  const [forceSyncMetrics, setForceSyncMetrics] = useState<ForceSyncMetrics | null>(null);
  const [osaWorkflowData, setOSAWorkflowData] = useState<OSAWorkflowData | null>(null);
  const [healthData, setHealthData] = useState<EnhancedHealthData | null>(null);

  // UI interaction state
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [webhookEventsExpanded, setWebhookEventsExpanded] = useState(false);
  const [webhookEventsLoading, setWebhookEventsLoading] = useState(false);

  // Component resilience state
  const [componentState, setComponentState] = useState<ComponentState>({
    isOnline: true,
    lastSuccessfulUpdate: null,
    retryCount: 0,
    adaptiveInterval: 30000 // Start with 30s
  });

  // Force sync integration
  const {
    syncStatus,
    triggerSync,
    cancelSync,
    retrySync,
    isLoading: forceSyncLoading,
    isActive: forceSyncActive,
    canCancel,
    canRetry
  } = useForceSyncUnified();

  // Adaptive retry logic
  const calculateNextInterval = useCallback((retryCount: number): number => {
    const baseInterval = 30000; // 30 seconds
    const maxInterval = 300000; // 5 minutes
    const backoffMultiplier = Math.min(Math.pow(2, retryCount), 10); // Cap at 10x
    return Math.min(baseInterval * backoffMultiplier, maxInterval);
  }, []);

  // Enhanced health data fetch with intelligent caching awareness
  const fetchHealthData = useCallback(async () => {
    try {
      const response = await fetch('/api/opal/health', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'X-Requested-With': 'EnhancedRecentDataComponent'
        }
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setHealthData({
          status: result.data.status || 'unhealthy',
          database: result.data.checks?.database || { status: 'disconnected' },
          opal_api: result.data.checks?.opal_api || { status: 'unavailable' },
          webhooks: result.data.checks?.webhooks || { status: 'inactive' },
          workflow_engine: result.data.checks?.workflow_engine || { status: 'down' },
          last_updated: result.timestamp,
          fallback_used: result.cached || result.data.fallback_used || false,
          cache_age_ms: result.data.cache_age_ms
        });

        // Update component state
        setComponentState(prev => ({
          ...prev,
          isOnline: true,
          lastSuccessfulUpdate: new Date().toISOString(),
          retryCount: 0,
          adaptiveInterval: 30000
        }));

        // Update webhook status based on health
        const status = result.data.status;
        if (status === 'healthy') {
          setWebhookStatus('success');
        } else if (status === 'degraded') {
          setWebhookStatus('degraded');
        } else {
          setWebhookStatus('failed');
        }

        console.log('🏥 [Enhanced] Health data updated:', {
          status: result.data.status,
          cached: result.cached,
          fallback_used: result.data.fallback_used
        });

      } else {
        throw new Error(result.error || 'Health API returned invalid response');
      }
    } catch (error) {
      console.warn('⚠️ [Enhanced] Health fetch error (using fallback):', error);

      // Update component state for retry logic
      setComponentState(prev => {
        const newRetryCount = prev.retryCount + 1;
        const newInterval = calculateNextInterval(newRetryCount);

        return {
          ...prev,
          isOnline: false,
          retryCount: newRetryCount,
          adaptiveInterval: newInterval
        };
      });

      setWebhookStatus('failed');
      setError(error instanceof Error ? error.message : 'Network error occurred');

      // Fallback health data
      setHealthData({
        status: 'unhealthy',
        database: { status: 'disconnected' },
        opal_api: { status: 'unavailable' },
        webhooks: { status: 'inactive' },
        workflow_engine: { status: 'down' },
        last_updated: new Date().toISOString(),
        fallback_used: true
      });
    }
  }, [calculateNextInterval]);

  // Handle force sync trigger with enhanced options
  const handleForceSync = useCallback(async () => {
    const options: ForceSyncOptions = {
      sync_scope: 'quick',
      client_context: {
        client_name: 'OSA Admin Dashboard',
        industry: 'Technology'
      },
      triggered_by: 'enhanced_dashboard_ui',
      onProgress: (progress, message) => {
        console.log(`Force sync progress: ${progress}% - ${message}`);
      },
      onComplete: (result) => {
        console.log('Force sync completed:', result);
        // Refresh dashboard data after successful sync
        fetchDashboardData();
        fetchHealthData();
      },
      onError: (error) => {
        console.error('Force sync error:', error);
      }
    };

    await triggerSync(options);
  }, [triggerSync, fetchDashboardData, fetchHealthData]);

  // Enhanced dashboard data fetch with comprehensive error handling
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);

      // Parallel fetch with individual error handling
      const [statsResponse, logsResponse] = await Promise.allSettled([
        fetch('/api/webhook-events/stats?hours=24&include_force_sync=true'),
        fetch('/api/monitoring/agent-logs?level=error&hours=24&limit=100')
      ]);

      // Handle webhook stats
      if (statsResponse.status === 'fulfilled' && statsResponse.value.ok) {
        const statsData = await statsResponse.value.json();

        if (statsData.success) {
          // Update core webhook data
          if (statsData.lastTriggerTime) {
            setLastWebhookTrigger(statsData.lastTriggerTime);
            setWebhookStatus(statsData.workflowStatus || 'success');
          } else {
            setLastWebhookTrigger(null);
            setWebhookStatus('none');
          }

          // Update workflow analysis
          if (statsData.workflowAnalysis) {
            setWorkflowAnalysis(statsData.workflowAnalysis);
          }

          // Update agent statuses with enhanced mapping
          if (statsData.agentStatuses) {
            setAgentStatuses(prevStatuses => {
              const newStatuses = { ...prevStatuses };
              Object.keys(prevStatuses).forEach(agentId => {
                if (statsData.agentStatuses[agentId]) {
                  newStatuses[agentId] = statsData.agentStatuses[agentId];
                }
              });
              return newStatuses;
            });
          }

          // Update enhanced force sync metrics
          if (statsData.forceSync) {
            setForceSyncMetrics({
              ...statsData.forceSync,
              total_syncs_24h: statsData.forceSync.total_syncs_24h || 0,
              success_rate_24h: statsData.forceSync.success_rate_24h || 0
            });
          }

          if (statsData.osaWorkflowData) {
            setOSAWorkflowData(statsData.osaWorkflowData);
          }

          console.log('📊 [Enhanced] Dashboard data updated successfully');
        }
      } else {
        console.warn('⚠️ [Enhanced] Webhook stats fetch failed');
      }

      // Handle agent logs
      if (logsResponse.status === 'fulfilled' && logsResponse.value.ok) {
        const logsData = await logsResponse.value.json();
        if (logsData.success && logsData.agent_error_patterns) {
          setAgentErrorPatterns(logsData.agent_error_patterns);
        }
      }

    } catch (error) {
      console.error('❌ [Enhanced] Dashboard fetch error:', error);
      setError(error instanceof Error ? error.message : 'Network error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enhanced webhook events fetch
  const fetchWebhookEvents = useCallback(async () => {
    try {
      setWebhookEventsLoading(true);
      // Note: Diagnostics endpoint removed - using webhook-events/stats as alternative
      const response = await fetch('/api/webhook-events/stats?hours=24&limit=10&include_events=true');
      const data = await response.json();

      if (data.success && data.events) {
        setWebhookEvents(data.events);
      } else if (data.success && data.recentEvents) {
        // Fallback to recentEvents if available
        setWebhookEvents(data.recentEvents);
      } else {
        setWebhookEvents([]);
      }
    } catch (error) {
      console.error('❌ [Enhanced] Webhook events fetch error:', error);
      setWebhookEvents([]);
    } finally {
      setWebhookEventsLoading(false);
    }
  }, []);

  // Main data refresh function
  const refreshAllData = useCallback(async () => {
    setIsLoading(true);
    await Promise.allSettled([
      fetchDashboardData(),
      fetchHealthData()
    ]);
    setIsLoading(false);
  }, [fetchDashboardData, fetchHealthData]);

  // Auto-refresh setup with intelligent intervals
  useEffect(() => {
    // Initial data fetch
    refreshAllData();

    if (autoRefresh) {
      const healthInterval = setInterval(fetchHealthData, 60000); // Health every 60s
      const dashboardInterval = setInterval(fetchDashboardData, refreshInterval); // Dashboard configurable

      console.log(`🔄 [Enhanced] Auto-refresh: health=60s, dashboard=${refreshInterval/1000}s`);

      return () => {
        clearInterval(healthInterval);
        clearInterval(dashboardInterval);
      };
    }
  }, [autoRefresh, refreshInterval, refreshAllData, fetchHealthData, fetchDashboardData]);

  // Fetch webhook events when expanded
  useEffect(() => {
    if (webhookEventsExpanded) {
      fetchWebhookEvents();
    }
  }, [webhookEventsExpanded, fetchWebhookEvents]);

  // Enhanced agent status helpers
  const hasRepeatedFailures = useCallback((agentId: string): AgentErrorPattern | null => {
    return agentErrorPatterns.find(pattern =>
      pattern.agent_id === agentId && pattern.error_count >= 2
    ) || null;
  }, [agentErrorPatterns]);

  const getAgentStatusColor = useCallback((agentId: string, status: string) => {
    const errorPattern = hasRepeatedFailures(agentId);
    const osaReception = osaWorkflowData?.agentDataReception?.[agentId];
    const hasOSAData = osaReception && osaReception.success;

    // Priority: Critical errors > OSA Tool Status > Degraded > Current status
    if (errorPattern && errorPattern.error_count >= 3) {
      return 'bg-red-600'; // Critical failures
    } else if (errorPattern && errorPattern.error_count >= 2) {
      return 'bg-orange-500'; // Warning level failures
    }

    if (status === 'degraded') {
      return 'bg-yellow-500'; // Degraded state
    } else if (hasOSAData) {
      return 'bg-green-500'; // Successful OSA integration
    } else if (status === 'success') {
      return 'bg-blue-500'; // Webhook success only
    } else if (status === 'failed') {
      return 'bg-red-500'; // Failed webhook
    } else {
      return 'bg-gray-400'; // Unknown/idle
    }
  }, [hasRepeatedFailures, osaWorkflowData]);

  const getAgentTooltipText = useCallback((agentId: string, status: string) => {
    const errorPattern = hasRepeatedFailures(agentId);
    const osaReception = osaWorkflowData?.agentDataReception?.[agentId];
    const agentName = getAgentDisplayName(agentId);

    let statusText = '';
    if (errorPattern && errorPattern.error_count >= 2) {
      statusText = `${errorPattern.error_count} failures`;
    } else if (status === 'degraded') {
      statusText = 'Degraded (Limited functionality)';
    } else if (osaReception && osaReception.success) {
      const dataAge = Math.floor((Date.now() - new Date(osaReception.timestamp).getTime()) / (1000 * 60));
      statusText = `OSA Active (${dataAge}m ago)`;
    } else if (status === 'success') {
      statusText = 'Webhook Active';
    } else if (status === 'failed') {
      statusText = 'Failed';
    } else {
      statusText = 'Idle';
    }

    return `${agentName}: ${statusText}`;
  }, [hasRepeatedFailures, osaWorkflowData]);

  // Helper functions for health status display
  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'available':
      case 'active':
      case 'operational':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getOverallHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Heart className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getAgentDisplayName = useCallback((agentId: string) => {
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
  }, []);

  // Enhanced time formatting with fallback
  const formatLastTriggerTime = useCallback((timestamp: string | null) => {
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
      return 'Invalid date';
    }
  }, []);

  // Render connection status indicator
  const renderConnectionStatus = () => {
    const isHealthy = healthData?.overall_status === 'green';
    const isDegraded = healthData?.overall_status === 'degraded';
    const isOffline = !componentState.isOnline;

    return (
      <div className="flex items-center gap-2 text-xs">
        {isOffline ? (
          <>
            <WifiOff className="h-3 w-3 text-red-500" />
            <span className="text-red-600">Offline</span>
          </>
        ) : isDegraded ? (
          <>
            <AlertTriangle className="h-3 w-3 text-yellow-500" />
            <span className="text-yellow-600">Degraded</span>
          </>
        ) : isHealthy ? (
          <>
            <Wifi className="h-3 w-3 text-green-500" />
            <span className="text-green-600">Online</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-3 w-3 text-gray-400" />
            <span className="text-gray-600">Checking...</span>
          </>
        )}

        {componentState.retryCount > 0 && (
          <span className="text-xs text-gray-500">
            (Retry {componentState.retryCount})
          </span>
        )}
      </div>
    );
  };

  if (compact) {
    return (
      <Card id="enhanced-recent-data" className={`${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold">System Health</span>
              {healthData && (
                <Badge className={`text-xs ${getHealthStatusColor(healthData.status)}`}>
                  {healthData.status}
                  {healthData.fallback_used && ' (cached)'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {showForceSync && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleForceSync}
                  disabled={forceSyncLoading || forceSyncActive}
                  className="h-6 px-2 text-xs"
                >
                  {forceSyncLoading || forceSyncActive ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Zap className="h-3 w-3" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshAllData}
                className="h-6 w-6 p-0"
                disabled={isLoading}
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Enhanced Webhook Status with Fallback States */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {webhookStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {webhookStatus === 'processing' && <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />}
              {webhookStatus === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
              {webhookStatus === 'degraded' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
              {webhookStatus === 'none' && <AlertCircle className="h-4 w-4 text-gray-400" />}
              <span className="text-xs text-gray-600">
                {webhookStatus === 'success' ? 'Workflow Active' :
                 webhookStatus === 'processing' ? 'Processing...' :
                 webhookStatus === 'failed' ? 'Connection Failed' :
                 webhookStatus === 'degraded' ? 'Degraded Mode' :
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

          {/* Health Summary */}
          {healthData && (
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span>Database</span>
                <Badge className={getHealthStatusColor(healthData.database.status)}>
                  {healthData.database.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>OPAL API</span>
                <Badge className={getHealthStatusColor(healthData.opal_api.status)}>
                  {healthData.opal_api.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Webhooks</span>
                <Badge className={getHealthStatusColor(healthData.webhooks.status)}>
                  {healthData.webhooks.status}
                </Badge>
              </div>
            </div>
          )}

          {/* Force sync status */}
          {showForceSync && forceSyncActive && (
            <div className="mb-3 p-2 bg-blue-50 rounded text-xs">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">Force Sync Active</span>
                <span className="text-blue-600">{syncStatus.progress}%</span>
              </div>
              <div className="text-blue-700 mt-1">{syncStatus.message}</div>
            </div>
          )}

          {/* Enhanced Force Sync Status Display */}
          {forceSyncMetrics && forceSyncMetrics.lastForceSync && (
            <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-800">Last Force Sync</span>
                </div>
                <Badge
                  variant={forceSyncMetrics.forceSyncSuccess ? "default" : "destructive"}
                  className="text-xs"
                >
                  {forceSyncMetrics.forceSyncSuccess ? 'Success' : 'Failed'}
                </Badge>
              </div>
              <div className="text-xs text-blue-700 mt-1">
                <SafeDate date={forceSyncMetrics.lastForceSync} format="datetime" />
                {forceSyncMetrics.forceSyncAgentCount > 0 && (
                  <span className="ml-2">• {forceSyncMetrics.forceSyncAgentCount} agents</span>
                )}
              </div>
            </div>
          )}

          {/* Agent Status Indicators with Enhanced Error Handling */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">OPAL Agents</span>
              <div className="flex items-center gap-1">
                {workflowAnalysis && (
                  <Badge variant="outline" className="text-xs">
                    {workflowAnalysis.agentResponseCount || 0}/9 Active
                  </Badge>
                )}
                {healthData?.database.status === 'disconnected' && (
                  <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                    Degraded
                  </Badge>
                )}
              </div>
            </div>

            {/* Agent Status Bubbles with Enhanced States */}
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

            {/* Enhanced Error Warning */}
            {agentErrorPatterns.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <AlertTriangle className="h-3 w-3 text-orange-500" />
                <span className="text-xs text-orange-600">
                  {agentErrorPatterns.length} agent{agentErrorPatterns.length > 1 ? 's' : ''} with issues
                </span>
              </div>
            )}
          </div>

          {/* Enhanced Status Messages with Fallback States */}
          {webhookStatus === 'success' && workflowAnalysis && workflowAnalysis.agentResponseCount >= 9 && (
            <div className="mt-3 p-2 bg-green-50 rounded text-xs text-green-800">
              All OPAL agents processing data
            </div>
          )}

          {webhookStatus === 'degraded' && healthData?.fallback_used && (
            <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
              <div className="font-semibold">Degraded Mode:</div>
              <div>Using cached health data - live monitoring unavailable</div>
            </div>
          )}

          {webhookStatus === 'failed' && (
            <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-800">
              Connection issue detected
              {componentState.retryCount > 0 && (
                <div className="mt-1">Retrying... ({componentState.retryCount} attempts)</div>
              )}
            </div>
          )}

          {error && !componentState.isOnline && (
            <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700">
              {error}
              <div className="mt-1 text-gray-600">
                Next retry in {Math.round(componentState.adaptiveInterval / 1000)}s
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full version with comprehensive monitoring and force sync management
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Health Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {healthData && getOverallHealthIcon(healthData.status)}
              System Health & Performance
              {healthData && (
                <Badge className={`${getHealthStatusColor(healthData.status)}`}>
                  {healthData.status}
                  {healthData.fallback_used && ' (Cached)'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchHealthData}
                disabled={isLoading}
                className="h-7 px-2 text-xs"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Real-time system health monitoring with intelligent caching fallback
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600 ml-3">Loading health data...</p>
            </div>
          ) : healthData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Database Health */}
              <div className={`p-4 rounded-lg border ${getHealthStatusColor(healthData.database.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <Database className="h-5 w-5" />
                  <Badge variant="outline" className="text-xs">
                    {healthData.database.status}
                  </Badge>
                </div>
                <div className="text-sm font-medium">Database</div>
                {healthData.database.latency_ms && (
                  <div className="text-xs mt-1">
                    Latency: {healthData.database.latency_ms}ms
                  </div>
                )}
              </div>

              {/* OPAL API Health */}
              <div className={`p-4 rounded-lg border ${getHealthStatusColor(healthData.opal_api.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <Zap className="h-5 w-5" />
                  <Badge variant="outline" className="text-xs">
                    {healthData.opal_api.status}
                  </Badge>
                </div>
                <div className="text-sm font-medium">OPAL API</div>
                {healthData.opal_api.response_time_ms && (
                  <div className="text-xs mt-1">
                    Response: {healthData.opal_api.response_time_ms}ms
                  </div>
                )}
              </div>

              {/* Webhooks Health */}
              <div className={`p-4 rounded-lg border ${getHealthStatusColor(healthData.webhooks.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <Activity className="h-5 w-5" />
                  <Badge variant="outline" className="text-xs">
                    {healthData.webhooks.status}
                  </Badge>
                </div>
                <div className="text-sm font-medium">Webhooks</div>
                {healthData.webhooks.last_received && (
                  <div className="text-xs mt-1">
                    Last: <SafeDate date={healthData.webhooks.last_received} format="time" />
                  </div>
                )}
              </div>

              {/* Workflow Engine Health */}
              <div className={`p-4 rounded-lg border ${getHealthStatusColor(healthData.workflow_engine.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <PlayCircle className="h-5 w-5" />
                  <Badge variant="outline" className="text-xs">
                    {healthData.workflow_engine.status}
                  </Badge>
                </div>
                <div className="text-sm font-medium">Workflows</div>
                {healthData.workflow_engine.active_workflows !== undefined && (
                  <div className="text-xs mt-1">
                    Active: {healthData.workflow_engine.active_workflows}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-red-600">
              <XCircle className="h-8 w-8 mx-auto mb-3" />
              <p>Failed to load health data</p>
              {error && <p className="text-sm mt-2">{error}</p>}
            </div>
          )}

          {/* Cache status indicator */}
          {healthData && healthData.fallback_used && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800 font-medium">
                  Using cached health data
                </span>
                {healthData.cache_age_ms && (
                  <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300">
                    {Math.round(healthData.cache_age_ms / 1000)}s old
                  </Badge>
                )}
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Live health check unavailable - displaying last known status
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Force Sync Card */}
      {showForceSync && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-blue-600" />
                Force Sync Management
                {forceSyncActive && (
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                    {syncStatus.status}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {canCancel && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelSync}
                    className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <StopCircle className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                )}
                {canRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => retrySync()}
                    className="h-7 px-2 text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
                <Button
                  variant={forceSyncActive ? "secondary" : "default"}
                  size="sm"
                  onClick={handleForceSync}
                  disabled={forceSyncLoading || forceSyncActive}
                  className="h-7 px-3 text-xs"
                >
                  {forceSyncLoading || forceSyncActive ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      {syncStatus.activeForm || 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Zap className="h-3 w-3 mr-1" />
                      Trigger Sync
                    </>
                  )}
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Unified force sync with real-time progress monitoring and session management
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Active sync status */}
            {forceSyncActive && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {syncStatus.message}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs text-blue-700 border-blue-300">
                    {syncStatus.progress}%
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${syncStatus.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-blue-600">
                  <span>Session ID: {syncStatus.session_id?.substring(0, 12)}...</span>
                  {syncStatus.started_at && (
                    <span>Started: <SafeDate date={syncStatus.started_at} format="time" /></span>
                  )}
                </div>
              </div>
            )}

            {/* Sync metrics */}
            {forceSyncMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">Last Sync</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {forceSyncMetrics.lastForceSync ? (
                      <SafeDate date={forceSyncMetrics.lastForceSync} format="datetime" />
                    ) : (
                      'Never'
                    )}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">24h Syncs</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {forceSyncMetrics.total_syncs_24h} total
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">Success Rate</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {Math.round(forceSyncMetrics.success_rate_24h * 100)}%
                  </div>
                </div>
              </div>
            )}

            {/* Sync error state */}
            {syncStatus.status === 'failed' && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Sync Failed</span>
                </div>
                {syncStatus.error && (
                  <p className="text-xs text-red-700 mt-1">{syncStatus.error}</p>
                )}
              </div>
            )}

            {/* Sync success state */}
            {syncStatus.status === 'completed' && syncStatus.result && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Sync Completed Successfully</span>
                </div>
                <p className="text-xs text-green-700 mt-1">
                  Workflow ID: {syncStatus.result.workflow_id}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Agent Status Card (enhanced with webhook events) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-blue-600" />
              OPAL Agent Monitoring
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setWebhookEventsExpanded(!webhookEventsExpanded)}
              className="h-7 px-2 text-xs text-gray-500"
            >
              {webhookEventsExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide Events
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show Events
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Agent status grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {Object.entries(agentStatuses).map(([agentId, status]) => {
              const errorPattern = agentErrorPatterns.find(p => p.agent_id === agentId);
              const hasErrors = errorPattern && errorPattern.error_count >= 2;

              return (
                <div
                  key={agentId}
                  className={`p-3 rounded-lg border ${
                    hasErrors ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">{getAgentDisplayName(agentId)}</div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        hasErrors ? 'bg-red-100 text-red-800 border-red-300' :
                        status === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
                        status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {hasErrors ? `${errorPattern.error_count} errors` :
                       status === 'success' ? 'Active' :
                       status === 'failed' ? 'Failed' : 'Idle'}
                    </Badge>
                  </div>
                  {hasErrors && errorPattern && (
                    <div className="text-xs text-red-600">
                      Last error: <SafeDate date={errorPattern.last_error} format="time" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Webhook events (collapsible) */}
          {webhookEventsExpanded && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Webhook Events</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {webhookEvents.length > 0 ? (
                  webhookEvents.map((event, index) => (
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
                        <span className="font-mono text-gray-600">
                          {event.workflow_id?.substring(0, 8)}...
                        </span>
                        <span className="text-gray-500">
                          {getAgentDisplayName(event.agent_id)}
                        </span>
                        {event.signature_valid !== undefined && (
                          <span className={`${event.signature_valid ? 'text-green-600' : 'text-red-600'}`}>
                            {event.signature_valid ? '✓' : '✗'}
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
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-gray-500">
                    No recent webhook events
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw, Calendar, Zap, AlertCircle, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, TestTube, Eye, Heart } from 'lucide-react';
import { SafeDate } from '@/lib/utils/date-formatter';

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

export default function RecentDataComponent({ className = '', compact = false }: RecentDataComponentProps) {
  const [lastWebhookTrigger, setLastWebhookTrigger] = useState<string | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<'success' | 'failed' | 'processing' | 'none'>('none');
  const [isLoading, setIsLoading] = useState(true);
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

  // Fetch webhook statistics and agent statuses
  const fetchDashboardData = async () => {
    try {
      setError(null);

      // Fetch webhook stats and agent error patterns in parallel
      const [statsResponse, logsResponse] = await Promise.all([
        fetch('/api/webhook-events/stats?hours=24'),
        fetch('/api/monitoring/agent-logs?level=error&hours=24&limit=100')
      ]);

      const statsData = await statsResponse.json();
      const logsData = await logsResponse.json();

      if (statsData.success) {
        // Update last webhook trigger time and status
        if (statsData.lastTriggerTime) {
          setLastWebhookTrigger(statsData.lastTriggerTime);
          setWebhookStatus(statsData.workflowStatus || 'success');
        } else {
          setLastWebhookTrigger(null);
          setWebhookStatus('none');
        }

        // Update workflow analysis data
        if (statsData.workflowAnalysis) {
          setWorkflowAnalysis(statsData.workflowAnalysis);
        }

        // Update agent statuses
        if (statsData.agentStatuses) {
          setAgentStatuses(statsData.agentStatuses);
        }

        console.log('📊 Recent data component updated:', {
          lastTrigger: statsData.lastTriggerTime,
          workflowStatus: statsData.workflowStatus,
          agentStatuses: statsData.agentStatuses
        });
      } else {
        console.error('Failed to fetch recent data:', statsData.error);
        setWebhookStatus('failed');
        setError(statsData.error || 'Failed to fetch recent data');
      }

      // Update agent error patterns
      if (logsData.success && logsData.agent_error_patterns) {
        setAgentErrorPatterns(logsData.agent_error_patterns);
      }

    } catch (error) {
      console.error('Error fetching recent data:', error);
      setWebhookStatus('failed');
      setError(error instanceof Error ? error.message : 'Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // New fetch functions for OSA integration enhancements

  // 1. Fetch webhook event logs
  const fetchWebhookEvents = async () => {
    try {
      setWebhookEventsLoading(true);
      const response = await fetch('/api/diagnostics/last-webhook?limit=10&status=all&hours=24');
      const data = await response.json();

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
      const response = await fetch('/api/opal/health');
      const data = await response.json();

      // Handle both successful responses and expected 503 status (service unavailable but configured)
      if (response.ok || response.status === 503) {
        setHealthData({
          overall_status: data.overall_status || 'red',
          signature_valid_rate: data.signature_valid_rate || 0,
          error_rate_24h: data.error_rate_24h || 0,
          last_webhook_minutes_ago: data.last_webhook_minutes_ago || 999,
          uptime_percentage: data.uptime_percentage
        });

        // Silent handling for expected 503 responses - no console output
        if (response.status === 503) {
          // 503 is expected when OPAL service is not available but health endpoint is functioning
          // This is normal behavior and should not generate console errors
          return;
        }
      } else {
        // Only log truly unexpected errors (400, 500, etc. - not 503)
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
      const response = await fetch('/api/opal/test-payload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_mode: true })
      });
      const data = await response.json();

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

      const response = await fetch('/api/opal/enhanced-tools', {
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

      const data = await response.json();
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
    // Initial fetch
    fetchDashboardData();
    fetchHealthData();

    // Auto-refresh every 30 seconds for dashboard data
    const dashboardInterval = setInterval(fetchDashboardData, 30000);

    // Health check every 60 seconds
    const healthInterval = setInterval(fetchHealthData, 60000);

    return () => {
      clearInterval(dashboardInterval);
      clearInterval(healthInterval);
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

    // Priority: Repeated failures > Current status
    if (errorPattern && errorPattern.error_count >= 3) {
      return 'bg-red-600'; // Dark red for multiple failures
    } else if (errorPattern && errorPattern.error_count >= 2) {
      return 'bg-orange-500'; // Orange for repeated failures warning
    }

    // Regular status colors
    switch (status) {
      case 'success': return 'bg-green-500'; // Green for successful OPAL data reception
      case 'failed': return 'bg-red-500';    // Red for failed OPAL data reception
      case 'unknown':
      default: return 'bg-gray-400';         // Gray for unknown status (default)
    }
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
    return (
      <Card id="recent-data" className={`${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold">Recent Data</span>
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
                    title={`${getAgentDisplayName(agentId)}: ${
                      hasErrors ? `${errorPattern!.error_count} failures` :
                      status === 'success' ? 'Active' :
                      status === 'failed' ? 'Failed' : 'Idle'
                    }${hasErrors ? ` (Last: ${new Date(errorPattern!.last_error).toLocaleTimeString()})` : ''}`}
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
            <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full version (non-compact)
  return (
    <div id="recent-data" className={`space-y-6 ${className}`}>
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
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm text-red-700">
                <strong>Error loading recent data:</strong> {error}
              </div>
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
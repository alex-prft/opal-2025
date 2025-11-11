'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw, Calendar, Zap, AlertCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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

  useEffect(() => {
    // Initial fetch
    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, []);

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
          <CardTitle className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-blue-600" />
            OPAL Agent Status
          </CardTitle>
          <CardDescription>
            Real-time status of all 9 OPAL strategy agents
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
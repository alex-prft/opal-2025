'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Activity,
  Server,
  Zap,
  Clock,
  ExternalLink,
  Eye,
  Database,
  Webhook,
  Radio
} from 'lucide-react';

interface AgentHealth {
  agent_id: string;
  name: string;
  status: 'healthy' | 'warning' | 'unhealthy' | 'unknown';
  last_activity: string | null;
  response_time_ms: number | null;
  error_count_24h: number;
  success_rate_24h: number;
  uptime_percentage: number;
  version?: string;
  endpoint_url?: string;
}

interface WorkflowStatus {
  workflow_id: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  agent_id: string;
  client_name?: string;
}

interface OpalAgentStatusData {
  agents: AgentHealth[];
  active_workflows: WorkflowStatus[];
  system_health: {
    overall_status: 'green' | 'yellow' | 'red';
    total_agents: number;
    healthy_agents: number;
    active_workflows: number;
    avg_response_time_ms: number;
  };
  last_updated: string;
}

interface OpalAgentStatusProps {
  isLoading?: boolean;
  onRefresh?: () => void;
}

export default function OpalAgentStatus({
  isLoading = false,
  onRefresh
}: OpalAgentStatusProps) {
  const [data, setData] = useState<OpalAgentStatusData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Fetch agent status data
  const fetchAgentData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/opal/workflow-status', {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch agent status: ${response.status}`);
      }

      const result = await response.json();

      // Transform the data into the expected format
      const transformedData: OpalAgentStatusData = {
        agents: result.agents || [
          {
            agent_id: 'strategy_assistant',
            name: 'Strategy Assistant',
            status: result.overall_status === 'green' ? 'healthy' :
                   result.overall_status === 'yellow' ? 'warning' : 'unhealthy',
            last_activity: result.last_webhook_time || null,
            response_time_ms: result.avg_response_time || null,
            error_count_24h: result.error_count_24h || 0,
            success_rate_24h: result.success_rate_24h || 0.95,
            uptime_percentage: result.uptime_percentage || 0.98,
            version: result.version || '1.0.0',
            endpoint_url: '/api/opal/trigger'
          },
          {
            agent_id: 'webhook_receiver',
            name: 'Webhook Receiver',
            status: result.webhook_health === 'healthy' ? 'healthy' : 'warning',
            last_activity: result.last_webhook_time || null,
            response_time_ms: result.webhook_response_time || null,
            error_count_24h: result.webhook_errors_24h || 0,
            success_rate_24h: result.webhook_success_rate || 0.99,
            uptime_percentage: result.webhook_uptime || 0.99,
            version: '1.0.0',
            endpoint_url: '/api/webhooks/opal-workflow'
          }
        ],
        active_workflows: result.active_workflows || [],
        system_health: {
          overall_status: result.overall_status || 'yellow',
          total_agents: 2,
          healthy_agents: result.overall_status === 'green' ? 2 : 1,
          active_workflows: result.active_workflows?.length || 0,
          avg_response_time_ms: result.avg_response_time || 150
        },
        last_updated: new Date().toISOString()
      };

      setData(transformedData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch agent data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load agent status');
    }
  };

  // Initial data load
  useEffect(() => {
    fetchAgentData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRefreshing) {
        fetchAgentData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isRefreshing]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchAgentData();
      if (onRefresh) {
        onRefresh();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (startTime: string, endTime?: string): string => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);

    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>OPAL Agent Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading agent status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>OPAL Agent Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              OPAL Agent Status
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Real-time monitoring of OPAL agents and active workflows
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right text-xs text-gray-500">
              <div>Last updated</div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* System Health Overview */}
        {data?.system_health && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm">System Health Overview</h3>
              <Badge className={getStatusColor(data.system_health.overall_status)}>
                {data.system_health.overall_status === 'green' ? '✅ Healthy' :
                 data.system_health.overall_status === 'yellow' ? '⚠️ Warning' : '❌ Critical'}
              </Badge>
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="text-gray-600">Total Agents</p>
                <p className="font-semibold text-lg">{data.system_health.total_agents}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Healthy</p>
                <p className="font-semibold text-lg text-green-600">
                  {data.system_health.healthy_agents}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Active Workflows</p>
                <p className="font-semibold text-lg text-blue-600">
                  {data.system_health.active_workflows}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Avg Response</p>
                <p className="font-semibold text-lg">
                  {data.system_health.avg_response_time_ms}ms
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Agent Details */}
        {data?.agents && data.agents.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Agent Health Status</h3>

            {data.agents.map((agent) => (
              <div
                key={agent.agent_id}
                className={`p-4 border rounded-lg ${getStatusColor(agent.status)} cursor-pointer transition-all hover:shadow-md`}
                onClick={() => setSelectedAgent(
                  selectedAgent === agent.agent_id ? null : agent.agent_id
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(agent.status)}
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm opacity-80">ID: {agent.agent_id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    {agent.response_time_ms !== null && (
                      <div className="text-center">
                        <p className="text-xs opacity-60">Response</p>
                        <p className="font-medium">{agent.response_time_ms}ms</p>
                      </div>
                    )}

                    <div className="text-center">
                      <p className="text-xs opacity-60">Success Rate</p>
                      <p className="font-medium">
                        {(agent.success_rate_24h * 100).toFixed(1)}%
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs opacity-60">Uptime</p>
                      <p className="font-medium">
                        {(agent.uptime_percentage * 100).toFixed(1)}%
                      </p>
                    </div>

                    <Eye className="h-4 w-4 opacity-60" />
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedAgent === agent.agent_id && (
                  <div className="mt-4 pt-4 border-t border-current/20 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs opacity-60 mb-1">Last Activity</p>
                        <p className="font-mono">
                          {agent.last_activity
                            ? new Date(agent.last_activity).toLocaleString()
                            : 'No recent activity'
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs opacity-60 mb-1">Version</p>
                        <p className="font-mono">{agent.version || 'Unknown'}</p>
                      </div>

                      <div>
                        <p className="text-xs opacity-60 mb-1">24h Errors</p>
                        <p className={`font-semibold ${
                          agent.error_count_24h > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {agent.error_count_24h}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs opacity-60 mb-1">Endpoint</p>
                        <p className="font-mono text-xs truncate">
                          {agent.endpoint_url || 'Not configured'}
                        </p>
                      </div>
                    </div>

                    {agent.endpoint_url && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(agent.endpoint_url, '_blank');
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <ExternalLink className="h-3 w-3 mr-2" />
                          Test Endpoint
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Active Workflows */}
        {data?.active_workflows && data.active_workflows.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Active Workflows ({data.active_workflows.length})
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {data.active_workflows.map((workflow) => (
                <div
                  key={workflow.workflow_id}
                  className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-sm">
                        {workflow.client_name || 'Workflow'}
                      </p>
                      <p className="text-xs text-gray-600 font-mono">
                        {workflow.workflow_id}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-sm">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      {workflow.status}
                    </Badge>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatDuration(workflow.started_at, workflow.completed_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <Button
              onClick={() => window.open('/api/opal/workflow-status', '_blank')}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Database className="h-4 w-4 mr-2" />
              Raw Status Data
            </Button>
            <Button
              onClick={() => window.open('/api/webhooks/opal-workflow', '_blank')}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Webhook className="h-4 w-4 mr-2" />
              Webhook Health
            </Button>
            <Button
              onClick={() => window.open('/engine/admin/opal-monitoring', '_blank')}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Radio className="h-4 w-4 mr-2" />
              Full Monitoring
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
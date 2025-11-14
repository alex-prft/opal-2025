'use client';

import { useState, useEffect } from 'react';
import {
  agentStatusTracker,
  AgentStatus,
  AgentStatusInfo,
  WorkflowProgress
} from '@/lib/monitoring/agent-status-tracker';
import {
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Pause,
  Play,
  TrendingUp,
  Database,
  Zap,
  Timer,
  Users,
  BarChart3,
  Settings,
  MapPin,
  FileText,
  Route,
  Shield,
  Workflow,
  User
} from 'lucide-react';

interface AgentMonitoringDashboardProps {
  className?: string;
}

// Get agent icon based on agent ID
function getAgentIcon(agentId: string) {
  const iconMap: Record<string, any> = {
    'content_review': FileText,
    'geo_audit': MapPin,
    'audience_suggester': Users,
    'experiment_blueprinter': BarChart3,
    'personalization_idea_generator': User,
    'roadmap_generator': Route,
    'integration_health': Shield,
    'cmp_organizer': Workflow,
    'customer_journey': TrendingUp
  };
  return iconMap[agentId] || Activity;
}

// Status icon and color helper
function getStatusDisplay(status: AgentStatus) {
  switch (status) {
    case 'idle':
      return { icon: Pause, color: 'text-gray-500', bg: 'bg-gray-100', ring: 'ring-gray-200' };
    case 'starting':
      return { icon: Play, color: 'text-blue-500', bg: 'bg-blue-100', ring: 'ring-blue-200' };
    case 'running':
      return { icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100', ring: 'ring-blue-300' };
    case 'completed':
      return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', ring: 'ring-green-200' };
    case 'failed':
      return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', ring: 'ring-red-200' };
    case 'timeout':
      return { icon: Clock, color: 'text-red-500', bg: 'bg-red-100', ring: 'ring-red-200' };
    case 'retrying':
      return { icon: RotateCcw, color: 'text-yellow-600', bg: 'bg-yellow-100', ring: 'ring-yellow-200' };
    default:
      return { icon: AlertTriangle, color: 'text-gray-500', bg: 'bg-gray-100', ring: 'ring-gray-200' };
  }
}

// Individual agent card component
interface AgentCardProps {
  agentInfo: AgentStatusInfo;
  agentConfig: {
    name: string;
    description: string;
    estimated_runtime_ms: number;
    timeout_threshold_ms: number;
  };
}

function AgentCard({ agentInfo, agentConfig }: AgentCardProps) {
  const statusDisplay = getStatusDisplay(agentInfo.status);
  const AgentIcon = getAgentIcon(agentInfo.agent_id);
  const StatusIcon = statusDisplay.icon;

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${statusDisplay.bg} ${statusDisplay.ring}`}>
      {/* Agent Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white shadow-sm`}>
            <AgentIcon className="h-5 w-5 text-gray-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{agentConfig.name}</h3>
            <p className="text-xs text-gray-600 mt-0.5">{agentConfig.description}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-white shadow-sm border`}>
          <StatusIcon className={`h-3 w-3 ${statusDisplay.color} ${agentInfo.status === 'running' ? 'animate-spin' : ''}`} />
          <span className={`text-xs font-medium ${statusDisplay.color} capitalize`}>
            {agentInfo.status}
          </span>
        </div>
      </div>

      {/* Agent Metrics */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Last Updated:</span>
            <span className="font-medium">{formatTimestamp(agentInfo.last_updated)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Execution Time:</span>
            <span className="font-medium">{formatDuration(agentInfo.execution_time_ms)}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Retry Count:</span>
            <span className="font-medium">{agentInfo.retry_count || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Progress:</span>
            <span className="font-medium">{agentInfo.progress_percentage || 0}%</span>
          </div>
        </div>
      </div>

      {/* Progress Bar (if running) */}
      {agentInfo.status === 'running' && agentInfo.progress_percentage && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600">Processing</span>
            <span className="font-medium">{agentInfo.progress_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${agentInfo.progress_percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message (if failed) */}
      {(agentInfo.status === 'failed' || agentInfo.status === 'timeout') && agentInfo.error_message && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
          <span className="text-red-700 font-medium">Error: </span>
          <span className="text-red-600">{agentInfo.error_message}</span>

          {/* Retry Sync Button */}
          <div className="mt-2 flex justify-end">
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/opal/sync', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      sync_scope: 'priority_platforms',
                      triggered_by: 'agent_retry',
                      client_context: {
                        client_name: `Retry for ${agentId}`,
                        recipients: ['admin@opal.ai']
                      }
                    })
                  });

                  if (response.ok) {
                    // Optionally refresh the agent status or show success feedback
                    console.log('Retry sync initiated successfully');
                  }
                } catch (error) {
                  console.error('Retry sync failed:', error);
                }
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Retry Sync
            </button>
          </div>
        </div>
      )}

      {/* Workflow ID (if active) */}
      {agentInfo.workflow_id && (
        <div className="mt-3 text-xs text-gray-500">
          Workflow: <code className="bg-gray-100 px-1 rounded">{agentInfo.workflow_id.slice(0, 8)}...</code>
        </div>
      )}
    </div>
  );
}

export default function AgentMonitoringDashboard({ className }: AgentMonitoringDashboardProps) {
  const [agentStatuses, setAgentStatuses] = useState<Map<string, AgentStatusInfo>>(new Map());
  const [workflowProgress, setWorkflowProgress] = useState<Map<string, WorkflowProgress>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [isStreamConnected, setIsStreamConnected] = useState(false);

  // Real-time status updates
  useEffect(() => {
    const loadData = () => {
      const statuses = agentStatusTracker.getLatestAgentStatuses();
      setAgentStatuses(statuses);
      setLastUpdate(new Date());
    };

    // Initial load
    loadData();

    // Subscribe to real-time updates
    const unsubscribeAgent = agentStatusTracker.subscribe((updatedStatus: AgentStatusInfo) => {
      setAgentStatuses(prevStatuses => {
        const newStatuses = new Map(prevStatuses);
        newStatuses.set(updatedStatus.agent_id, updatedStatus);
        return newStatuses;
      });
      setLastUpdate(new Date());
    });

    const unsubscribeWorkflow = agentStatusTracker.subscribeToWorkflow((progress: WorkflowProgress) => {
      setWorkflowProgress(prevProgress => {
        const newProgress = new Map(prevProgress);
        newProgress.set(progress.workflow_id, progress);
        return newProgress;
      });
    });

    // Auto-refresh interval
    const interval = setInterval(() => {
      if (isAutoRefresh) {
        loadData();
      }
    }, 3000); // Refresh every 3 seconds

    return () => {
      unsubscribeAgent();
      unsubscribeWorkflow();
      clearInterval(interval);
    };
  }, [isAutoRefresh]);

  // SSE Real-time webhook event streaming
  useEffect(() => {
    if (!isAutoRefresh) return;

    const eventSource = new EventSource('/api/webhook-events/stream');

    eventSource.onopen = () => {
      console.log('[AgentMonitoring] SSE connection opened');
      setIsStreamConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const eventData = JSON.parse(event.data);

        // Update agent status based on webhook events
        if (eventData.type === 'agent_status_update' && eventData.payload?.agent_id) {
          const agentUpdate: AgentStatusInfo = {
            agent_id: eventData.payload.agent_id,
            agent_name: eventData.payload.agent_name || eventData.payload.agent_id,
            status: eventData.payload.status || 'idle',
            last_updated: eventData.timestamp || new Date().toISOString(),
            execution_time_ms: eventData.payload.execution_time_ms,
            error_message: eventData.payload.error_message,
            retry_count: eventData.payload.retry_count || 0,
            progress_percentage: eventData.payload.progress_percentage,
            workflow_id: eventData.payload.workflow_id
          };

          setAgentStatuses(prevStatuses => {
            const newStatuses = new Map(prevStatuses);
            newStatuses.set(agentUpdate.agent_id, agentUpdate);
            return newStatuses;
          });
          setLastUpdate(new Date());
        }

        // Handle workflow progress updates
        if (eventData.type === 'workflow_progress' && eventData.payload?.workflow_id) {
          const workflowUpdate: WorkflowProgress = {
            workflow_id: eventData.payload.workflow_id,
            status: eventData.payload.status,
            progress_percentage: eventData.payload.progress_percentage,
            completed_agents: eventData.payload.completed_agents || [],
            active_agent: eventData.payload.active_agent,
            estimated_completion_time: eventData.payload.estimated_completion_time,
            last_updated: eventData.timestamp || new Date().toISOString()
          };

          setWorkflowProgress(prevProgress => {
            const newProgress = new Map(prevProgress);
            newProgress.set(workflowUpdate.workflow_id, workflowUpdate);
            return newProgress;
          });
        }

      } catch (error) {
        console.error('[AgentMonitoring] Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[AgentMonitoring] SSE connection error:', error);
      setIsStreamConnected(false);
      // Connection will automatically retry
    };

    return () => {
      console.log('[AgentMonitoring] Closing SSE connection');
      setIsStreamConnected(false);
      eventSource.close();
    };
  }, [isAutoRefresh]);

  // Agent configuration from status tracker
  const OPAL_AGENTS = {
    'content_review': {
      name: 'Content Review Agent',
      description: 'Analyzes experiment content and variations',
      estimated_runtime_ms: 45000,
      timeout_threshold_ms: 120000
    },
    'geo_audit': {
      name: 'Geographic Audit Agent',
      description: 'Evaluates geographic performance distribution',
      estimated_runtime_ms: 60000,
      timeout_threshold_ms: 180000
    },
    'audience_suggester': {
      name: 'Audience Suggester Agent',
      description: 'Analyzes audience segment performance',
      estimated_runtime_ms: 50000,
      timeout_threshold_ms: 150000
    },
    'experiment_blueprinter': {
      name: 'Experiment Blueprinter Agent',
      description: 'Creates detailed experiment plans',
      estimated_runtime_ms: 70000,
      timeout_threshold_ms: 200000
    },
    'personalization_idea_generator': {
      name: 'Personalization Idea Generator',
      description: 'Generates personalization strategies',
      estimated_runtime_ms: 55000,
      timeout_threshold_ms: 180000
    },
    'roadmap_generator': {
      name: 'Roadmap Generator Agent',
      description: 'Generates implementation roadmaps and project timelines',
      estimated_runtime_ms: 65000,
      timeout_threshold_ms: 180000
    },
    'integration_health': {
      name: 'Integration Health Agent',
      description: 'Monitors DXP integration status and health metrics',
      estimated_runtime_ms: 40000,
      timeout_threshold_ms: 120000
    },
    'cmp_organizer': {
      name: 'CMP Organizer Agent',
      description: 'Organizes campaign management platform workflows',
      estimated_runtime_ms: 50000,
      timeout_threshold_ms: 150000
    },
    'customer_journey': {
      name: 'Customer Journey Agent',
      description: 'Maps customer journey touchpoints and optimization opportunities',
      estimated_runtime_ms: 70000,
      timeout_threshold_ms: 200000
    }
  };

  // Get all agent IDs in order
  const agentIds = Object.keys(OPAL_AGENTS);

  // Calculate summary statistics
  const summaryStats = {
    total: agentIds.length,
    idle: 0,
    active: 0,
    completed: 0,
    failed: 0
  };

  agentIds.forEach(agentId => {
    const status = agentStatuses.get(agentId)?.status || 'idle';
    if (status === 'idle') summaryStats.idle++;
    else if (status === 'starting' || status === 'running' || status === 'retrying') summaryStats.active++;
    else if (status === 'completed') summaryStats.completed++;
    else if (status === 'failed' || status === 'timeout') summaryStats.failed++;
  });

  return (
    <div className={className}>
      {/* Dashboard Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">OPAL Agent Monitoring</h2>
            <p className="text-gray-600">Real-time monitoring of all 9 Optimizely Opal agents</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                isAutoRefresh
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              <Activity className={`h-4 w-4 ${isAutoRefresh ? 'animate-pulse' : ''}`} />
              <span className="text-sm font-medium">
                {isAutoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
              </span>
            </button>

            {/* SSE Streaming Status */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
              isStreamConnected
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-gray-50 text-gray-500 border-gray-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isStreamConnected ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <span className="font-medium">
                {isStreamConnected ? 'Live Stream' : 'Not Connected'}
              </span>
            </div>

            <div className="text-xs text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">Total Agents</span>
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{summaryStats.total}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Idle</span>
              <Pause className="h-5 w-5 text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{summaryStats.idle}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">Active</span>
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{summaryStats.active}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Completed</span>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-900 mt-1">{summaryStats.completed}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-red-700">Failed</span>
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-900 mt-1">{summaryStats.failed}</div>
          </div>
        </div>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agentIds.map(agentId => {
          const agentInfo = agentStatuses.get(agentId) || {
            agent_id: agentId,
            agent_name: OPAL_AGENTS[agentId as keyof typeof OPAL_AGENTS].name,
            status: 'idle' as AgentStatus,
            last_updated: new Date().toISOString(),
            retry_count: 0
          };

          const agentConfig = OPAL_AGENTS[agentId as keyof typeof OPAL_AGENTS];

          return (
            <AgentCard
              key={agentId}
              agentInfo={agentInfo}
              agentConfig={agentConfig}
            />
          );
        })}
      </div>
    </div>
  );
}
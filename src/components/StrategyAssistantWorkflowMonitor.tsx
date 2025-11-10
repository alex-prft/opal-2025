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
  Play,
  Pause,
  TrendingRight,
  Shield,
  FileText,
  MapPin,
  Users,
  BarChart3,
  User,
  Route,
  Workflow,
  ArrowDown,
  Timer
} from 'lucide-react';

/**
 * Sequential Workflow Monitor for Strategy Assistant
 *
 * Monitors the exact execution order of strategy_assistant_workflow.json:
 * 1. integration_health
 * 2. content_review (Content_Review)
 * 3. geo_audit
 * 4. audience_suggester
 * 5. experiment_blueprinter
 * 6. personalization_idea_generator
 * 7. customer_journey
 * 8. roadmap_generator
 * 9. cmp_organizer
 */

interface SequentialAgentData {
  agent_id: string;
  display_name: string;
  step_number: number;
  description: string;
  estimated_duration: number; // in seconds
  icon: any;
}

// Exact sequence from strategy_assistant_workflow.json
const STRATEGY_WORKFLOW_SEQUENCE: SequentialAgentData[] = [
  {
    agent_id: 'integration_health',
    display_name: 'Integration Health Agent',
    step_number: 1,
    description: 'Monitors and analyzes the health, performance, and integration status of Optimizely DXP tools',
    estimated_duration: 40,
    icon: Shield
  },
  {
    agent_id: 'Content_Review', // Note: This matches the agent_id in your workflow
    display_name: 'Content Review Agent',
    step_number: 2,
    description: 'Analyzes website content to identify optimization opportunities and content gaps',
    estimated_duration: 45,
    icon: FileText
  },
  {
    agent_id: 'geo_audit',
    display_name: 'GEO Audit Agent',
    step_number: 3,
    description: 'Performs comprehensive GEO (Generative Engine Optimization) audit to optimize content for AI search engines',
    estimated_duration: 60,
    icon: MapPin
  },
  {
    agent_id: 'audience_suggester',
    display_name: 'Audience Suggester Agent',
    step_number: 4,
    description: 'Generates high-value audience segments for personalization based on ODP traits and Salesforce data',
    estimated_duration: 50,
    icon: Users
  },
  {
    agent_id: 'experiment_blueprinter',
    display_name: 'Experiment Blueprinter Agent',
    step_number: 5,
    description: 'Converts personalization ideas into rigorous experiment specifications with statistical power analysis',
    estimated_duration: 70,
    icon: BarChart3
  },
  {
    agent_id: 'personalization_idea_generator',
    display_name: 'Personalization Idea Generator Agent',
    step_number: 6,
    description: 'Generates strategic personalization ideas mapped to specific audience segments',
    estimated_duration: 55,
    icon: User
  },
  {
    agent_id: 'customer_journey',
    display_name: 'Customer Journey Agent',
    step_number: 7,
    description: 'Analyzes customer journey patterns, identifies drop-off points, maps touchpoint experiences',
    estimated_duration: 70,
    icon: TrendingRight
  },
  {
    agent_id: 'roadmap_generator',
    display_name: 'Roadmap Generator Agent',
    step_number: 8,
    description: 'Converts strategic insights into comprehensive implementation roadmaps with timeline visualization',
    estimated_duration: 65,
    icon: Route
  },
  {
    agent_id: 'cmp_organizer',
    display_name: 'CMP Organizer Agent',
    step_number: 9,
    description: 'Compiles and organizes results from all workflow agents into executive-ready strategy briefs',
    estimated_duration: 50,
    icon: Workflow
  }
];

interface AgentStepCardProps {
  agent: SequentialAgentData;
  status: AgentStatusInfo | null;
  isActive: boolean;
  isNext: boolean;
  workflowStartTime?: string;
}

function AgentStepCard({ agent, status, isActive, isNext, workflowStartTime }: AgentStepCardProps) {
  const AgentIcon = agent.icon;

  const getStatusDisplay = (agentStatus: AgentStatus | undefined) => {
    switch (agentStatus) {
      case 'idle':
        return {
          icon: Pause,
          color: 'text-gray-500',
          bg: 'bg-gray-50 border-gray-200',
          pulse: false,
          label: 'Waiting'
        };
      case 'starting':
        return {
          icon: Play,
          color: 'text-blue-500',
          bg: 'bg-blue-50 border-blue-200',
          pulse: true,
          label: 'Starting'
        };
      case 'running':
        return {
          icon: Activity,
          color: 'text-blue-600',
          bg: 'bg-blue-50 border-blue-300',
          pulse: true,
          label: 'Running'
        };
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bg: 'bg-green-50 border-green-200',
          pulse: false,
          label: 'Completed'
        };
      case 'failed':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-50 border-red-200',
          pulse: false,
          label: 'Failed'
        };
      case 'timeout':
        return {
          icon: Clock,
          color: 'text-red-500',
          bg: 'bg-red-50 border-red-200',
          pulse: false,
          label: 'Timeout'
        };
      default:
        return {
          icon: Pause,
          color: 'text-gray-400',
          bg: 'bg-gray-50 border-gray-200',
          pulse: false,
          label: 'Pending'
        };
    }
  };

  const statusDisplay = getStatusDisplay(status?.status);
  const StatusIcon = statusDisplay.icon;

  const formatDuration = (ms?: number) => {
    if (!ms) return null;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getElapsedTime = () => {
    if (!status?.execution_start) return null;
    const start = new Date(status.execution_start).getTime();
    const now = Date.now();
    const elapsed = now - start;
    return formatDuration(elapsed);
  };

  return (
    <div className={`relative transition-all duration-300 ${statusDisplay.bg} rounded-lg p-4 border-2 ${
      isActive ? 'shadow-lg transform scale-105' : ''
    } ${isNext ? 'border-blue-300 bg-blue-25' : ''}`}>

      {/* Step Number Badge */}
      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center shadow-sm">
        <span className="text-sm font-bold text-gray-700">{agent.step_number}</span>
      </div>

      {/* Agent Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <AgentIcon className="h-5 w-5 text-gray-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{agent.display_name}</h3>
            <p className="text-xs text-gray-600 mt-1 leading-tight">{agent.description}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-white shadow-sm border`}>
          <StatusIcon className={`h-3 w-3 ${statusDisplay.color} ${statusDisplay.pulse ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-medium ${statusDisplay.color}`}>
            {statusDisplay.label}
          </span>
        </div>
      </div>

      {/* Status Details */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-600">Expected:</span>
          <span className="ml-1 font-medium">{agent.estimated_duration}s</span>
        </div>
        <div>
          <span className="text-gray-600">Elapsed:</span>
          <span className="ml-1 font-medium">{getElapsedTime() || 'N/A'}</span>
        </div>
        <div>
          <span className="text-gray-600">Progress:</span>
          <span className="ml-1 font-medium">{status?.progress_percentage || 0}%</span>
        </div>
        <div>
          <span className="text-gray-600">Retries:</span>
          <span className="ml-1 font-medium">{status?.retry_count || 0}</span>
        </div>
      </div>

      {/* Progress Bar for Running Agents */}
      {status?.status === 'running' && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500 animate-pulse"
              style={{ width: `${status.progress_percentage || 20}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {(status?.status === 'failed' || status?.status === 'timeout') && status?.error_message && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
          <span className="text-red-700 font-medium">Error: </span>
          <span className="text-red-600">{status.error_message}</span>
        </div>
      )}
    </div>
  );
}

interface StrategyAssistantWorkflowMonitorProps {
  className?: string;
  workflowId?: string;
}

export default function StrategyAssistantWorkflowMonitor({
  className,
  workflowId = 'strategy_assistant'
}: StrategyAssistantWorkflowMonitorProps) {
  const [agentStatuses, setAgentStatuses] = useState<Map<string, AgentStatusInfo>>(new Map());
  const [workflowProgress, setWorkflowProgress] = useState<WorkflowProgress | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  // Real-time status updates
  useEffect(() => {
    const loadData = () => {
      // Get latest statuses for all agents
      const statuses = agentStatusTracker.getLatestAgentStatuses();
      setAgentStatuses(statuses);

      // Get workflow progress if available
      const progress = agentStatusTracker.getWorkflowProgress(workflowId);
      setWorkflowProgress(progress);

      setLastUpdate(new Date());

      // Determine current step based on agent statuses
      let current = 0;
      STRATEGY_WORKFLOW_SEQUENCE.forEach((agent, index) => {
        const status = statuses.get(agent.agent_id);
        if (status?.status === 'completed') {
          current = Math.max(current, index + 1);
        } else if (status?.status === 'running' || status?.status === 'starting') {
          current = Math.max(current, index);
        }
      });
      setCurrentStep(current);
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
      if (progress.workflow_id === workflowId) {
        setWorkflowProgress(progress);
      }
    });

    // Auto-refresh interval
    const interval = setInterval(() => {
      if (isAutoRefresh) {
        loadData();
      }
    }, 2000); // Refresh every 2 seconds

    return () => {
      unsubscribeAgent();
      unsubscribeWorkflow();
      clearInterval(interval);
    };
  }, [isAutoRefresh, workflowId]);

  // Calculate workflow statistics
  const workflowStats = {
    total: STRATEGY_WORKFLOW_SEQUENCE.length,
    completed: 0,
    running: 0,
    failed: 0,
    pending: 0
  };

  STRATEGY_WORKFLOW_SEQUENCE.forEach(agent => {
    const status = agentStatuses.get(agent.agent_id)?.status || 'idle';
    switch (status) {
      case 'completed':
        workflowStats.completed++;
        break;
      case 'running':
      case 'starting':
        workflowStats.running++;
        break;
      case 'failed':
      case 'timeout':
        workflowStats.failed++;
        break;
      default:
        workflowStats.pending++;
    }
  });

  const completionPercentage = Math.round((workflowStats.completed / workflowStats.total) * 100);
  const estimatedTotalTime = STRATEGY_WORKFLOW_SEQUENCE.reduce((sum, agent) => sum + agent.estimated_duration, 0);

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Strategy Assistant Workflow</h2>
            <p className="text-gray-600">Sequential execution monitoring of all 9 OPAL agents</p>
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
                Real-time {isAutoRefresh ? 'On' : 'Off'}
              </span>
            </button>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="text-lg font-bold text-blue-900">{workflowStats.total}</div>
            <div className="text-sm text-blue-700">Total Steps</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="text-lg font-bold text-green-900">{workflowStats.completed}</div>
            <div className="text-sm text-green-700">Completed</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="text-lg font-bold text-blue-900">{workflowStats.running}</div>
            <div className="text-sm text-blue-700">Running</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <div className="text-lg font-bold text-red-900">{workflowStats.failed}</div>
            <div className="text-sm text-red-700">Failed</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="text-lg font-bold text-gray-900">{workflowStats.pending}</div>
            <div className="text-sm text-gray-700">Pending</div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-gray-700">Workflow Progress</span>
            <span className="font-medium text-gray-700">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Est. Total: {Math.round(estimatedTotalTime / 60)}min</span>
            <span>Updated: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Sequential Agent List */}
      <div className="p-6 space-y-4">
        {STRATEGY_WORKFLOW_SEQUENCE.map((agent, index) => {
          const agentStatus = agentStatuses.get(agent.agent_id);
          const isActive = currentStep === index && (agentStatus?.status === 'running' || agentStatus?.status === 'starting');
          const isNext = currentStep === index && !agentStatus;

          return (
            <div key={agent.agent_id} className="relative">
              <AgentStepCard
                agent={agent}
                status={agentStatus || null}
                isActive={isActive}
                isNext={isNext}
                workflowStartTime={workflowProgress?.started_at}
              />

              {/* Arrow connector (except for last item) */}
              {index < STRATEGY_WORKFLOW_SEQUENCE.length - 1 && (
                <div className="flex justify-center my-2">
                  <ArrowDown className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      {workflowProgress && (
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Workflow Status: <span className="capitalize text-blue-600">{workflowProgress.status}</span>
              </p>
              <p className="text-xs text-gray-600">
                Started: {new Date(workflowProgress.started_at).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {workflowStats.completed} / {workflowStats.total} agents completed
              </p>
              {workflowProgress.estimated_completion && (
                <p className="text-xs text-gray-600">
                  ETA: {new Date(workflowProgress.estimated_completion).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
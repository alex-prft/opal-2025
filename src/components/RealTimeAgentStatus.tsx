'use client';

import { useState, useEffect } from 'react';
import { agentStatusTracker, AgentStatus, AgentStatusInfo } from '@/lib/monitoring/agent-status-tracker';

interface RealTimeAgentStatusProps {
  className?: string;
}

// Enhanced Agent Status Bubble Component with Real-time Updates
interface AgentStatusBubbleProps {
  agentId: string;
  agentName: string;
  status: AgentStatus;
  executionTime?: number;
  progress?: number;
}

function AgentStatusBubble({ agentId, agentName, status, executionTime, progress }: AgentStatusBubbleProps) {
  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'idle':
        return 'bg-gray-400';
      case 'starting':
        return 'bg-blue-400 animate-pulse';
      case 'running':
        return 'bg-blue-500 animate-ping';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'timeout':
        return 'bg-orange-500';
      case 'retrying':
        return 'bg-yellow-500 animate-bounce';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'failed':
        return '✕';
      case 'timeout':
        return '⏱';
      case 'retrying':
        return '↻';
      case 'running':
        return '●';
      default:
        return '';
    }
  };

  const getStatusDescription = (status: AgentStatus, executionTime?: number, progress?: number) => {
    const formatTime = (ms?: number) => ms ? `${(ms / 1000).toFixed(1)}s` : '';
    const formatProgress = (p?: number) => p ? `${p}%` : '';

    switch (status) {
      case 'idle':
        return 'Agent is idle, waiting for workflow';
      case 'starting':
        return 'Agent is initializing...';
      case 'running':
        return `Agent is processing${progress ? ` (${formatProgress(progress)})` : ''}`;
      case 'completed':
        return `Agent completed successfully${executionTime ? ` in ${formatTime(executionTime)}` : ''}`;
      case 'failed':
        return 'Agent encountered an error';
      case 'timeout':
        return 'Agent exceeded timeout threshold';
      case 'retrying':
        return 'Agent is retrying after failure';
      default:
        return 'Unknown agent status';
    }
  };

  return (
    <div
      className={`relative w-3 h-3 rounded-full ${getStatusColor(status)} cursor-pointer hover:scale-125 transition-all duration-200 shadow-sm`}
      title={`${agentName}: ${getStatusDescription(status, executionTime, progress)}`}
    >
      {getStatusIcon(status) && (
        <span className="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-white">
          {getStatusIcon(status)}
        </span>
      )}
      {progress && status === 'running' && (
        <div
          className="absolute inset-0 rounded-full border-2 border-white"
          style={{
            background: `conic-gradient(from 0deg, rgba(255,255,255,0.3) ${progress * 3.6}deg, transparent ${progress * 3.6}deg)`
          }}
        />
      )}
    </div>
  );
}

export default function RealTimeAgentStatus({ className }: RealTimeAgentStatusProps) {
  const [agentStatuses, setAgentStatuses] = useState<Map<string, AgentStatusInfo>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Real-time status updates
  useEffect(() => {
    // Initial load
    const loadInitialStatuses = () => {
      const statuses = agentStatusTracker.getLatestAgentStatuses();
      setAgentStatuses(statuses);
      setLastUpdate(new Date());
    };

    loadInitialStatuses();

    // Subscribe to real-time updates
    const unsubscribe = agentStatusTracker.subscribe((updatedStatus: AgentStatusInfo) => {
      setAgentStatuses(prevStatuses => {
        const newStatuses = new Map(prevStatuses);
        newStatuses.set(updatedStatus.agent_id, updatedStatus);
        return newStatuses;
      });
      setLastUpdate(new Date());
    });

    // Periodic refresh to ensure we have latest data
    const interval = setInterval(() => {
      const statuses = agentStatusTracker.getLatestAgentStatuses();
      setAgentStatuses(statuses);
    }, 5000); // Refresh every 5 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Get OPAL agents in correct order
  const opalAgents = [
    'content_review',
    'geo_audit',
    'audience_suggester',
    'experiment_blueprinter',
    'personalization_idea_generator'
  ];

  return (
    <div className={className}>
      <div className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
        <span>OPAL Agents:</span>
        <span className="text-[10px] text-gray-400">
          {lastUpdate.toLocaleTimeString()}
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {opalAgents.map(agentId => {
          const agentInfo = agentStatuses.get(agentId);
          const agentConfig = agentStatusTracker.OPAL_AGENTS[agentId as keyof typeof agentStatusTracker.OPAL_AGENTS];

          return (
            <AgentStatusBubble
              key={agentId}
              agentId={agentId}
              agentName={agentConfig?.name || agentId}
              status={agentInfo?.status || 'idle'}
              executionTime={agentInfo?.execution_time_ms}
              progress={agentInfo?.progress_percentage}
            />
          );
        })}
      </div>

      {/* Real-time status summary */}
      <div className="mt-2 text-xs text-gray-500">
        {(() => {
          const statusCounts = {
            idle: 0,
            starting: 0,
            running: 0,
            completed: 0,
            failed: 0,
            timeout: 0,
            retrying: 0
          };

          opalAgents.forEach(agentId => {
            const status = agentStatuses.get(agentId)?.status || 'idle';
            statusCounts[status]++;
          });

          const activeAgents = statusCounts.starting + statusCounts.running + statusCounts.retrying;
          const completedAgents = statusCounts.completed;
          const failedAgents = statusCounts.failed + statusCounts.timeout;

          if (activeAgents > 0) {
            return `${activeAgents} active, ${completedAgents} completed, ${failedAgents} failed`;
          } else if (completedAgents > 0) {
            return `${completedAgents} completed, ${failedAgents} failed`;
          } else {
            return 'All agents idle';
          }
        })()}
      </div>
    </div>
  );
}
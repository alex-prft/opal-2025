/**
 * Agent Status Tracker for Ingestion & Orchestration Service
 * Real-time monitoring and status management for OPAL agents
 */

import { supabase } from '@/lib/supabase';
import { monitoringErrorHandler } from './error-handler';

export type AgentStatus =
  | 'idle'           // Agent not running, waiting for workflow
  | 'starting'       // Agent workflow triggered, initializing
  | 'running'        // Agent actively processing
  | 'completed'      // Agent finished successfully
  | 'failed'         // Agent encountered an error
  | 'timeout'        // Agent exceeded expected runtime
  | 'retrying';      // Agent failed, attempting retry

export interface AgentStatusInfo {
  agent_id: string;
  agent_name: string;
  status: AgentStatus;
  workflow_id?: string;
  last_updated: string;
  execution_start?: string;
  execution_end?: string;
  execution_time_ms?: number;
  error_message?: string;
  retry_count?: number;
  progress_percentage?: number;
}

export interface WorkflowProgress {
  workflow_id: string;
  workflow_name: string;
  status: 'triggered' | 'running' | 'completed' | 'failed';
  agents_total: number;
  agents_completed: number;
  agents_failed: number;
  started_at: string;
  estimated_completion?: string;
  agents: AgentStatusInfo[];
}

class AgentStatusTracker {
  private static instance: AgentStatusTracker;
  private agentStatuses: Map<string, AgentStatusInfo> = new Map();
  private workflowProgress: Map<string, WorkflowProgress> = new Map();
  private listeners: Array<(status: AgentStatusInfo) => void> = [];
  private workflowListeners: Array<(progress: WorkflowProgress) => void> = [];

  // Standard OPAL agents with human-readable names - All 9 Agents for Opal Connector
  public static readonly OPAL_AGENTS = {
    'content_review': {
      name: 'Content Review Agent',
      description: 'Analyzes experiment content and variations',
      estimated_runtime_ms: 45000, // 45 seconds
      timeout_threshold_ms: 120000 // 2 minutes
    },
    'geo_audit': {
      name: 'GEO Audit Agent',
      description: 'Generative Engine Optimization audit to optimize content for AI search engines',
      estimated_runtime_ms: 60000, // 1 minute
      timeout_threshold_ms: 180000 // 3 minutes
    },
    'audience_suggester': {
      name: 'Audience Suggester Agent',
      description: 'Analyzes audience segment performance',
      estimated_runtime_ms: 50000, // 50 seconds
      timeout_threshold_ms: 150000 // 2.5 minutes
    },
    'experiment_blueprinter': {
      name: 'Experiment Blueprinter Agent',
      description: 'Creates detailed experiment plans',
      estimated_runtime_ms: 70000, // 70 seconds
      timeout_threshold_ms: 200000 // 3.33 minutes
    },
    'personalization_idea_generator': {
      name: 'Personalization Idea Generator',
      description: 'Generates personalization strategies',
      estimated_runtime_ms: 55000, // 55 seconds
      timeout_threshold_ms: 180000 // 3 minutes
    },
    // ✅ NEW AGENTS ADDED FOR OPAL CONNECTOR - AGENTS SERVICE
    'roadmap_generator': {
      name: 'Roadmap Generator Agent',
      description: 'Generates implementation roadmaps and project timelines',
      estimated_runtime_ms: 65000, // 65 seconds
      timeout_threshold_ms: 180000 // 3 minutes
    },
    'integration_health': {
      name: 'Integration Health Agent',
      description: 'Monitors DXP integration status and health metrics',
      estimated_runtime_ms: 40000, // 40 seconds
      timeout_threshold_ms: 120000 // 2 minutes
    },
    'cmp_organizer': {
      name: 'CMP Organizer Agent',
      description: 'Organizes campaign management platform workflows',
      estimated_runtime_ms: 50000, // 50 seconds
      timeout_threshold_ms: 150000 // 2.5 minutes
    },
    'customer_journey': {
      name: 'Customer Journey Agent',
      description: 'Maps customer journey touchpoints and optimization opportunities',
      estimated_runtime_ms: 70000, // 70 seconds
      timeout_threshold_ms: 200000 // 3.33 minutes
    }
  };

  static getInstance(): AgentStatusTracker {
    if (!AgentStatusTracker.instance) {
      AgentStatusTracker.instance = new AgentStatusTracker();
    }
    return AgentStatusTracker.instance;
  }

  /**
   * Initialize agent status tracking for a new workflow
   */
  async initializeWorkflow(workflowId: string, workflowName: string): Promise<void> {
    console.log(`🚀 [AgentStatusTracker] Initializing workflow: ${workflowId}`);

    const agents: AgentStatusInfo[] = Object.entries(AgentStatusTracker.OPAL_AGENTS).map(([agentId, config]) => ({
      agent_id: agentId,
      agent_name: config.name,
      status: 'starting' as AgentStatus,
      workflow_id: workflowId,
      last_updated: new Date().toISOString(),
      retry_count: 0,
      progress_percentage: 0
    }));

    const progress: WorkflowProgress = {
      workflow_id: workflowId,
      workflow_name: workflowName,
      status: 'triggered',
      agents_total: agents.length,
      agents_completed: 0,
      agents_failed: 0,
      started_at: new Date().toISOString(),
      estimated_completion: new Date(Date.now() + 300000).toISOString(), // 5 minutes
      agents: agents
    };

    // Store in memory
    this.workflowProgress.set(workflowId, progress);
    agents.forEach(agent => {
      this.agentStatuses.set(`${workflowId}:${agent.agent_id}`, agent);
    });

    // Store in database for persistence
    await this.persistWorkflowProgress(progress);

    // Notify listeners
    this.notifyWorkflowListeners(progress);

    // Set timeout monitors for each agent
    this.setupAgentTimeouts(workflowId);
  }

  /**
   * Update agent status when webhook events are received
   */
  async updateAgentStatus(
    workflowId: string,
    agentId: string,
    status: AgentStatus,
    metadata?: {
      execution_time_ms?: number;
      error_message?: string;
      progress_percentage?: number;
      agent_output?: any;
    }
  ): Promise<void> {
    const key = `${workflowId}:${agentId}`;
    const currentStatus = this.agentStatuses.get(key);

    if (!currentStatus) {
      console.warn(`[AgentStatusTracker] No existing status found for ${key}, creating new status`);
      // Create new status if not found
      const agentConfig = AgentStatusTracker.OPAL_AGENTS[agentId as keyof typeof AgentStatusTracker.OPAL_AGENTS];
      const newStatus: AgentStatusInfo = {
        agent_id: agentId,
        agent_name: agentConfig?.name || agentId,
        status: status,
        workflow_id: workflowId,
        last_updated: new Date().toISOString(),
        retry_count: 0,
        ...metadata
      };
      this.agentStatuses.set(key, newStatus);
    } else {
      // Update existing status
      const updatedStatus: AgentStatusInfo = {
        ...currentStatus,
        status: status,
        last_updated: new Date().toISOString(),
        ...metadata
      };

      // Set execution timestamps based on status
      if (status === 'running' && !updatedStatus.execution_start) {
        updatedStatus.execution_start = new Date().toISOString();
      }
      if ((status === 'completed' || status === 'failed') && updatedStatus.execution_start) {
        updatedStatus.execution_end = new Date().toISOString();
        if (!updatedStatus.execution_time_ms && updatedStatus.execution_start) {
          updatedStatus.execution_time_ms = Date.now() - new Date(updatedStatus.execution_start).getTime();
        }
      }

      this.agentStatuses.set(key, updatedStatus);
    }

    const agentStatus = this.agentStatuses.get(key)!;

    // Update workflow progress
    await this.updateWorkflowProgress(workflowId);

    // Persist to database
    await this.persistAgentStatus(agentStatus);

    // Notify listeners
    this.notifyListeners(agentStatus);

    console.log(`📊 [AgentStatusTracker] Updated ${agentId}: ${status}`, {
      workflow_id: workflowId,
      execution_time: metadata?.execution_time_ms,
      progress: metadata?.progress_percentage
    });
  }

  /**
   * Get current status for a specific agent
   */
  getAgentStatus(workflowId: string, agentId: string): AgentStatusInfo | null {
    return this.agentStatuses.get(`${workflowId}:${agentId}`) || null;
  }

  /**
   * Get all agent statuses for a workflow
   */
  getWorkflowProgress(workflowId: string): WorkflowProgress | null {
    return this.workflowProgress.get(workflowId) || null;
  }

  /**
   * Get latest agent statuses across all workflows (for dashboard display)
   */
  getLatestAgentStatuses(): Map<string, AgentStatusInfo> {
    const latest = new Map<string, AgentStatusInfo>();

    // Find the most recent status for each agent type
    Object.keys(AgentStatusTracker.OPAL_AGENTS).forEach(agentId => {
      let latestStatus: AgentStatusInfo | null = null;
      let latestTimestamp = 0;

      this.agentStatuses.forEach((status, key) => {
        if (status.agent_id === agentId) {
          const timestamp = new Date(status.last_updated).getTime();
          if (timestamp > latestTimestamp) {
            latestTimestamp = timestamp;
            latestStatus = status;
          }
        }
      });

      if (latestStatus) {
        latest.set(agentId, latestStatus);
      } else {
        // Create default idle status if no recent activity
        const agentConfig = AgentStatusTracker.OPAL_AGENTS[agentId as keyof typeof AgentStatusTracker.OPAL_AGENTS];
        latest.set(agentId, {
          agent_id: agentId,
          agent_name: agentConfig.name,
          status: 'idle',
          last_updated: new Date().toISOString(),
          retry_count: 0
        });
      }
    });

    return latest;
  }

  /**
   * Subscribe to agent status updates
   */
  subscribe(callback: (status: AgentStatusInfo) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Subscribe to workflow progress updates
   */
  subscribeToWorkflow(callback: (progress: WorkflowProgress) => void): () => void {
    this.workflowListeners.push(callback);
    return () => {
      this.workflowListeners = this.workflowListeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Setup timeout monitoring for agents
   */
  private setupAgentTimeouts(workflowId: string): void {
    Object.entries(AgentStatusTracker.OPAL_AGENTS).forEach(([agentId, config]) => {
      setTimeout(() => {
        const status = this.getAgentStatus(workflowId, agentId);
        if (status && (status.status === 'starting' || status.status === 'running')) {
          console.warn(`⏰ [AgentStatusTracker] Agent timeout: ${agentId} in workflow ${workflowId}`);
          this.updateAgentStatus(workflowId, agentId, 'timeout', {
            error_message: `Agent exceeded timeout threshold of ${config.timeout_threshold_ms}ms`
          });
        }
      }, config.timeout_threshold_ms);
    });
  }

  /**
   * Update workflow progress statistics
   */
  private async updateWorkflowProgress(workflowId: string): Promise<void> {
    const progress = this.workflowProgress.get(workflowId);
    if (!progress) return;

    const agents = Array.from(this.agentStatuses.values()).filter(agent => agent.workflow_id === workflowId);
    const completed = agents.filter(agent => agent.status === 'completed').length;
    const failed = agents.filter(agent => agent.status === 'failed' || agent.status === 'timeout').length;

    let workflowStatus: 'triggered' | 'running' | 'completed' | 'failed' = progress.status;

    if (completed + failed === agents.length) {
      workflowStatus = failed > 0 ? 'failed' : 'completed';
    } else if (completed > 0 || failed > 0) {
      workflowStatus = 'running';
    }

    const updatedProgress: WorkflowProgress = {
      ...progress,
      status: workflowStatus,
      agents_completed: completed,
      agents_failed: failed,
      agents: agents
    };

    this.workflowProgress.set(workflowId, updatedProgress);
    await this.persistWorkflowProgress(updatedProgress);
    this.notifyWorkflowListeners(updatedProgress);
  }

  /**
   * Persist agent status to database with error handling and retry logic
   */
  private async persistAgentStatus(status: AgentStatusInfo): Promise<void> {
    await monitoringErrorHandler.executeDatabaseOperation(
      async () => {
        const { error } = await supabase
          .from('opal_agent_status_tracking')
          .upsert({
            workflow_id: status.workflow_id,
            agent_id: status.agent_id,
            agent_name: status.agent_name,
            status: status.status,
            execution_start: status.execution_start,
            execution_end: status.execution_end,
            execution_time_ms: status.execution_time_ms,
            error_message: status.error_message,
            retry_count: status.retry_count,
            progress_percentage: status.progress_percentage,
            last_updated: status.last_updated
          }, {
            onConflict: 'workflow_id,agent_id'
          });

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }
      },
      `persistAgentStatus:${status.workflow_id}:${status.agent_id}`
    ).catch(error => {
      monitoringErrorHandler.handleError(
        error as Error,
        'persistAgentStatus',
        { workflow_id: status.workflow_id, agent_id: status.agent_id }
      );
      // Continue with in-memory tracking on database errors
    });
  }

  /**
   * Persist workflow progress to database with error handling and retry logic
   */
  private async persistWorkflowProgress(progress: WorkflowProgress): Promise<void> {
    await monitoringErrorHandler.executeDatabaseOperation(
      async () => {
        const { error } = await supabase
          .from('opal_workflow_progress')
          .upsert({
            workflow_id: progress.workflow_id,
            workflow_name: progress.workflow_name,
            status: progress.status,
            agents_total: progress.agents_total,
            agents_completed: progress.agents_completed,
            agents_failed: progress.agents_failed,
            started_at: progress.started_at,
            estimated_completion: progress.estimated_completion,
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'workflow_id'
          });

        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }
      },
      `persistWorkflowProgress:${progress.workflow_id}`
    ).catch(error => {
      monitoringErrorHandler.handleError(
        error as Error,
        'persistWorkflowProgress',
        { workflow_id: progress.workflow_id }
      );
      // Continue with in-memory tracking on database errors
    });
  }

  /**
   * Notify status change listeners
   */
  private notifyListeners(status: AgentStatusInfo): void {
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status listener callback:', error);
      }
    });
  }

  /**
   * Notify workflow progress listeners
   */
  private notifyWorkflowListeners(progress: WorkflowProgress): void {
    this.workflowListeners.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Error in workflow progress listener callback:', error);
      }
    });
  }
}

export const agentStatusTracker = AgentStatusTracker.getInstance();
/**
 * Webhook Agent Integration for Ingestion & Orchestration Service
 * Connects OPAL webhook events to real-time agent status tracking
 */

import { agentStatusTracker, AgentStatus } from '@/lib/monitoring/agent-status-tracker';
import { webhookEventOperations } from '@/lib/database/webhook-events';
import { monitoringErrorHandler } from '@/lib/monitoring/error-handler';

export interface OpalWebhookEvent {
  event_type: 'workflow.completed' | 'workflow.failed' | 'workflow.triggered' | 'agent.completed' | 'agent.started';
  workflow_id: string;
  workflow_name: string;
  timestamp: string;
  agent_id?: string;
  agent_name?: string;
  agent_output?: any;
  agent_success?: boolean;
  agent_error?: string;
  execution_time_ms?: number;
  trigger_source?: 'schedule' | 'api' | 'event' | 'manual';
  metadata?: {
    client_id?: string;
    project_id?: string;
    environment?: string;
    user_id?: string;
    session_id?: string;
  };
}

class WebhookAgentIntegration {
  private static instance: WebhookAgentIntegration;

  static getInstance(): WebhookAgentIntegration {
    if (!WebhookAgentIntegration.instance) {
      WebhookAgentIntegration.instance = new WebhookAgentIntegration();
    }
    return WebhookAgentIntegration.instance;
  }

  /**
   * Process incoming OPAL webhook event and update agent status with comprehensive error handling
   */
  async processWebhookEvent(event: OpalWebhookEvent): Promise<void> {
    console.log(`🔄 [WebhookAgentIntegration] Processing ${event.event_type} for workflow ${event.workflow_id}`);

    await monitoringErrorHandler.executeWebhookOperation(
      async () => {
        switch (event.event_type) {
          case 'workflow.triggered':
            await this.handleWorkflowTriggered(event);
            break;

          case 'agent.started':
            await this.handleAgentStarted(event);
            break;

          case 'agent.completed':
            await this.handleAgentCompleted(event);
            break;

          case 'workflow.completed':
            await this.handleWorkflowCompleted(event);
            break;

          case 'workflow.failed':
            await this.handleWorkflowFailed(event);
            break;

          default:
            console.warn(`[WebhookAgentIntegration] Unhandled event type: ${event.event_type}`);
        }

        // Log successful event processing
        await webhookEventOperations.storeWebhookEvent({
          event_type: `${event.event_type}.agent_status_processed`,
          workflow_id: event.workflow_id,
          workflow_name: event.workflow_name,
          agent_id: event.agent_id,
          agent_name: event.agent_name,
          received_at: event.timestamp,
          payload: {
            event_processed: true,
            processing_timestamp: new Date().toISOString()
          },
          success: true
        });
      },
      `processWebhookEvent:${event.event_type}:${event.workflow_id}`
    ).catch(async (error) => {
      monitoringErrorHandler.handleError(
        error as Error,
        'processWebhookEvent',
        {
          event_type: event.event_type,
          workflow_id: event.workflow_id,
          agent_id: event.agent_id
        }
      );

      // Log processing error with retry-aware logging
      try {
        await webhookEventOperations.storeWebhookEvent({
          event_type: `${event.event_type}.agent_status_error`,
          workflow_id: event.workflow_id,
          workflow_name: event.workflow_name,
          agent_id: event.agent_id,
          agent_name: event.agent_name,
          received_at: event.timestamp,
          payload: {
            error: error instanceof Error ? error.message : 'Unknown error',
            processing_timestamp: new Date().toISOString(),
            error_classification: 'webhook_processing_error'
          },
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      } catch (logError) {
        console.error('Failed to log webhook processing error:', logError);
      }

      throw error; // Re-throw for upstream error handling
    });
  }

  /**
   * Handle workflow triggered event
   */
  private async handleWorkflowTriggered(event: OpalWebhookEvent): Promise<void> {
    console.log(`🚀 [WebhookAgentIntegration] Workflow triggered: ${event.workflow_name} (${event.workflow_id})`);

    // Initialize agent status tracking for this workflow
    await agentStatusTracker.initializeWorkflow(event.workflow_id, event.workflow_name);

    console.log(`✅ [WebhookAgentIntegration] Agent status tracking initialized for workflow ${event.workflow_id}`);
  }

  /**
   * Handle agent started event
   */
  private async handleAgentStarted(event: OpalWebhookEvent): Promise<void> {
    if (!event.agent_id || !event.agent_name) {
      console.warn('[WebhookAgentIntegration] Agent started event missing agent_id or agent_name');
      return;
    }

    console.log(`🏃 [WebhookAgentIntegration] Agent started: ${event.agent_name} (${event.agent_id})`);

    // Update agent status to running
    await agentStatusTracker.updateAgentStatus(
      event.workflow_id,
      event.agent_id,
      'running',
      {
        progress_percentage: 0
      }
    );
  }

  /**
   * Handle agent completed event
   */
  private async handleAgentCompleted(event: OpalWebhookEvent): Promise<void> {
    if (!event.agent_id || !event.agent_name) {
      console.warn('[WebhookAgentIntegration] Agent completed event missing agent_id or agent_name');
      return;
    }

    const success = event.agent_success ?? false;
    const status: AgentStatus = success ? 'completed' : 'failed';

    console.log(`${success ? '✅' : '❌'} [WebhookAgentIntegration] Agent ${status}: ${event.agent_name} (${event.agent_id})`);

    // Update agent status with completion details
    await agentStatusTracker.updateAgentStatus(
      event.workflow_id,
      event.agent_id,
      status,
      {
        execution_time_ms: event.execution_time_ms,
        error_message: event.agent_error,
        progress_percentage: success ? 100 : undefined,
        agent_output: event.agent_output
      }
    );

    // Check if this completes the workflow
    const workflowProgress = agentStatusTracker.getWorkflowProgress(event.workflow_id);
    if (workflowProgress) {
      const totalAgents = workflowProgress.agents_total;
      const completedAgents = workflowProgress.agents_completed;
      const failedAgents = workflowProgress.agents_failed;

      console.log(`📊 [WebhookAgentIntegration] Workflow progress: ${completedAgents + failedAgents}/${totalAgents} agents finished`);

      if (completedAgents + failedAgents === totalAgents) {
        const workflowSuccess = failedAgents === 0;
        console.log(`🏁 [WebhookAgentIntegration] Workflow ${event.workflow_id} ${workflowSuccess ? 'completed successfully' : 'completed with failures'}`);
      }
    }
  }

  /**
   * Handle workflow completed event
   */
  private async handleWorkflowCompleted(event: OpalWebhookEvent): Promise<void> {
    console.log(`🎉 [WebhookAgentIntegration] Workflow completed: ${event.workflow_name} (${event.workflow_id})`);

    // Ensure all agents are marked as completed if not already
    const workflowProgress = agentStatusTracker.getWorkflowProgress(event.workflow_id);
    if (workflowProgress) {
      for (const agent of workflowProgress.agents) {
        if (agent.status === 'running' || agent.status === 'starting') {
          console.log(`🔄 [WebhookAgentIntegration] Force completing agent ${agent.agent_id} due to workflow completion`);
          await agentStatusTracker.updateAgentStatus(
            event.workflow_id,
            agent.agent_id,
            'completed',
            {
              progress_percentage: 100
            }
          );
        }
      }
    }
  }

  /**
   * Handle workflow failed event
   */
  private async handleWorkflowFailed(event: OpalWebhookEvent): Promise<void> {
    console.error(`💥 [WebhookAgentIntegration] Workflow failed: ${event.workflow_name} (${event.workflow_id})`);

    // Mark any running agents as failed
    const workflowProgress = agentStatusTracker.getWorkflowProgress(event.workflow_id);
    if (workflowProgress) {
      for (const agent of workflowProgress.agents) {
        if (agent.status === 'running' || agent.status === 'starting') {
          console.log(`❌ [WebhookAgentIntegration] Marking agent ${agent.agent_id} as failed due to workflow failure`);
          await agentStatusTracker.updateAgentStatus(
            event.workflow_id,
            agent.agent_id,
            'failed',
            {
              error_message: 'Workflow failed before agent completion'
            }
          );
        }
      }
    }
  }

  /**
   * Get current status for dashboard display
   */
  async getCurrentAgentStatuses(): Promise<Map<string, any>> {
    return agentStatusTracker.getLatestAgentStatuses();
  }

  /**
   * Get workflow progress for monitoring
   */
  async getWorkflowProgress(workflowId: string) {
    return agentStatusTracker.getWorkflowProgress(workflowId);
  }

  /**
   * Subscribe to real-time agent status updates
   */
  subscribeToAgentUpdates(callback: (status: any) => void): () => void {
    return agentStatusTracker.subscribe(callback);
  }

  /**
   * Subscribe to real-time workflow progress updates
   */
  subscribeToWorkflowUpdates(callback: (progress: any) => void): () => void {
    return agentStatusTracker.subscribeToWorkflow(callback);
  }

  /**
   * Force refresh agent status from database (for initialization)
   */
  async refreshAgentStatusFromDatabase(): Promise<void> {
    // This would query the database and update in-memory state
    // Implement based on your database structure
    console.log('🔄 [WebhookAgentIntegration] Refreshing agent status from database...');

    // For now, we'll rely on the in-memory tracking
    // In production, you might want to restore state from database on startup
  }

  /**
   * Simulate agent progress for testing (fallback mode)
   */
  async simulateAgentProgress(workflowId: string, workflowName: string): Promise<void> {
    console.log('🎭 [WebhookAgentIntegration] Simulating agent progress for testing');

    // Initialize workflow
    await agentStatusTracker.initializeWorkflow(workflowId, workflowName);

    const agents = Object.keys(agentStatusTracker.OPAL_AGENTS);

    // Simulate each agent with delays
    for (let i = 0; i < agents.length; i++) {
      const agentId = agents[i];
      const delay = (i + 1) * 3000; // 3s, 6s, 9s, etc.

      setTimeout(async () => {
        // Start agent
        await agentStatusTracker.updateAgentStatus(workflowId, agentId, 'running');

        // Complete agent after another delay
        setTimeout(async () => {
          const success = Math.random() > 0.1; // 90% success rate
          await agentStatusTracker.updateAgentStatus(
            workflowId,
            agentId,
            success ? 'completed' : 'failed',
            {
              execution_time_ms: Math.floor(Math.random() * 50000) + 10000, // 10-60 seconds
              error_message: success ? undefined : 'Simulated agent failure'
            }
          );
        }, 2000 + Math.random() * 3000); // 2-5 second execution
      }, delay);
    }
  }
}

export const webhookAgentIntegration = WebhookAgentIntegration.getInstance();
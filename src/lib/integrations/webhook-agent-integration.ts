/**
 * Enhanced Webhook Agent Integration for OPAL Connector - Agents Service
 * Connects OPAL webhook events to real-time agent status tracking with comprehensive data processing
 */

import { agentStatusTracker, AgentStatus } from '@/lib/monitoring/agent-status-tracker';
import { webhookEventOperations } from '@/lib/database/webhook-events';
import { monitoringErrorHandler } from '@/lib/monitoring/error-handler';
import {
  OPALAgentId,
  OSAAgentData,
  BaseAgentExecutionResult
} from '@/lib/types/opal-types';
import { validateAgentData, OPAL_AGENT_CONFIGS } from '@/lib/validation/opal-validation';

// Enhanced webhook event interface with OSA workflow data support
export interface OpalWebhookEvent {
  event_type: 'workflow.completed' | 'workflow.failed' | 'workflow.triggered' | 'agent.completed' | 'agent.started' | 'osa_workflow_data.received';
  workflow_id: string;
  workflow_name: string;
  timestamp: string;
  agent_id?: string;
  agent_name?: string;
  agent_output?: any;
  agent_success?: boolean;
  agent_error?: string;
  execution_time_ms?: number;
  trigger_source?: 'schedule' | 'api' | 'event' | 'manual' | 'opal_connector';

  // Enhanced metadata with OSA-specific fields
  metadata?: {
    client_id?: string;
    project_id?: string;
    environment?: string;
    user_id?: string;
    session_id?: string;
    client_name?: string;
    business_objectives?: string[];
  };

  // ✅ NEW: Enhanced fields for OSA workflow data processing
  execution_results?: BaseAgentExecutionResult | Record<string, any>;
  confidence_score?: number;
  data_points_analyzed?: number;
  agent_category?: 'analysis' | 'strategy' | 'optimization' | 'monitoring';
  validation_warnings?: string[];
}

// OSA-specific webhook event for structured agent data
export interface OSAWorkflowDataEvent extends OpalWebhookEvent {
  event_type: 'osa_workflow_data.received';
  agent_data: OSAAgentData;
  validation_result: {
    is_valid: boolean;
    errors: string[];
    warnings: string[];
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
   * Enhanced to support OSA workflow data processing
   */
  async processWebhookEvent(event: OpalWebhookEvent | OSAWorkflowDataEvent): Promise<void> {
    console.log(`🔄 [WebhookAgentIntegration] Processing ${event.event_type} for workflow ${event.workflow_id}`, {
      agent_id: event.agent_id,
      trigger_source: event.trigger_source,
      timestamp: event.timestamp
    });

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

          // ✅ NEW: Handle OSA workflow data events
          case 'osa_workflow_data.received':
            await this.handleOSAWorkflowDataReceived(event as OSAWorkflowDataEvent);
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
   * ✅ NEW: Handle OSA workflow data received event from OPAL Connector
   * Process structured agent data with comprehensive validation and enhanced tracking
   */
  private async handleOSAWorkflowDataReceived(event: OSAWorkflowDataEvent): Promise<void> {
    console.log(`📊 [WebhookAgentIntegration] OSA workflow data received for agent ${event.agent_data.agent_name} (${event.agent_data.agent_id})`);

    const agentData = event.agent_data;
    const agentConfig = OPAL_AGENT_CONFIGS[agentData.agent_id as OPALAgentId];

    // Log validation results
    if (!event.validation_result.is_valid) {
      console.error(`❌ [WebhookAgentIntegration] OSA agent data validation failed:`, event.validation_result.errors);

      // Update agent status to failed due to validation
      await agentStatusTracker.updateAgentStatus(
        agentData.workflow_id,
        agentData.agent_id,
        'failed',
        {
          execution_time_ms: agentData.metadata.execution_time_ms,
          error_message: `Validation failed: ${event.validation_result.errors.join(', ')}`,
          progress_percentage: 0
        }
      );
      return;
    }

    if (event.validation_result.warnings.length > 0) {
      console.warn(`⚠️ [WebhookAgentIntegration] OSA agent data validation warnings:`, event.validation_result.warnings);
    }

    // Process successful agent execution with comprehensive metadata
    const success = agentData.metadata.success;
    const status: AgentStatus = success ? 'completed' : 'failed';

    console.log(`${success ? '✅' : '❌'} [WebhookAgentIntegration] OSA Agent ${status}: ${agentData.agent_name} (${agentData.agent_id})`, {
      execution_time: agentData.metadata.execution_time_ms,
      estimated_time: agentConfig?.estimated_runtime_ms,
      confidence_score: agentData.execution_results?.confidence_score,
      data_points: agentData.execution_results?.data_points_analyzed,
      category: agentConfig?.category
    });

    // Update agent status with enhanced OSA data
    await agentStatusTracker.updateAgentStatus(
      agentData.workflow_id,
      agentData.agent_id,
      status,
      {
        execution_time_ms: agentData.metadata.execution_time_ms,
        error_message: agentData.metadata.error_message,
        progress_percentage: success ? 100 : undefined,
        agent_output: agentData.output_data || {}
      }
    );

    // Store enhanced webhook event with OSA-specific data
    await webhookEventOperations.storeWebhookEvent({
      event_type: 'osa_agent_data.processed',
      workflow_id: agentData.workflow_id,
      workflow_name: event.workflow_name,
      agent_id: agentData.agent_id,
      agent_name: agentData.agent_name,
      received_at: event.timestamp,
      payload: {
        execution_results: agentData.execution_results,
        confidence_score: agentData.execution_results?.confidence_score,
        data_points_analyzed: agentData.execution_results?.data_points_analyzed,
        agent_category: agentConfig?.category,
        validation_warnings: event.validation_result.warnings,
        client_name: event.metadata?.client_name,
        business_objectives: event.metadata?.business_objectives,
        processing_timestamp: new Date().toISOString()
      },
      success: success,
      error_message: agentData.metadata.error_message
    });

    // Enhanced workflow progress tracking
    const workflowProgress = agentStatusTracker.getWorkflowProgress(agentData.workflow_id);
    if (workflowProgress) {
      const totalAgents = workflowProgress.agents_total;
      const completedAgents = workflowProgress.agents_completed;
      const failedAgents = workflowProgress.agents_failed;

      console.log(`📊 [WebhookAgentIntegration] OSA Workflow progress: ${completedAgents + failedAgents}/${totalAgents} agents finished`, {
        workflow_id: agentData.workflow_id,
        completed: completedAgents,
        failed: failedAgents,
        remaining: totalAgents - (completedAgents + failedAgents)
      });

      // Check for workflow completion with category breakdown
      if (completedAgents + failedAgents === totalAgents) {
        const workflowSuccess = failedAgents === 0;
        console.log(`🏁 [WebhookAgentIntegration] OSA Workflow ${agentData.workflow_id} ${workflowSuccess ? 'completed successfully' : 'completed with failures'}`, {
          total_agents: totalAgents,
          successful_agents: completedAgents,
          failed_agents: failedAgents,
          success_rate: `${Math.round((completedAgents / totalAgents) * 100)}%`
        });
      }
    }

    console.log(`✅ [WebhookAgentIntegration] OSA agent data processing completed for ${agentData.agent_name}`);
  }

  /**
   * Create OSA workflow data event from webhook payload (utility method)
   * Used by the OPAL Connector to forward processed agent data
   */
  async createOSAWorkflowDataEvent(
    agentData: OSAAgentData,
    workflowName: string,
    validationResult: { is_valid: boolean; errors: string[]; warnings: string[] }
  ): Promise<OSAWorkflowDataEvent> {
    const agentConfig = OPAL_AGENT_CONFIGS[agentData.agent_id as OPALAgentId];

    return {
      event_type: 'osa_workflow_data.received',
      workflow_id: agentData.workflow_id,
      workflow_name: workflowName,
      timestamp: agentData.metadata.timestamp,
      agent_id: agentData.agent_id,
      agent_name: agentData.agent_name,
      agent_output: agentData.output_data,
      agent_success: agentData.metadata.success,
      agent_error: agentData.metadata.error_message,
      execution_time_ms: agentData.metadata.execution_time_ms,
      trigger_source: 'opal_connector',

      // Enhanced OSA-specific fields
      execution_results: agentData.execution_results,
      confidence_score: agentData.execution_results?.confidence_score,
      data_points_analyzed: agentData.execution_results?.data_points_analyzed,
      agent_category: agentConfig?.category,
      validation_warnings: validationResult.warnings,

      // OSA-specific payload
      agent_data: agentData,
      validation_result: validationResult,

      metadata: {
        client_name: 'OPAL Connector',
        environment: process.env.NODE_ENV || 'development'
      }
    };
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
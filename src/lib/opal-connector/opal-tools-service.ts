/**
 * Opal Connector - Agents Service
 *
 * This service integrates with Optimizely Opal Tools SDK to provide
 * structured agent data reception via osa_workflow_data webhooks.
 *
 * Supports 9 Opal agents:
 * - experiment_blueprinter
 * - audience_suggester
 * - content_review
 * - roadmap_generator
 * - integration_health
 * - personalization_idea_generator
 * - cmp_organizer
 * - customer_journey
 * - geo_audit
 */

import { ToolsService, tool, IslandResponse, IslandConfig } from '@optimizely-opal/opal-tools-sdk';
import {
  OSAWorkflowParameters,
  OSAWorkflowResult,
  OSAAgentData,
  OPALAgentId
} from '@/lib/types/opal-types';
import {
  validateOSAWorkflowData,
  validateAgentData,
  OPAL_AGENT_CONFIGS
} from '@/lib/validation/opal-validation';
import { agentStatusTracker } from '@/lib/monitoring/agent-status-tracker';

class OpalConnectorService {
  private static instance: OpalConnectorService;
  private toolsService: ToolsService | null = null;

  private constructor() {}

  public static getInstance(): OpalConnectorService {
    if (!OpalConnectorService.instance) {
      OpalConnectorService.instance = new OpalConnectorService();
    }
    return OpalConnectorService.instance;
  }

  /**
   * Initialize the Opal Tools Service integration
   */
  public initializeToolsService(app?: any): void {
    try {
      console.log('🔌 Initializing Opal Connector - Agents service...');

      // Initialize tools service (Express integration handled by Next.js API routes)
      this.toolsService = new ToolsService(app);

      console.log('✅ Opal Tools Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Opal Tools Service:', error);
      throw error;
    }
  }

  /**
   * Process incoming OSA workflow data from Opal agents with comprehensive validation
   */
  public async processOSAWorkflowData(data: OSAWorkflowParameters): Promise<OSAWorkflowResult> {
    const startTime = Date.now();

    try {
      console.log('🚀 OSA Connector received workflow data:', {
        workflow_id: data.workflow_id,
        agent_count: data.agent_data?.length || 0,
        client: data.client_name || 'Unknown',
        timestamp: new Date().toISOString()
      });

      // Step 1: Comprehensive workflow validation
      console.log('🔍 Validating OSA workflow data structure and content...');
      const validationResult = validateOSAWorkflowData(data);

      if (!validationResult.is_valid) {
        console.error('❌ OSA workflow validation failed:', {
          errors: validationResult.errors,
          warnings: validationResult.warnings
        });

        return {
          workflow_id: data.workflow_id || 'unknown',
          status: 'failed',
          agents_received: [],
          total_agents: data.agent_data?.length || 0,
          message: `Validation failed: ${validationResult.errors.join(', ')}`,
          timestamp: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
          errors: validationResult.errors.map(error => ({
            agent_id: 'validation' as OPALAgentId,
            error_message: error,
            error_code: 'VALIDATION_ERROR'
          }))
        };
      }

      // Log validation warnings (non-blocking)
      if (validationResult.warnings.length > 0) {
        console.warn('⚠️ OSA workflow validation warnings:', validationResult.warnings);
      }

      console.log('✅ OSA workflow validation passed successfully');

      // Step 2: Initialize workflow monitoring if first agents are received
      const isNewWorkflow = !await this.isWorkflowInitialized(data.workflow_id);
      if (isNewWorkflow) {
        console.log('🔄 Initializing new workflow monitoring:', data.workflow_id);
        await agentStatusTracker.initializeWorkflow(data.workflow_id, 'Strategy Assistant Workflow');
      }

      // Step 3: Log detailed agent data reception and update status
      for (const agentData of data.agent_data) {
        const agentConfig = OPAL_AGENT_CONFIGS[agentData.agent_id as OPALAgentId];
        console.log(`📊 Agent ${agentData.agent_name} (${agentData.agent_id}) data received:`, {
          success: agentData.metadata.success,
          execution_time: agentData.metadata.execution_time_ms,
          estimated_time: agentConfig?.estimated_runtime_ms || 'unknown',
          data_size: JSON.stringify(agentData.output_data || {}).length,
          confidence: agentData.execution_results?.confidence_score || 'N/A',
          data_points: agentData.execution_results?.data_points_analyzed || 'N/A'
        });

        // Update agent status in real-time monitoring system
        await agentStatusTracker.updateAgentStatus(
          data.workflow_id,
          agentData.agent_id,
          agentData.metadata.success ? 'completed' : 'failed',
          {
            execution_time_ms: agentData.metadata.execution_time_ms,
            error_message: agentData.metadata.success ? undefined : 'Agent execution failed',
            progress_percentage: 100,
            agent_output: agentData.execution_results
          }
        );
      }

      // Step 3: Process agent data with validation
      const processedAgents = await this.processAgentData(validationResult.validated_data!);

      // Step 4: Generate comprehensive result
      const processingTime = Date.now() - startTime;
      const result: OSAWorkflowResult = {
        workflow_id: data.workflow_id,
        status: processedAgents.length === data.agent_data.length ? 'completed' : 'failed',
        agents_received: processedAgents,
        total_agents: data.agent_data.length,
        message: `Successfully processed ${processedAgents.length}/${data.agent_data.length} agents`,
        timestamp: new Date().toISOString(),
        processing_time_ms: processingTime,
        metadata: {
          client_name: data.client_name,
          business_objectives: data.business_objectives,
          validation_warnings: validationResult.warnings.length,
          agent_categories: this.categorizeAgents(processedAgents)
        }
      };

      console.log(`✅ OSA workflow data processed successfully in ${processingTime}ms:`, {
        workflow_id: result.workflow_id,
        status: result.status,
        agents_processed: result.agents_received.length,
        processing_time_ms: processingTime,
        categories: result.metadata?.agent_categories
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Critical error processing OSA workflow data:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        processing_time_ms: processingTime,
        workflow_id: data?.workflow_id || 'unknown'
      });

      return {
        workflow_id: data?.workflow_id || 'unknown',
        status: 'failed',
        agents_received: [],
        total_agents: data?.agent_data?.length || 0,
        message: `Critical processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        processing_time_ms: processingTime,
        errors: [{
          agent_id: 'system' as OPALAgentId,
          error_message: error instanceof Error ? error.message : 'Unknown system error',
          error_code: 'SYSTEM_ERROR'
        }]
      };
    }
  }

  /**
   * Categorize agents by their type for reporting
   */
  private categorizeAgents(agentIds: OPALAgentId[]): Record<string, number> {
    const categories = {
      analysis: 0,
      strategy: 0,
      optimization: 0,
      monitoring: 0
    };

    agentIds.forEach(agentId => {
      const config = OPAL_AGENT_CONFIGS[agentId];
      if (config) {
        categories[config.category]++;
      }
    });

    return categories;
  }

  /**
   * Process individual agent data and integrate with existing infrastructure
   */
  private async processAgentData(workflowData: OSAWorkflowParameters): Promise<OPALAgentId[]> {
    const processedAgents: OPALAgentId[] = [];

    for (const agentData of workflowData.agent_data) {
      try {
        console.log(`🔄 Processing agent ${agentData.agent_name} (${agentData.agent_id})...`);

        // Validate individual agent data (double-check after workflow validation)
        const agentValidation = validateAgentData(agentData);

        if (!agentValidation.is_valid) {
          console.error(`❌ Agent validation failed for ${agentData.agent_id}:`, agentValidation.errors);
          throw new Error(`Agent validation failed: ${agentValidation.errors.join(', ')}`);
        }

        if (agentValidation.warnings.length > 0) {
          console.warn(`⚠️ Agent validation warnings for ${agentData.agent_id}:`, agentValidation.warnings);
        }

        // Create enhanced webhook payload format for existing handler
        const webhookPayload = {
          event_type: 'agent.completed',
          workflow_id: agentData.workflow_id,
          agent_id: agentData.agent_id,
          agent_name: agentData.agent_name,
          agent_output: agentData.output_data || {},
          agent_success: agentData.metadata.success,
          agent_error: agentData.metadata.error_message,
          execution_time_ms: agentData.metadata.execution_time_ms,
          timestamp: agentData.metadata.timestamp,
          // Enhanced data from validation
          execution_results: agentData.execution_results,
          confidence_score: agentData.execution_results?.confidence_score,
          data_points_analyzed: agentData.execution_results?.data_points_analyzed,
          agent_category: OPAL_AGENT_CONFIGS[agentData.agent_id as OPALAgentId]?.category
        };

        // Send to existing webhook handler (will be integrated in Phase 4)
        await this.forwardToWebhookHandler(webhookPayload);

        processedAgents.push(agentData.agent_id as OPALAgentId);

        console.log(`✅ Agent ${agentData.agent_name} (${agentData.agent_id}) data processed and stored successfully`);

      } catch (error) {
        console.error(`❌ Failed to process agent ${agentData.agent_id}:`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          agent_name: agentData.agent_name,
          workflow_id: agentData.workflow_id
        });
        // Continue processing other agents - don't let one failure stop the entire workflow
      }
    }

    console.log(`📊 Agent processing summary: ${processedAgents.length}/${workflowData.agent_data.length} agents processed successfully`);
    return processedAgents;
  }


  /**
   * Forward processed OSA agent data to enhanced webhook handler
   * Integrates with the existing webhook infrastructure for real-time updates
   */
  private async forwardToWebhookHandler(webhookPayload: any): Promise<void> {
    try {
      console.log('🔄 Forwarding OSA agent data to webhook handler:', {
        event_type: webhookPayload.event_type,
        workflow_id: webhookPayload.workflow_id,
        agent_id: webhookPayload.agent_id,
        agent_name: webhookPayload.agent_name,
        success: webhookPayload.agent_success,
        confidence_score: webhookPayload.confidence_score,
        category: webhookPayload.agent_category
      });

      // Import webhook integration dynamically to avoid circular dependencies
      const { webhookAgentIntegration } = await import('@/lib/integrations/webhook-agent-integration');

      // Create OSA workflow data event with validation results
      const agentData: OSAAgentData = {
        agent_id: webhookPayload.agent_id,
        agent_name: webhookPayload.agent_name,
        workflow_id: webhookPayload.workflow_id,
        execution_results: webhookPayload.execution_results || {},
        metadata: {
          execution_time_ms: webhookPayload.execution_time_ms,
          timestamp: webhookPayload.timestamp,
          success: webhookPayload.agent_success,
          error_message: webhookPayload.agent_error
        },
        output_data: webhookPayload.agent_output
      };

      // Re-validate agent data to get validation results
      const validationResult = validateAgentData(agentData);

      // Create OSA workflow data event
      const osaEvent = await webhookAgentIntegration.createOSAWorkflowDataEvent(
        agentData,
        `OPAL Workflow ${webhookPayload.workflow_id}`,
        validationResult
      );

      // Process through enhanced webhook handler
      await webhookAgentIntegration.processWebhookEvent(osaEvent);

      console.log(`✅ OSA agent data forwarded to webhook handler successfully: ${webhookPayload.agent_name}`);

    } catch (error) {
      console.error('❌ Failed to forward OSA agent data to webhook handler:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        agent_id: webhookPayload.agent_id,
        workflow_id: webhookPayload.workflow_id
      });

      // Continue execution - don't let webhook forwarding failures stop agent processing
      throw error;
    }
  }

  /**
   * Check if a workflow has been initialized in the monitoring system
   */
  private async isWorkflowInitialized(workflowId: string): Promise<boolean> {
    try {
      const progress = agentStatusTracker.getWorkflowProgress(workflowId);
      return progress !== null;
    } catch (error) {
      console.warn('❌ Error checking workflow initialization:', error);
      return false;
    }
  }

  /**
   * Get service status and configuration
   */
  public getServiceStatus(): any {
    return {
      service_name: 'Opal Connector - Agents',
      status: 'active',
      tools_service_initialized: this.toolsService !== null,
      supported_agents: [
        'experiment_blueprinter',
        'audience_suggester',
        'content_review',
        'roadmap_generator',
        'integration_health',
        'personalization_idea_generator',
        'cmp_organizer',
        'customer_journey',
        'geo_audit'
      ],
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Opal Tool Definition - OSA Workflow Data Receiver
 * This tool will be discovered by Optimizely Opal and used to send agent data
 */
@tool({
  name: 'osa_workflow_data',
  description: 'Receives and processes workflow data from Opal agents for OSA (Optimizely Strategy Assistant)'
})
export async function receiveOSAWorkflowData(parameters: OSAWorkflowParameters): Promise<OSAWorkflowResult> {
  const connector = OpalConnectorService.getInstance();
  return await connector.processOSAWorkflowData(parameters);
}

// Export singleton instance
export const opalConnector = OpalConnectorService.getInstance();

// Export types for use in other modules
export type { OSAWorkflowData, OSAWorkflowParameters, OSAWorkflowResult };
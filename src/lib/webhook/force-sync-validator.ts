/**
 * Force Sync Completion Validator
 * Automatically triggers OPAL integration validation when Force Sync completes
 */

import { OpalIntegrationValidator } from '../opal/integration-validator';
import { createSupabaseAdmin } from '../database/supabase-client';

export interface ForceSyncCompletionEvent {
  type: 'force_sync.completed' | 'force_sync.failed';
  workflowId: string;
  correlationId?: string;
  tenantId?: string;
  timestamp: string;
  status: 'completed' | 'failed';
  agentCount?: number;
  duration?: number;
  metadata?: any;
}

export class ForceSyncValidator {
  private validator: OpalIntegrationValidator;
  private supabase: ReturnType<typeof createSupabaseAdmin>;

  constructor() {
    this.validator = new OpalIntegrationValidator();
    this.supabase = createSupabaseAdmin();
  }

  /**
   * Handle Force Sync completion event
   */
  async handleForceSyncCompletion(event: ForceSyncCompletionEvent): Promise<{
    success: boolean;
    validationTriggered: boolean;
    validationResult?: any;
    error?: string;
  }> {
    try {
      console.log(`🔔 [Force Sync Validator] Received completion event:`, {
        workflowId: event.workflowId,
        status: event.status,
        type: event.type
      });

      // Record the Force Sync run in database
      await this.recordForceSyncRun(event);

      // Only validate successful completions
      if (event.status !== 'completed') {
        console.log(`⏭️ [Force Sync Validator] Skipping validation for status: ${event.status}`);
        return {
          success: true,
          validationTriggered: false
        };
      }

      // Trigger validation with a slight delay to ensure all data is settled
      console.log(`⏳ [Force Sync Validator] Triggering validation in 5 seconds...`);
      
      // Use setTimeout for delay in production, or immediate for testing
      const delay = process.env.NODE_ENV === 'test' ? 0 : 5000;
      
      await new Promise(resolve => setTimeout(resolve, delay));

      const validationResult = await this.validator.validateWorkflow({
        forceSyncWorkflowId: event.workflowId,
        opalCorrelationId: event.correlationId,
        tenantId: event.tenantId
      });

      // Update Force Sync run as validated
      await this.markAsValidated(event.workflowId);

      console.log(`✅ [Force Sync Validator] Validation completed for ${event.workflowId}: ${validationResult.overallStatus}`);

      return {
        success: true,
        validationTriggered: true,
        validationResult
      };

    } catch (error: any) {
      console.error(`❌ [Force Sync Validator] Failed to handle completion for ${event.workflowId}:`, error);
      
      return {
        success: false,
        validationTriggered: true,
        error: error.message
      };
    }
  }

  /**
   * Record Force Sync run in database
   */
  private async recordForceSyncRun(event: ForceSyncCompletionEvent): Promise<void> {
    try {
      // Check if record already exists
      const { data: existing } = await this.supabase
        .from('force_sync_runs')
        .select('id')
        .eq('force_sync_workflow_id', event.workflowId)
        .single();

      if (existing) {
        // Update existing record
        await this.supabase
          .from('force_sync_runs')
          .update({
            status: event.status,
            opal_correlation_id: event.correlationId,
            tenant_id: event.tenantId,
            agent_count: event.agentCount,
            execution_duration_ms: event.duration,
            updated_at: new Date().toISOString(),
            completed_at: event.status === 'completed' ? event.timestamp : null
          })
          .eq('force_sync_workflow_id', event.workflowId);
      } else {
        // Insert new record
        await this.supabase
          .from('force_sync_runs')
          .insert({
            force_sync_workflow_id: event.workflowId,
            opal_correlation_id: event.correlationId,
            tenant_id: event.tenantId,
            status: event.status,
            agent_count: event.agentCount,
            execution_duration_ms: event.duration,
            initiated_by: 'system',
            validation_status: 'pending',
            created_at: event.timestamp,
            updated_at: new Date().toISOString(),
            completed_at: event.status === 'completed' ? event.timestamp : null
          });
      }

      console.log(`📝 [Force Sync Validator] Recorded Force Sync run: ${event.workflowId}`);
    } catch (error: any) {
      console.error(`❌ [Force Sync Validator] Failed to record Force Sync run:`, error);
      // Don't throw - this shouldn't block validation
    }
  }

  /**
   * Mark Force Sync run as validated
   */
  private async markAsValidated(workflowId: string): Promise<void> {
    try {
      await this.supabase
        .from('force_sync_runs')
        .update({
          validation_status: 'validated',
          updated_at: new Date().toISOString()
        })
        .eq('force_sync_workflow_id', workflowId);
    } catch (error: any) {
      console.error(`❌ [Force Sync Validator] Failed to mark as validated:`, error);
      // Don't throw - validation succeeded even if marking failed
    }
  }

  /**
   * Validate multiple pending workflows (for cron jobs)
   */
  async validatePendingWorkflows(limit: number = 10): Promise<{
    success: boolean;
    processed: number;
    results: any[];
    error?: string;
  }> {
    try {
      console.log(`🔍 [Force Sync Validator] Checking for pending workflows (limit: ${limit})`);

      const { data: pendingRuns, error } = await this.supabase
        .from('force_sync_runs')
        .select('force_sync_workflow_id, opal_correlation_id, tenant_id, created_at')
        .eq('status', 'completed')
        .eq('validation_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      if (!pendingRuns || pendingRuns.length === 0) {
        console.log('✅ [Force Sync Validator] No pending workflows found');
        return {
          success: true,
          processed: 0,
          results: []
        };
      }

      console.log(`📋 [Force Sync Validator] Found ${pendingRuns.length} pending workflows`);

      const results = [];
      for (const run of pendingRuns) {
        try {
          const validationResult = await this.validator.validateWorkflow({
            forceSyncWorkflowId: run.force_sync_workflow_id,
            opalCorrelationId: run.opal_correlation_id,
            tenantId: run.tenant_id
          });

          await this.markAsValidated(run.force_sync_workflow_id);

          results.push({
            workflowId: run.force_sync_workflow_id,
            status: validationResult.overallStatus,
            success: validationResult.success
          });

          console.log(`✅ [Force Sync Validator] Validated ${run.force_sync_workflow_id}: ${validationResult.overallStatus}`);

        } catch (error: any) {
          console.error(`❌ [Force Sync Validator] Failed to validate ${run.force_sync_workflow_id}:`, error);
          
          results.push({
            workflowId: run.force_sync_workflow_id,
            status: 'error',
            success: false,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ [Force Sync Validator] Batch completed: ${successCount}/${results.length} successful`);

      return {
        success: true,
        processed: results.length,
        results
      };

    } catch (error: any) {
      console.error(`❌ [Force Sync Validator] Batch validation failed:`, error);
      
      return {
        success: false,
        processed: 0,
        results: [],
        error: error.message
      };
    }
  }
}

/**
 * Singleton instance for use across the application
 */
export const forceSyncValidator = new ForceSyncValidator();

/**
 * Helper function for webhook integration
 */
export async function handleForceSyncWebhook(payload: any): Promise<any> {
  // Transform webhook payload to ForceSyncCompletionEvent
  const event: ForceSyncCompletionEvent = {
    type: payload.type || 'force_sync.completed',
    workflowId: payload.workflowId || payload.workflow_id,
    correlationId: payload.correlationId || payload.correlation_id,
    tenantId: payload.tenantId || payload.tenant_id,
    timestamp: payload.timestamp || new Date().toISOString(),
    status: payload.status === 'failed' ? 'failed' : 'completed',
    agentCount: payload.agentCount || payload.agent_count,
    duration: payload.duration || payload.execution_time,
    metadata: payload.metadata
  };

  return await forceSyncValidator.handleForceSyncCompletion(event);
}
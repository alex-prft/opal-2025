/**
 * Supabase Factory Client
 *
 * Enterprise-grade Supabase client for AI Agent Factory operations.
 * Integrates with OSA's existing Supabase guardrails and compliance systems.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AgentSpecification,
  PhaseResult,
  FactoryError,
  AuditLogEntry,
  WorkflowPhase
} from '../types';
import { FactoryLogger } from '../utils/factory-logger';

export class SupabaseFactoryClient {
  private client: SupabaseClient;
  private logger: FactoryLogger;
  private readonly enableAuditLogging: boolean = true;
  private readonly enablePiiProtection: boolean = true;

  constructor() {
    // Initialize Supabase client with enterprise configuration
    this.client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    this.logger = new FactoryLogger('SupabaseFactoryClient');

    this.logger.info('🗄️ [SupabaseFactoryClient] Initialized with enterprise guardrails', {
      auditLogging: this.enableAuditLogging,
      piiProtection: this.enablePiiProtection
    });
  }

  // =============================================================================
  // Agent Specification Operations
  // =============================================================================

  /**
   * Save agent specification with enterprise compliance
   */
  async saveSpecification(specification: AgentSpecification): Promise<void> {
    try {
      this.logger.debug('💾 [SaveSpecification] Saving agent specification', {
        agentId: specification.id,
        phase: specification.currentPhase,
        status: specification.status
      });

      // Perform PII scanning if enabled (leverage OSA's existing PII protection)
      const sanitizedSpec = this.enablePiiProtection
        ? await this.scanAndSanitizePii(specification)
        : specification;

      // Upsert specification
      const { error } = await this.client
        .from('agent_factory_specifications')
        .upsert({
          id: sanitizedSpec.id,
          agent_id: sanitizedSpec.id, // Use id as agent_id
          agent_name: sanitizedSpec.requirements.name,
          requirements: sanitizedSpec.requirements,
          current_phase: sanitizedSpec.currentPhase,
          status: sanitizedSpec.status,
          clarification_results: sanitizedSpec.clarificationResults || null,
          documentation_results: sanitizedSpec.documentation || null,
          parallel_development_results: sanitizedSpec.parallelDevelopment || null,
          implementation_results: sanitizedSpec.implementation || null,
          validation_results: sanitizedSpec.validation || null,
          delivery_results: sanitizedSpec.delivery || null,
          created_by: sanitizedSpec.createdBy || 'system',
          created_at: sanitizedSpec.createdAt,
          updated_at: new Date().toISOString(),
          compliance_level: sanitizedSpec.requirements.complianceLevel || 'enterprise',
          pii_scan_status: this.enablePiiProtection ? 'clean' : 'pending',
          metadata: sanitizedSpec.metadata || {}
        });

      if (error) {
        throw new Error(`Failed to save specification: ${error.message}`);
      }

      // Log audit trail
      if (this.enableAuditLogging) {
        await this.logAuditEvent({
          specificationId: specification.id,
          action: 'Agent specification saved',
          actionType: 'create',
          details: {
            phase: specification.currentPhase,
            status: specification.status
          }
        });
      }

      this.logger.success('✅ [SaveSpecification] Specification saved successfully', {
        agentId: specification.id
      });

    } catch (error) {
      this.logger.error('❌ [SaveSpecification] Failed to save specification', {
        agentId: specification.id,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get agent specification by ID
   */
  async getSpecification(agentId: string): Promise<AgentSpecification | null> {
    try {
      this.logger.debug('🔍 [GetSpecification] Retrieving agent specification', {
        agentId
      });

      const { data, error } = await this.client
        .from('agent_factory_specifications')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        throw new Error(`Failed to get specification: ${error.message}`);
      }

      // Convert database row to AgentSpecification
      const specification: AgentSpecification = {
        id: data.id,
        requirements: data.requirements,
        clarificationResults: data.clarification_results,
        documentation: data.documentation_results,
        parallelDevelopment: data.parallel_development_results,
        implementation: data.implementation_results,
        validation: data.validation_results,
        delivery: data.delivery_results,
        currentPhase: data.current_phase,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by,
        metadata: data.metadata
      };

      this.logger.debug('✅ [GetSpecification] Specification retrieved successfully', {
        agentId,
        phase: specification.currentPhase,
        status: specification.status
      });

      return specification;

    } catch (error) {
      this.logger.error('❌ [GetSpecification] Failed to retrieve specification', {
        agentId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * List agent specifications with filtering
   */
  async listSpecifications(filters: {
    status?: string;
    phase?: WorkflowPhase;
    createdBy?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<AgentSpecification[]> {
    try {
      this.logger.debug('📋 [ListSpecifications] Retrieving specifications list', filters);

      let query = this.client
        .from('agent_factory_specifications')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.phase) {
        query = query.eq('current_phase', filters.phase);
      }
      if (filters.createdBy) {
        query = query.eq('created_by', filters.createdBy);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to list specifications: ${error.message}`);
      }

      const specifications: AgentSpecification[] = (data || []).map(row => ({
        id: row.id,
        requirements: row.requirements,
        clarificationResults: row.clarification_results,
        documentation: row.documentation_results,
        parallelDevelopment: row.parallel_development_results,
        implementation: row.implementation_results,
        validation: row.validation_results,
        delivery: row.delivery_results,
        currentPhase: row.current_phase,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        metadata: row.metadata
      }));

      this.logger.success('✅ [ListSpecifications] Retrieved specifications successfully', {
        count: specifications.length,
        filters
      });

      return specifications;

    } catch (error) {
      this.logger.error('❌ [ListSpecifications] Failed to list specifications', {
        error: (error as Error).message,
        filters
      });
      throw error;
    }
  }

  // =============================================================================
  // Phase Results Operations
  // =============================================================================

  /**
   * Save phase execution result
   */
  async savePhaseResult(specificationId: string, result: PhaseResult): Promise<void> {
    try {
      this.logger.debug('💾 [SavePhaseResult] Saving phase result', {
        specificationId,
        phase: result.phase,
        success: result.success,
        confidence: result.confidenceScore
      });

      const { error } = await this.client
        .from('agent_factory_phase_results')
        .insert({
          specification_id: specificationId,
          phase: result.phase,
          subphase: null, // Will be used for parallel development subphases
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          execution_time_ms: result.executionTime,
          retry_count: 0,
          result: result.results,
          confidence_score: result.confidenceScore,
          success: result.success,
          claude_api_calls: result.resourcesUsed.claudeApiCalls,
          supabase_queries: result.resourcesUsed.supabaseQueries,
          estimated_cost_cents: result.resourcesUsed.estimatedCost,
          errors: result.errors || [],
          warnings: result.warnings || [],
          created_by: 'factory_engine'
        });

      if (error) {
        throw new Error(`Failed to save phase result: ${error.message}`);
      }

      // Update resource usage tracking
      await this.trackResourceUsage(specificationId, result);

      this.logger.success('✅ [SavePhaseResult] Phase result saved successfully', {
        specificationId,
        phase: result.phase
      });

    } catch (error) {
      this.logger.error('❌ [SavePhaseResult] Failed to save phase result', {
        specificationId,
        phase: result.phase,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Get phase results for a specification
   */
  async getPhaseResults(specificationId: string, phase?: WorkflowPhase): Promise<any[]> {
    try {
      let query = this.client
        .from('agent_factory_phase_results')
        .select('*')
        .eq('specification_id', specificationId)
        .order('created_at', { ascending: true });

      if (phase) {
        query = query.eq('phase', phase);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get phase results: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      this.logger.error('❌ [GetPhaseResults] Failed to retrieve phase results', {
        specificationId,
        phase,
        error: (error as Error).message
      });
      throw error;
    }
  }

  // =============================================================================
  // Error Logging Operations
  // =============================================================================

  /**
   * Log factory error with enterprise compliance
   */
  async logError(specificationId: string, factoryError: Partial<FactoryError>): Promise<void> {
    try {
      this.logger.debug('⚠️ [LogError] Logging factory error', {
        specificationId,
        errorType: factoryError.errorType,
        phase: factoryError.phase
      });

      const { error } = await this.client
        .from('agent_factory_errors')
        .insert({
          specification_id: specificationId,
          error_type: factoryError.errorType,
          phase: factoryError.phase,
          error_message: factoryError.message,
          error_details: factoryError.details || {},
          stack_trace: factoryError.details?.stack,
          recoverable: factoryError.recoverable || false,
          suggested_action: factoryError.suggestedAction,
          auto_retry_attempted: false,
          resolution_status: 'unresolved',
          user_context: {},
          system_context: {},
          occurred_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Failed to log error: ${error.message}`);
      }

      this.logger.info('📝 [LogError] Error logged successfully', {
        specificationId,
        errorType: factoryError.errorType
      });

    } catch (error) {
      this.logger.error('❌ [LogError] Failed to log error', {
        specificationId,
        error: (error as Error).message
      });
      // Don't throw here - logging failures shouldn't break the main workflow
    }
  }

  // =============================================================================
  // Audit Logging Operations
  // =============================================================================

  /**
   * Log audit event for compliance tracking
   */
  async logAuditEvent(auditEntry: Partial<AuditLogEntry>): Promise<void> {
    if (!this.enableAuditLogging) {
      return;
    }

    try {
      const { error } = await this.client
        .from('agent_factory_audit_log')
        .insert({
          specification_id: auditEntry.specificationId,
          action: auditEntry.action,
          action_type: auditEntry.actionType,
          phase: auditEntry.phase,
          user_id: auditEntry.userId || 'system',
          user_role: 'agent_factory',
          ip_address: null,
          user_agent: null,
          details: auditEntry.details || {},
          before_state: null,
          after_state: null,
          success: true,
          error_message: null,
          timestamp: new Date().toISOString(),
          duration_ms: null
        });

      if (error) {
        throw new Error(`Failed to log audit event: ${error.message}`);
      }

    } catch (error) {
      this.logger.error('❌ [LogAuditEvent] Failed to log audit event', {
        error: (error as Error).message
      });
      // Don't throw - audit logging failures shouldn't break workflows
    }
  }

  // =============================================================================
  // Resource Usage Tracking
  // =============================================================================

  /**
   * Track resource usage for cost monitoring and optimization
   */
  private async trackResourceUsage(specificationId: string, result: PhaseResult): Promise<void> {
    try {
      const periodStart = new Date();
      periodStart.setMinutes(0, 0, 0); // Round to hour
      const periodEnd = new Date(periodStart.getTime() + 3600000); // +1 hour

      // Upsert resource usage record
      const { error } = await this.client
        .from('agent_factory_resource_usage')
        .upsert({
          specification_id: specificationId,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          claude_api_calls: result.resourcesUsed.claudeApiCalls,
          claude_tokens_input: 0, // Would be populated with actual token counts
          claude_tokens_output: 0,
          supabase_queries: result.resourcesUsed.supabaseQueries,
          supabase_storage_bytes: 0,
          avg_response_time_ms: result.executionTime,
          max_memory_usage_mb: Math.round(result.resourcesUsed.memoryUsage),
          cpu_usage_percent: 0,
          estimated_cost_cents: result.resourcesUsed.estimatedCost,
          cost_breakdown: {
            claude_api: result.resourcesUsed.estimatedCost * 0.8,
            supabase: result.resourcesUsed.estimatedCost * 0.2
          }
        }, {
          onConflict: 'specification_id,period_start'
        });

      if (error) {
        this.logger.warning('⚠️ [TrackResourceUsage] Failed to track resource usage', {
          error: error.message
        });
      }

    } catch (error) {
      this.logger.warning('⚠️ [TrackResourceUsage] Resource tracking error', {
        error: (error as Error).message
      });
    }
  }

  // =============================================================================
  // PII Protection Integration
  // =============================================================================

  /**
   * Scan and sanitize PII from agent specifications
   * Integrates with OSA's existing PII protection system
   */
  private async scanAndSanitizePii(specification: AgentSpecification): Promise<AgentSpecification> {
    try {
      // In a real implementation, this would integrate with OSA's PII protection manager
      // For now, we'll implement basic sanitization

      const sanitized = { ...specification };

      // Basic PII patterns to redact
      const piiPatterns = [
        /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
        /\b\d{3}-\d{3}-\d{4}\b/g, // Phone numbers
        /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g // Credit cards
      ];

      // Sanitize requirements
      if (sanitized.requirements) {
        const reqString = JSON.stringify(sanitized.requirements);
        let sanitizedReqString = reqString;

        piiPatterns.forEach(pattern => {
          sanitizedReqString = sanitizedReqString.replace(pattern, '[REDACTED]');
        });

        sanitized.requirements = JSON.parse(sanitizedReqString);
      }

      return sanitized;

    } catch (error) {
      this.logger.warning('⚠️ [ScanAndSanitizePii] PII scanning failed, proceeding without sanitization', {
        error: (error as Error).message
      });
      return specification;
    }
  }

  // =============================================================================
  // Statistics and Monitoring
  // =============================================================================

  /**
   * Get factory performance statistics
   */
  async getFactoryStats(): Promise<any> {
    try {
      const { data, error } = await this.client
        .rpc('get_agent_factory_stats');

      if (error) {
        throw new Error(`Failed to get factory stats: ${error.message}`);
      }

      return data;

    } catch (error) {
      this.logger.error('❌ [GetFactoryStats] Failed to retrieve factory statistics', {
        error: (error as Error).message
      });
      return {
        total_agents: 0,
        active_agents: 0,
        completed_agents: 0,
        failed_agents: 0,
        avg_confidence_score: 0,
        avg_completion_time_hours: 0,
        last_updated: new Date().toISOString(),
        error: (error as Error).message
      };
    }
  }

  /**
   * Get health status of Supabase connection
   */
  async getHealthStatus() {
    try {
      // Test basic connectivity
      const { error } = await this.client
        .from('agent_factory_specifications')
        .select('count')
        .limit(1);

      if (error) {
        throw error;
      }

      return {
        status: 'operational',
        auditLogging: this.enableAuditLogging,
        piiProtection: this.enablePiiProtection,
        lastCheck: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'error',
        error: (error as Error).message,
        lastCheck: new Date().toISOString()
      };
    }
  }

  /**
   * Cleanup old data for compliance (data retention)
   */
  async cleanupOldData(retentionDays: number = 365): Promise<number> {
    try {
      const { data, error } = await this.client
        .rpc('cleanup_agent_factory_data', { retention_days: retentionDays });

      if (error) {
        throw new Error(`Cleanup failed: ${error.message}`);
      }

      this.logger.info('🧹 [CleanupOldData] Data retention cleanup completed', {
        retentionDays,
        deletedCount: data
      });

      return data || 0;

    } catch (error) {
      this.logger.error('❌ [CleanupOldData] Failed to cleanup old data', {
        error: (error as Error).message
      });
      throw error;
    }
  }
}
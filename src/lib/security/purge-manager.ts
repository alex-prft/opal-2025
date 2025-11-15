// Workflow Log Purge Manager for Customer Reference Cleanup
// Manages automated purging of logs with customer references

import { supabase } from '@/lib/supabase';
import { auditLogger } from './audit-logger';

export interface PurgePolicy {
  id: string;
  table_name: string;
  retention_days: number;
  purge_conditions: {
    customer_reference_patterns: string[];
    data_fields: string[];
  };
  preserve_fields: string[];
  enabled: boolean;
}

export interface PurgeResult {
  success: boolean;
  total_purged: number;
  total_preserved: number;
  details: {
    workflows: { purged: number; preserved: number };
    agents: { purged: number; preserved: number };
  };
  errors: string[];
  execution_time?: string;
}

export interface PurgeEligibility {
  table_name: string;
  records_eligible: number;
  oldest_record: string;
  estimated_purge_size: string;
}

export interface PurgeStatus {
  table_name: string;
  retention_days: number;
  enabled: boolean;
  workflows_preserved: number;
  agents_preserved: number;
  last_purge: string | null;
}

export class PurgeManager {
  private static instance: PurgeManager;

  private constructor() {}

  public static getInstance(): PurgeManager {
    if (!PurgeManager.instance) {
      PurgeManager.instance = new PurgeManager();
    }
    return PurgeManager.instance;
  }

  /**
   * Execute all purge policies
   */
  public async executePurgePolicies(): Promise<PurgeResult> {
    try {
      await auditLogger.logSecurityEvent({
        event_type: 'PURGE_EXECUTION_START',
        event_data: { initiated_by: 'purge_manager' },
        threat_level: 'low'
      });

      const { data, error } = await supabase.rpc('execute_purge_policies');

      if (error) {
        throw new Error(`Purge execution failed: ${error.message}`);
      }

      const result: PurgeResult = data;

      await auditLogger.logSecurityEvent({
        event_type: 'PURGE_EXECUTION_COMPLETE',
        event_data: {
          total_purged: result.total_purged,
          total_preserved: result.total_preserved,
          success: result.success
        },
        threat_level: result.errors.length > 0 ? 'medium' : 'low'
      });

      return result;
    } catch (error) {
      await auditLogger.logSecurityEvent({
        event_type: 'PURGE_EXECUTION_ERROR',
        event_data: {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        threat_level: 'high'
      });

      throw error;
    }
  }

  /**
   * Check what records are eligible for purging
   */
  public async checkPurgeEligibility(tableName?: string): Promise<PurgeEligibility[]> {
    try {
      const { data, error } = await supabase.rpc('check_purge_eligibility', {
        table_name_param: tableName || null
      });

      if (error) {
        throw new Error(`Failed to check purge eligibility: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Purge eligibility check failed:', error);
      throw error;
    }
  }

  /**
   * Get current purge status
   */
  public async getPurgeStatus(): Promise<PurgeStatus[]> {
    try {
      const { data, error } = await supabase
        .from('purge_status')
        .select('*')
        .order('table_name');

      if (error) {
        throw new Error(`Failed to get purge status: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Purge status fetch failed:', error);
      throw error;
    }
  }

  /**
   * Get all purge policies
   */
  public async getPurgePolicies(): Promise<PurgePolicy[]> {
    try {
      const { data, error } = await supabase
        .from('purge_policies')
        .select('*')
        .order('table_name');

      if (error) {
        throw new Error(`Failed to get purge policies: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Purge policies fetch failed:', error);
      throw error;
    }
  }

  /**
   * Update a purge policy
   */
  public async updatePurgePolicy(
    tableName: string,
    updates: Partial<Omit<PurgePolicy, 'id' | 'table_name'>>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('purge_policies')
        .update(updates)
        .eq('table_name', tableName);

      if (error) {
        throw new Error(`Failed to update purge policy: ${error.message}`);
      }

      await auditLogger.logSecurityEvent({
        event_type: 'PURGE_POLICY_UPDATED',
        event_data: {
          table_name: tableName,
          updates: updates
        },
        threat_level: 'low'
      });

      return true;
    } catch (error) {
      console.error('Purge policy update failed:', error);
      return false;
    }
  }

  /**
   * Enable or disable a purge policy
   */
  public async togglePurgePolicy(tableName: string, enabled: boolean): Promise<boolean> {
    return this.updatePurgePolicy(tableName, { enabled });
  }

  /**
   * Get preserved analytics data
   */
  public async getPreservedWorkflows(
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('opal_workflow_executions_preserved')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to get preserved workflows: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Preserved workflows fetch failed:', error);
      throw error;
    }
  }

  /**
   * Get preserved agent data
   */
  public async getPreservedAgents(
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('opal_agent_executions_preserved')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to get preserved agents: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Preserved agents fetch failed:', error);
      throw error;
    }
  }

  /**
   * Get analytics summary from preserved data
   */
  public async getAnalyticsSummary(days: number = 30): Promise<{
    workflow_analytics: any;
    agent_analytics: any;
    purge_analytics: any;
  }> {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Workflow analytics
      const { data: workflowData } = await supabase
        .from('opal_workflow_executions_preserved')
        .select('workflow_type, status, execution_time_ms, agent_count, created_at')
        .gte('created_at', since.toISOString());

      // Agent analytics
      const { data: agentData } = await supabase
        .from('opal_agent_executions_preserved')
        .select('agent_type, status, execution_time_ms, confidence_score, created_at')
        .gte('created_at', since.toISOString());

      // Purge analytics
      const { data: purgeData } = await supabase
        .from('supabase_audit_log')
        .select('new_data, created_at')
        .eq('operation', 'PURGE_EXECUTION')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false });

      return {
        workflow_analytics: this._analyzeWorkflows(workflowData || []),
        agent_analytics: this._analyzeAgents(agentData || []),
        purge_analytics: this._analyzePurgeHistory(purgeData || [])
      };
    } catch (error) {
      console.error('Analytics summary failed:', error);
      throw error;
    }
  }

  /**
   * Validate a workflow for customer references before storage
   */
  public async validateWorkflowForStorage(workflowData: {
    metadata?: any;
    input_data?: any;
    output_data?: any;
    error_details?: any;
  }): Promise<{
    can_store: boolean;
    requires_purge: boolean;
    customer_references_found: string[];
    recommendations: string[];
  }> {
    const customerPatterns = [
      'customer_id', 'user_id', 'email', 'external_id', 'client_id'
    ];

    const references: string[] = [];
    const dataText = JSON.stringify(workflowData);

    // Check for customer reference patterns
    for (const pattern of customerPatterns) {
      if (dataText.includes(pattern)) {
        references.push(pattern);
      }
    }

    // Check for email patterns
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    if (emailPattern.test(dataText)) {
      references.push('email_address');
    }

    const requiresPurge = references.length > 0;

    return {
      can_store: true, // Always allow storage, but flag for purging
      requires_purge: requiresPurge,
      customer_references_found: references,
      recommendations: requiresPurge
        ? [
            'This workflow contains customer references and will be purged according to retention policy',
            'Consider removing customer references before storage if possible',
            'Ensure analytics data is preserved in purged records'
          ]
        : ['Workflow appears compliant and will be retained according to policy']
    };
  }

  /**
   * Manual purge trigger with validation
   */
  public async manualPurge(
    tableName?: string,
    dryRun: boolean = true
  ): Promise<PurgeResult | { eligible_records: PurgeEligibility[] }> {
    if (dryRun) {
      const eligibility = await this.checkPurgeEligibility(tableName);
      return { eligible_records: eligibility };
    }

    await auditLogger.logSecurityEvent({
      event_type: 'MANUAL_PURGE_TRIGGERED',
      event_data: { table_name: tableName || 'all' },
      threat_level: 'medium'
    });

    return this.executePurgePolicies();
  }

  // Private helper methods

  private _analyzeWorkflows(workflows: any[]): any {
    if (workflows.length === 0) return { count: 0 };

    const statusCounts = workflows.reduce((acc, w) => {
      acc[w.status] = (acc[w.status] || 0) + 1;
      return acc;
    }, {});

    const typeCounts = workflows.reduce((acc, w) => {
      acc[w.workflow_type] = (acc[w.workflow_type] || 0) + 1;
      return acc;
    }, {});

    const avgExecutionTime = workflows
      .filter(w => w.execution_time_ms)
      .reduce((sum, w) => sum + w.execution_time_ms, 0) / workflows.length;

    return {
      count: workflows.length,
      status_breakdown: statusCounts,
      type_breakdown: typeCounts,
      avg_execution_time_ms: Math.round(avgExecutionTime || 0),
      avg_agent_count: Math.round(
        workflows.reduce((sum, w) => sum + (w.agent_count || 0), 0) / workflows.length
      )
    };
  }

  private _analyzeAgents(agents: any[]): any {
    if (agents.length === 0) return { count: 0 };

    const typeCounts = agents.reduce((acc, a) => {
      acc[a.agent_type] = (acc[a.agent_type] || 0) + 1;
      return acc;
    }, {});

    const statusCounts = agents.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});

    const avgConfidence = agents
      .filter(a => a.confidence_score !== null)
      .reduce((sum, a) => sum + parseFloat(a.confidence_score || 0), 0) / agents.length;

    return {
      count: agents.length,
      type_breakdown: typeCounts,
      status_breakdown: statusCounts,
      avg_confidence_score: Math.round((avgConfidence || 0) * 100) / 100
    };
  }

  private _analyzePurgeHistory(purgeEvents: any[]): any {
    return {
      total_purge_events: purgeEvents.length,
      total_records_purged: purgeEvents.reduce((sum, event) => {
        return sum + (event.new_data?.total_purged || 0);
      }, 0),
      total_records_preserved: purgeEvents.reduce((sum, event) => {
        return sum + (event.new_data?.total_preserved || 0);
      }, 0),
      last_purge: purgeEvents[0]?.created_at || null
    };
  }
}

// Export singleton instance and types
export const purgeManager = PurgeManager.getInstance();
export type { PurgeResult, PurgeEligibility, PurgeStatus, PurgePolicy };
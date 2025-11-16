/**
 * Automated Data Retention and Purging Manager
 * 
 * This module implements comprehensive data lifecycle management for OSA,
 * ensuring automatic cleanup of expired data while preserving critical
 * configuration and compliance audit trails.
 */

import { createSupabaseAdmin, handleDatabaseError } from './supabase-client';
import { supabaseGuardrails, DATA_GOVERNANCE_RULES, DataClassification } from './supabase-guardrails';

export interface RetentionPolicy {
  table: string;
  classification: DataClassification;
  retentionDays: number;
  dateColumn: 'created_at' | 'updated_at' | 'expires_at' | 'last_accessed_at';
  conditions?: Record<string, any>;
  cascadeDeletes?: Array<{
    table: string;
    foreignKey: string;
  }>;
  requiresBackup: boolean;
  purgeMethod: 'delete' | 'anonymize' | 'archive';
}

/**
 * Comprehensive retention policies for all OSA data types
 */
export const RETENTION_POLICIES: RetentionPolicy[] = [
  // Session and temporary data - 7 days
  {
    table: 'session_states',
    classification: 'temporary',
    retentionDays: 7,
    dateColumn: 'expires_at',
    requiresBackup: false,
    purgeMethod: 'delete'
  },
  {
    table: 'temporary_workflow_data',
    classification: 'temporary',
    retentionDays: 7,
    dateColumn: 'created_at',
    requiresBackup: false,
    purgeMethod: 'delete'
  },
  {
    table: 'cache_invalidation_queue',
    classification: 'temporary',
    retentionDays: 1,
    dateColumn: 'created_at',
    requiresBackup: false,
    purgeMethod: 'delete'
  },
  
  // Workflow execution logs - 90 days with anonymization
  {
    table: 'opal_workflow_executions',
    classification: 'metadata',
    retentionDays: 90,
    dateColumn: 'created_at',
    conditions: { status: 'completed' },
    requiresBackup: true,
    purgeMethod: 'anonymize',
    cascadeDeletes: [
      { table: 'opal_agent_executions', foreignKey: 'workflow_id' }
    ]
  },
  
  // Agent execution data - 60 days
  {
    table: 'opal_agent_executions',
    classification: 'metadata',
    retentionDays: 60,
    dateColumn: 'completed_at',
    conditions: { status: 'completed' },
    requiresBackup: false,
    purgeMethod: 'delete'
  },
  
  // Failed workflows - 30 days (shorter retention for failures)
  {
    table: 'opal_workflow_executions',
    classification: 'metadata',
    retentionDays: 30,
    dateColumn: 'failed_at',
    conditions: { status: 'failed' },
    requiresBackup: false,
    purgeMethod: 'delete'
  },
  
  // Audit logs - 2 years (compliance requirement)
  {
    table: 'supabase_audit_log',
    classification: 'metadata',
    retentionDays: 730,
    dateColumn: 'created_at',
    requiresBackup: true,
    purgeMethod: 'archive'
  },
  
  // Performance metrics - 365 days
  {
    table: 'performance_metrics',
    classification: 'anonymous_metrics',
    retentionDays: 365,
    dateColumn: 'created_at',
    requiresBackup: false,
    purgeMethod: 'delete'
  },
  
  // Webhook events - 30 days
  {
    table: 'webhook_events',
    classification: 'metadata',
    retentionDays: 30,
    dateColumn: 'created_at',
    requiresBackup: false,
    purgeMethod: 'delete'
  },
  
  // Background job logs - 14 days
  {
    table: 'background_job_logs',
    classification: 'metadata',
    retentionDays: 14,
    dateColumn: 'created_at',
    conditions: { status: 'completed' },
    requiresBackup: false,
    purgeMethod: 'delete'
  }
];

/**
 * Configuration data that should NEVER be purged
 */
export const PROTECTED_TABLES = [
  'opal_configurations',
  'opal_agent_configs',
  'opal_tool_registry',
  'opal_instructions',
  'system_settings',
  'user_preferences'
];

export interface PurgeResult {
  table: string;
  method: 'delete' | 'anonymize' | 'archive';
  recordsProcessed: number;
  recordsAffected: number;
  backupCreated: boolean;
  duration: number;
  errors: string[];
}

export interface PurgeSummary {
  executionId: string;
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  results: PurgeResult[];
  totalRecordsProcessed: number;
  totalRecordsAffected: number;
  errors: string[];
  backupsCreated: number;
}

export class DataRetentionManager {
  private supabase = createSupabaseAdmin();
  
  /**
   * Execute all retention policies
   */
  async executeRetentionPolicies(dryRun: boolean = false): Promise<PurgeSummary> {
    const executionId = `purge_${Date.now()}`;
    const startTime = new Date();
    const results: PurgeResult[] = [];
    const globalErrors: string[] = [];
    
    console.log(`Starting data retention execution (${dryRun ? 'DRY RUN' : 'LIVE'}): ${executionId}`);
    
    // Log purge operation start
    await this.logPurgeOperation('START', executionId, { dryRun });
    
    try {
      // Execute each retention policy
      for (const policy of RETENTION_POLICIES) {
        try {
          const result = await this.executeRetentionPolicy(policy, dryRun);
          results.push(result);
          
          console.log(`Policy executed for ${policy.table}: ${result.recordsAffected} records affected`);
          
        } catch (error) {
          const errorMessage = `Failed to execute policy for ${policy.table}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          globalErrors.push(errorMessage);
          console.error(errorMessage);
          
          // Add failed result
          results.push({
            table: policy.table,
            method: policy.purgeMethod,
            recordsProcessed: 0,
            recordsAffected: 0,
            backupCreated: false,
            duration: 0,
            errors: [errorMessage]
          });
        }
      }
      
      const endTime = new Date();
      const summary: PurgeSummary = {
        executionId,
        startTime,
        endTime,
        totalDuration: endTime.getTime() - startTime.getTime(),
        results,
        totalRecordsProcessed: results.reduce((sum, r) => sum + r.recordsProcessed, 0),
        totalRecordsAffected: results.reduce((sum, r) => sum + r.recordsAffected, 0),
        errors: globalErrors,
        backupsCreated: results.filter(r => r.backupCreated).length
      };
      
      // Log purge operation completion
      await this.logPurgeOperation('COMPLETE', executionId, summary);
      
      console.log(`Data retention execution completed: ${summary.totalRecordsAffected} records affected`);
      
      return summary;
      
    } catch (error) {
      await this.logPurgeOperation('ERROR', executionId, { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }
  
  /**
   * Execute a single retention policy
   */
  private async executeRetentionPolicy(policy: RetentionPolicy, dryRun: boolean): Promise<PurgeResult> {
    const startTime = performance.now();
    
    // Check if table is protected
    if (PROTECTED_TABLES.includes(policy.table)) {
      throw new Error(`Attempted to purge protected table: ${policy.table}`);
    }
    
    // Validate table exists
    const tableExists = await this.validateTableExists(policy.table);
    if (!tableExists) {
      console.warn(`Table ${policy.table} does not exist, skipping policy`);
      return {
        table: policy.table,
        method: policy.purgeMethod,
        recordsProcessed: 0,
        recordsAffected: 0,
        backupCreated: false,
        duration: 0,
        errors: ['Table does not exist']
      };
    }
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);
    
    // Build query conditions
    let query = this.supabase
      .from(policy.table)
      .select('*')
      .lt(policy.dateColumn, cutoffDate.toISOString());
    
    // Add additional conditions
    if (policy.conditions) {
      Object.entries(policy.conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    const { data: recordsToProcess, error: selectError } = await query;
    
    if (selectError) {
      throw new Error(`Failed to query records for ${policy.table}: ${selectError.message}`);
    }
    
    const recordsProcessed = recordsToProcess?.length || 0;
    
    if (recordsProcessed === 0) {
      return {
        table: policy.table,
        method: policy.purgeMethod,
        recordsProcessed: 0,
        recordsAffected: 0,
        backupCreated: false,
        duration: performance.now() - startTime,
        errors: []
      };
    }
    
    let recordsAffected = 0;
    let backupCreated = false;
    const errors: string[] = [];

    if (dryRun) {
      console.log(`[DRY RUN] Would process ${recordsProcessed} records from ${policy.table}`);
      recordsAffected = recordsProcessed;
    } else {
      // Create backup if required
      if (policy.requiresBackup) {
        try {
          await this.createBackup(policy.table, recordsToProcess);
          backupCreated = true;
        } catch (error) {
          errors.push(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Don't proceed with deletion if backup fails
          throw new Error(`Backup required but failed for ${policy.table}`);
        }
      }

      // Execute purge method
      switch (policy.purgeMethod) {
        case 'delete':
          recordsAffected = await this.executeDelete(policy, cutoffDate);
          break;

        case 'anonymize':
          recordsAffected = await this.executeAnonymize(policy, cutoffDate);
          break;

        case 'archive':
          recordsAffected = await this.executeArchive(policy, cutoffDate);
          break;

        default:
          throw new Error(`Unknown purge method: ${policy.purgeMethod}`);
      }
    }

    return {
      table: policy.table,
      method: policy.purgeMethod,
      recordsProcessed,
      recordsAffected,
      backupCreated,
      duration: performance.now() - startTime,
      errors
    };
  }
}
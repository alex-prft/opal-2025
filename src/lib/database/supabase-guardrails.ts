/**
 * Supabase Data Guardrails and Governance System
 * 
 * This module implements comprehensive data governance for OSA's Supabase usage,
 * ensuring compliance with PII protection requirements and data retention policies.
 */

import { createSupabaseAdmin } from './supabase-client';
import type { Database } from '@/lib/types/database';

// Data classification types
export type DataClassification = 'configuration' | 'metadata' | 'anonymous_metrics' | 'temporary' | 'restricted';

export interface DataGovernanceRule {
  classification: DataClassification;
  allowedOperations: ('read' | 'write' | 'update' | 'delete')[];
  retentionDays?: number;
  requiresAudit: boolean;
  piiScanRequired: boolean;
  allowedTables: string[];
}

// Comprehensive data governance configuration
export const DATA_GOVERNANCE_RULES: Record<DataClassification, DataGovernanceRule> = {
  configuration: {
    classification: 'configuration',
    allowedOperations: ['read', 'write', 'update'],
    requiresAudit: true,
    piiScanRequired: false,
    allowedTables: [
      'opal_configurations',
      'opal_agent_configs',
      'opal_tool_registry',
      'opal_instructions',
      'system_settings'
    ]
  },
  metadata: {
    classification: 'metadata',
    allowedOperations: ['read', 'write', 'update', 'delete'],
    retentionDays: 365, // Keep metadata for 1 year
    requiresAudit: true,
    piiScanRequired: true,
    allowedTables: [
      'opal_workflow_executions',
      'opal_agent_executions', 
      'workflow_metadata',
      'agent_performance_metrics'
    ]
  },
  anonymous_metrics: {
    classification: 'anonymous_metrics',
    allowedOperations: ['read', 'write'],
    requiresAudit: false,
    piiScanRequired: false,
    allowedTables: [
      'anonymous_usage_metrics',
      'performance_analytics',
      'system_health_metrics',
      'aggregated_insights'
    ]
  },
  temporary: {
    classification: 'temporary',
    allowedOperations: ['read', 'write', 'delete'],
    retentionDays: 7, // Temporary data cleaned up weekly
    requiresAudit: true,
    piiScanRequired: true,
    allowedTables: [
      'session_states',
      'temporary_workflow_data',
      'cache_invalidation_queue'
    ]
  },
  restricted: {
    classification: 'restricted',
    allowedOperations: [], // No direct operations allowed
    requiresAudit: true,
    piiScanRequired: true,
    allowedTables: [] // Restricted data should not be in Supabase
  }
};

/**
 * PII Detection Patterns
 * Comprehensive patterns to detect various types of PII
 */
export const PII_DETECTION_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
  phone: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  ipAddress: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
  name: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Simple name pattern
  address: /\b\d+\s+[A-Z][a-z]+\s+(St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard)\b/gi
};

export class SupabaseGuardrailsManager {
  private supabase = createSupabaseAdmin();
  
  /**
   * Validates data before Supabase operations
   */
  async validateDataOperation(
    table: string,
    operation: 'read' | 'write' | 'update' | 'delete',
    data?: any,
    classification?: DataClassification
  ): Promise<{ allowed: boolean; reason?: string; sanitizedData?: any }> {
    try {
      // Determine data classification if not provided
      const dataClass = classification || this.classifyTable(table);
      const rules = DATA_GOVERNANCE_RULES[dataClass];
      
      // Check if operation is allowed for this classification
      if (!rules.allowedOperations.includes(operation)) {
        return {
          allowed: false,
          reason: `Operation '${operation}' not allowed for ${dataClass} data`
        };
      }
      
      // Check if table is allowed for this classification
      if (!rules.allowedTables.includes(table)) {
        return {
          allowed: false,
          reason: `Table '${table}' not allowed for ${dataClass} data classification`
        };
      }
      
      // PII scan if required
      if (rules.piiScanRequired && data) {
        const piiScanResult = await this.scanForPII(data);
        if (piiScanResult.hasPII) {
          await this.logPIIViolation(table, operation, piiScanResult);
          return {
            allowed: false,
            reason: `PII detected: ${piiScanResult.detectedTypes.join(', ')}`
          };
        }
      }
      
      // Audit logging if required
      if (rules.requiresAudit) {
        await this.logDataAccess(table, operation, dataClass);
      }
      
      return { allowed: true, sanitizedData: data };
      
    } catch (error) {
      console.error('Guardrails validation error:', error);
      return {
        allowed: false,
        reason: 'Validation system error - defaulting to deny'
      };
    }
  }
  
  /**
   * Classifies table based on naming patterns and known schemas
   */
  private classifyTable(table: string): DataClassification {
    if (table.includes('config') || table.includes('settings') || table.includes('agent_configs')) {
      return 'configuration';
    }
    if (table.includes('metrics') || table.includes('anonymous') || table.includes('aggregated')) {
      return 'anonymous_metrics';
    }
    if (table.includes('session') || table.includes('temporary') || table.includes('cache')) {
      return 'temporary';
    }
    if (table.includes('execution') || table.includes('workflow') || table.includes('metadata')) {
      return 'metadata';
    }
    
    // Default to metadata for unknown tables (safer)
    return 'metadata';
  }
  
  /**
   * Comprehensive PII detection
   */
  async scanForPII(data: any): Promise<{
    hasPII: boolean;
    detectedTypes: string[];
    violations: Array<{ field: string; type: string; value: string }>;
  }> {
    const violations: Array<{ field: string; type: string; value: string }> = [];
    
    const scanObject = (obj: any, path = ''): void => {
      if (typeof obj === 'string') {
        this.scanStringForPII(obj, path, violations);
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => scanObject(item, `${path}[${index}]`));
      } else if (obj && typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => {
          scanObject(value, path ? `${path}.${key}` : key);
        });
      }
    };
    
    scanObject(data);
    
    const detectedTypes = [...new Set(violations.map(v => v.type))];
    
    return {
      hasPII: violations.length > 0,
      detectedTypes,
      violations
    };
  }
  
  /**
   * Scans individual strings for PII patterns
   */
  private scanStringForPII(
    text: string,
    fieldPath: string,
    violations: Array<{ field: string; type: string; value: string }>
  ): void {
    Object.entries(PII_DETECTION_PATTERNS).forEach(([type, pattern]) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          violations.push({
            field: fieldPath,
            type,
            value: this.maskSensitiveValue(match, type)
          });
        });
      }
    });
  }
  
  /**
   * Masks sensitive values for logging
   */
  private maskSensitiveValue(value: string, type: string): string {
    switch (type) {
      case 'email':
        const [local, domain] = value.split('@');
        return `${local.charAt(0)}***@${domain}`;
      case 'phone':
        return `***-***-${value.slice(-4)}`;
      case 'ssn':
        return `***-**-${value.slice(-4)}`;
      case 'creditCard':
        return `****-****-****-${value.slice(-4)}`;
      default:
        return `${value.substring(0, 2)}***`;
    }
  }
  
  /**
   * Logs PII violations for audit and compliance
   */
  private async logPIIViolation(
    table: string,
    operation: string,
    scanResult: { detectedTypes: string[]; violations: any[] }
  ): Promise<void> {
    try {
      await this.supabase
        .from('supabase_audit_log')
        .insert({
          event_type: 'PII_VIOLATION',
          table_name: table,
          operation,
          details: {
            detected_pii_types: scanResult.detectedTypes,
            violation_count: scanResult.violations.length,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log PII violation:', error);
      // Fail silently to prevent data operation interruption
      // But ensure this is monitored in production
    }
  }
  
  /**
   * Logs data access for audit trails
   */
  private async logDataAccess(
    table: string,
    operation: string,
    classification: DataClassification
  ): Promise<void> {
    try {
      await this.supabase
        .from('supabase_audit_log')
        .insert({
          event_type: 'DATA_ACCESS',
          table_name: table,
          operation,
          details: {
            data_classification: classification,
            timestamp: new Date().toISOString(),
            source: 'guardrails_system'
          },
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log data access:', error);
    }
  }
  
  /**
   * Implements automatic data purging based on retention policies
   */
  async executePurgePolicies(): Promise<{
    purged: Record<string, number>;
    errors: string[];
  }> {
    const results: Record<string, number> = {};
    const errors: string[] = [];
    
    for (const [classification, rules] of Object.entries(DATA_GOVERNANCE_RULES)) {
      if (!rules.retentionDays) continue;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - rules.retentionDays);
      
      for (const table of rules.allowedTables) {
        try {
          // Check if table has created_at or updated_at columns
          const { data: tableInfo } = await this.supabase
            .rpc('get_table_columns', { table_name: table });
          
          const hasCreatedAt = tableInfo?.some((col: any) => col.column_name === 'created_at');
          const hasUpdatedAt = tableInfo?.some((col: any) => col.column_name === 'updated_at');
          
          if (hasCreatedAt || hasUpdatedAt) {
            const dateColumn = hasUpdatedAt ? 'updated_at' : 'created_at';
            
            const { data: deletedRows, error } = await this.supabase
              .from(table)
              .delete()
              .lt(dateColumn, cutoffDate.toISOString())
              .select('count');
            
            if (error) {
              errors.push(`${table}: ${error.message}`);
            } else {
              results[table] = deletedRows?.length || 0;
            }
          }
        } catch (error) {
          errors.push(`${table}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
    
    // Log purge operation
    await this.logDataAccess('system_purge', 'delete', 'metadata');
    
    return { purged: results, errors };
  }
  
  /**
   * Creates database policies for schema-level protection
   */
  async createSchemaValidationPolicies(): Promise<void> {
    const policies = [
      // PII prevention policy
      `
        CREATE OR REPLACE FUNCTION prevent_pii_insertion()
        RETURNS TRIGGER AS $$
        DECLARE
            data_text TEXT;
            pii_patterns TEXT[] := ARRAY[
                '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
                '\\d{3}-?\\d{2}-?\\d{4}',
                '(?:\\+?1[-\\.\\s]?)?\\(?([0-9]{3})\\)?[-\\.\\s]?([0-9]{3})[-\\.\\s]?([0-9]{4})'
            ];
            pattern TEXT;
        BEGIN
            -- Convert row to JSON text for scanning
            data_text := row_to_json(NEW)::TEXT;
            
            -- Check against PII patterns
            FOREACH pattern IN ARRAY pii_patterns
            LOOP
                IF data_text ~* pattern THEN
                    RAISE EXCEPTION 'PII_VIOLATION: Potential PII detected in data: %', 
                        substring(data_text from pattern);
                END IF;
            END LOOP;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `,
      
      // Data classification enforcement
      `
        CREATE OR REPLACE FUNCTION enforce_data_classification()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Check if operation is allowed based on table classification
            IF TG_TABLE_NAME = ANY(ARRAY['customer_data', 'personal_info', 'pii_data']) THEN
                RAISE EXCEPTION 'RESTRICTED_TABLE: Direct access to % not allowed', TG_TABLE_NAME;
            END IF;
            
            RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql;
      `,
      
      // Session token expiration
      `
        CREATE OR REPLACE FUNCTION expire_session_tokens()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Automatically set expiration for session tokens
            IF TG_TABLE_NAME = 'session_states' AND NEW.expires_at IS NULL THEN
                NEW.expires_at := NOW() + INTERVAL '24 hours';
            END IF;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    ];
    
    for (const policy of policies) {
      try {
        await this.supabase.rpc('execute_sql', { sql: policy });
      } catch (error) {
        console.error('Failed to create schema policy:', error);
      }
    }
  }
}

// Export singleton instance
export const supabaseGuardrails = new SupabaseGuardrailsManager();
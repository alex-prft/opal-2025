// OPAL Governance Integration
// Automatically integrates data governance features into OPAL workflow processing

import { PIIScanner, PIIScanResult } from '@/lib/security/pii-scanner';
import { auditLogger } from '@/lib/security/audit-logger';
import { purgeManager } from '@/lib/security/purge-manager';
import { sessionManager } from '@/lib/security/session-manager';

export interface OPALWorkflowData {
  workflow_id: string;
  workflow_type: string;
  agent_type?: string;
  input_data?: any;
  output_data?: any;
  metadata?: any;
  error_details?: any;
}

export interface GovernanceValidationResult {
  can_proceed: boolean;
  violations: any[];
  warnings: string[];
  purge_scheduled: boolean;
  session_validated: boolean;
  audit_logged: boolean;
}

export class OPALGovernanceIntegrator {
  private static instance: OPALGovernanceIntegrator;
  private isEnabled: boolean;

  private constructor() {
    this.isEnabled = process.env.DATA_GOVERNANCE_ENABLED === 'true';
  }

  public static getInstance(): OPALGovernanceIntegrator {
    if (!OPALGovernanceIntegrator.instance) {
      OPALGovernanceIntegrator.instance = new OPALGovernanceIntegrator();
    }
    return OPALGovernanceIntegrator.instance;
  }

  /**
   * Validate OPAL workflow before processing
   */
  public async validateWorkflow(workflowData: OPALWorkflowData): Promise<GovernanceValidationResult> {
    const result: GovernanceValidationResult = {
      can_proceed: true,
      violations: [],
      warnings: [],
      purge_scheduled: false,
      session_validated: false,
      audit_logged: false
    };

    if (!this.isEnabled) {
      result.warnings.push('Data governance is disabled');
      return result;
    }

    try {
      // Step 1: PII Scanning
      if (process.env.PII_SCANNING_ENABLED === 'true') {
        const piiValidation = PIIScanner.validateWorkflowData({
          metadata: workflowData.metadata,
          input_data: workflowData.input_data,
          output_data: workflowData.output_data,
          error_details: workflowData.error_details
        });

        if (!piiValidation.isValid) {
          result.violations = piiValidation.violations;

          // Block critical violations
          const criticalViolations = piiValidation.blockers;
          if (criticalViolations.length > 0) {
            result.can_proceed = false;

            await auditLogger.logPIIViolation({
              violation_data: {
                violations: criticalViolations.map(v => ({
                  type: v.type,
                  field: v.field_path,
                  severity: v.severity
                })),
                table: 'opal_workflows',
                operation: 'WORKFLOW_VALIDATION'
              },
              severity: 'critical',
              table_context: workflowData.workflow_type
            });

            return result;
          }

          // Log non-critical violations
          if (piiValidation.violations.length > 0) {
            await auditLogger.logPIIViolation({
              violation_data: {
                violations: piiValidation.violations.map(v => ({
                  type: v.type,
                  field: v.field_path,
                  severity: v.severity
                })),
                table: 'opal_workflows',
                operation: 'WORKFLOW_VALIDATION'
              },
              severity: 'medium',
              table_context: workflowData.workflow_type
            });

            result.warnings.push('PII violations detected - workflow will be purged automatically');
          }
        }
      }

      // Step 2: Check if workflow needs to be scheduled for purging
      if (process.env.WORKFLOW_PURGING_ENABLED === 'true') {
        const purgeValidation = await purgeManager.validateWorkflowForStorage(workflowData);

        if (purgeValidation.requires_purge) {
          result.purge_scheduled = true;
          result.warnings.push(...purgeValidation.recommendations);
        }
      }

      // Step 3: Audit logging
      if (process.env.AUDIT_LOGGING_ENABLED === 'true') {
        await auditLogger.logAuditEvent({
          table_name: 'opal_workflow_executions',
          operation: 'WORKFLOW_VALIDATION',
          new_data: {
            workflow_id: workflowData.workflow_id,
            workflow_type: workflowData.workflow_type,
            agent_type: workflowData.agent_type,
            has_violations: result.violations.length > 0,
            purge_scheduled: result.purge_scheduled,
            validation_result: result.can_proceed ? 'APPROVED' : 'BLOCKED'
          },
          threat_level: result.violations.length > 0 ? 'medium' : 'low',
          audit_category: 'data_change',
          compliance_status: result.violations.length === 0 ? 'compliant' : 'review_needed'
        });

        result.audit_logged = true;
      }

      return result;

    } catch (error) {
      console.error('Governance validation error:', error);

      result.warnings.push(`Governance validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // Log the validation error
      await auditLogger.logSecurityEvent({
        event_type: 'GOVERNANCE_VALIDATION_ERROR',
        event_data: {
          workflow_id: workflowData.workflow_id,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        threat_level: 'high'
      });

      return result;
    }
  }

  /**
   * Process OPAL workflow with governance integration
   */
  public async processWorkflow(
    workflowData: OPALWorkflowData,
    processingFunction: (data: OPALWorkflowData) => Promise<any>
  ): Promise<any> {
    if (!this.isEnabled) {
      return await processingFunction(workflowData);
    }

    const startTime = Date.now();

    try {
      // Pre-processing validation
      const validationResult = await this.validateWorkflow(workflowData);

      if (!validationResult.can_proceed) {
        throw new Error(`Workflow blocked due to governance violations: ${
          validationResult.violations.map(v => v.type).join(', ')
        }`);
      }

      // Process the workflow
      const result = await processingFunction(workflowData);

      // Post-processing governance actions
      await this.postProcessWorkflow(workflowData, result, validationResult, startTime);

      return result;

    } catch (error) {
      // Log processing errors
      await auditLogger.logSecurityEvent({
        event_type: 'WORKFLOW_PROCESSING_ERROR',
        event_data: {
          workflow_id: workflowData.workflow_id,
          workflow_type: workflowData.workflow_type,
          error: error instanceof Error ? error.message : 'Unknown error',
          execution_time_ms: Date.now() - startTime
        },
        threat_level: 'medium'
      });

      throw error;
    }
  }

  /**
   * Post-process workflow for governance compliance
   */
  private async postProcessWorkflow(
    workflowData: OPALWorkflowData,
    result: any,
    validationResult: GovernanceValidationResult,
    startTime: number
  ): Promise<void> {
    const executionTime = Date.now() - startTime;

    try {
      // Scan output data for PII
      if (result && process.env.PII_SCANNING_ENABLED === 'true') {
        const outputScan = PIIScanner.scanData(result, 'workflow_output');

        if (!outputScan.is_compliant) {
          await auditLogger.logPIIViolation({
            violation_data: {
              violations: outputScan.violations.map(v => ({
                type: v.type,
                field: v.field_path,
                severity: v.severity
              })),
              table: 'opal_workflow_output',
              operation: 'OUTPUT_SCAN'
            },
            severity: 'medium',
            table_context: workflowData.workflow_type
          });
        }
      }

      // Log successful completion
      await auditLogger.logAuditEvent({
        table_name: 'opal_workflow_executions',
        operation: 'WORKFLOW_COMPLETED',
        new_data: {
          workflow_id: workflowData.workflow_id,
          workflow_type: workflowData.workflow_type,
          execution_time_ms: executionTime,
          validation_warnings: validationResult.warnings.length,
          purge_scheduled: validationResult.purge_scheduled,
          output_scanned: process.env.PII_SCANNING_ENABLED === 'true'
        },
        audit_category: 'data_change',
        compliance_status: validationResult.violations.length === 0 ? 'compliant' : 'review_needed'
      });

    } catch (error) {
      console.error('Post-processing governance error:', error);
    }
  }

  /**
   * Create governance-aware OPAL agent wrapper
   */
  public wrapOPALAgent<T extends (...args: any[]) => Promise<any>>(
    agentFunction: T,
    agentType: string
  ): T {
    return (async (...args: any[]) => {
      if (!this.isEnabled) {
        return await agentFunction(...args);
      }

      const workflowData: OPALWorkflowData = {
        workflow_id: crypto.randomUUID(),
        workflow_type: 'agent_execution',
        agent_type,
        input_data: args[0],
        metadata: { agent_type, timestamp: new Date().toISOString() }
      };

      return await this.processWorkflow(workflowData, async () => {
        return await agentFunction(...args);
      });
    }) as T;
  }

  /**
   * Initialize governance for existing OPAL services
   */
  public async initializeGovernanceIntegration(): Promise<void> {
    if (!this.isEnabled) {
      console.log('📝 [Governance] Data governance disabled, skipping integration');
      return;
    }

    try {
      console.log('🔒 [Governance] Initializing OPAL governance integration...');

      // Test system health
      const health = await auditLogger.getHealthMetrics();
      if (health) {
        console.log('✅ [Governance] Audit system operational');
      }

      // Test PII scanner
      const testScan = PIIScanner.scanText('test data', 'initialization_test');
      console.log('✅ [Governance] PII scanner operational');

      // Test purge system
      const purgeStatus = await purgeManager.getPurgeStatus();
      console.log('✅ [Governance] Purge system operational');

      // Log initialization
      await auditLogger.logSecurityEvent({
        event_type: 'GOVERNANCE_SYSTEM_INITIALIZED',
        event_data: {
          features_enabled: {
            pii_scanning: process.env.PII_SCANNING_ENABLED === 'true',
            audit_logging: process.env.AUDIT_LOGGING_ENABLED === 'true',
            workflow_purging: process.env.WORKFLOW_PURGING_ENABLED === 'true',
            session_auditing: process.env.SESSION_AUDIT_ENABLED === 'true'
          },
          initialization_time: new Date().toISOString()
        },
        threat_level: 'low'
      });

      console.log('🎉 [Governance] OPAL governance integration completed successfully');

    } catch (error) {
      console.error('❌ [Governance] Integration failed:', error);
      throw error;
    }
  }

  /**
   * Create session with governance audit
   */
  public async createGovernedSession(
    userId: string,
    sessionType: 'admin' | 'workflow' | 'api',
    clientIP: string,
    userAgent: string,
    tokens: any
  ): Promise<string> {
    if (!process.env.SESSION_AUDIT_ENABLED === true) {
      // Fallback to basic session creation if auditing disabled
      return crypto.randomUUID();
    }

    return await sessionManager.createSession(
      userId,
      sessionType,
      clientIP,
      userAgent,
      tokens
    );
  }

  /**
   * Get governance status for monitoring
   */
  public async getGovernanceStatus(): Promise<{
    enabled: boolean;
    features: Record<string, boolean>;
    health: any;
    compliance_rating: string;
  }> {
    const features = {
      data_governance: this.isEnabled,
      pii_scanning: process.env.PII_SCANNING_ENABLED === 'true',
      audit_logging: process.env.AUDIT_LOGGING_ENABLED === 'true',
      workflow_purging: process.env.WORKFLOW_PURGING_ENABLED === 'true',
      session_auditing: process.env.SESSION_AUDIT_ENABLED === 'true'
    };

    const enabledCount = Object.values(features).filter(Boolean).length;
    const totalCount = Object.keys(features).length;
    const compliancePercentage = (enabledCount / totalCount) * 100;

    let complianceRating = 'Needs Improvement';
    if (compliancePercentage >= 100) complianceRating = 'Excellent';
    else if (compliancePercentage >= 75) complianceRating = 'Good';
    else if (compliancePercentage >= 50) complianceRating = 'Fair';

    const health = this.isEnabled ? await auditLogger.getHealthMetrics() : null;

    return {
      enabled: this.isEnabled,
      features,
      health,
      compliance_rating: complianceRating
    };
  }
}

// Export singleton instance
export const opalGovernance = OPALGovernanceIntegrator.getInstance();

// Convenience functions for easy integration
export const validateOPALWorkflow = (data: OPALWorkflowData) =>
  opalGovernance.validateWorkflow(data);

export const processOPALWorkflow = (data: OPALWorkflowData, processor: any) =>
  opalGovernance.processWorkflow(data, processor);

export const wrapOPALAgent = <T extends (...args: any[]) => Promise<any>>(
  agentFunction: T,
  agentType: string
): T => opalGovernance.wrapOPALAgent(agentFunction, agentType);

export const initializeOPALGovernance = () =>
  opalGovernance.initializeGovernanceIntegration();
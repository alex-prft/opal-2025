/**
 * OPAL Integration Validator Client
 * 
 * This module provides client-side utilities for triggering and monitoring
 * the OPAL integration validation pipeline. It serves as the interface between
 * the Next.js application and the Cloud Code validation agents.
 */

export interface ValidationTriggerInput {
  forceSyncWorkflowId: string;
  opalCorrelationId?: string;
  tenantId?: string;
}

export interface ValidationResult {
  success: boolean;
  validationId?: string;
  overallStatus?: 'green' | 'red' | 'yellow';
  summary?: string;
  errors?: string[];
}

export interface IntegrationHealthMetrics {
  forceSync: {
    lastAt: string | null;
    status: string | null;
    agentCount: number | null;
  };
  opal: {
    workflowStatus: string | null;
    agentResponseCount: number;
    agentStatuses: Record<string, string>;
  };
  osa: {
    receptionRate: number;
    lastWebhookAt: string | null;
    workflowData: any;
  };
  health: {
    overallStatus: string | null;
    signatureValidRate: number;
    errorRate24h: number;
  };
}

/**
 * Main client class for OPAL integration validation
 */
export class OpalIntegrationValidator {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    this.apiKey = apiKey;
  }

  /**
   * Trigger comprehensive validation for a Force Sync workflow
   */
  async validateWorkflow(input: ValidationTriggerInput): Promise<ValidationResult> {
    try {
      // First, collect current health metrics
      const healthMetrics = await this.collectHealthMetrics(input.forceSyncWorkflowId);
      
      // Analyze the metrics and determine overall status
      const validationResult = this.analyzeHealthMetrics(healthMetrics, input);
      
      // Store the validation result
      await this.storeValidationResult(input, validationResult, healthMetrics);
      
      return {
        success: true,
        validationId: `val_${Date.now()}`,
        overallStatus: validationResult.overallStatus,
        summary: validationResult.summary
      };
    } catch (error: any) {
      console.error('Validation failed:', error);
      return {
        success: false,
        errors: [error.message || 'Unknown validation error']
      };
    }
  }

  /**
   * Collect health metrics from all pipeline layers
   */
  private async collectHealthMetrics(forceSyncWorkflowId: string): Promise<IntegrationHealthMetrics> {
    const [recentStatus, stats, health] = await Promise.all([
      this.fetchJson(`/api/admin/osa/recent-status`),
      this.fetchJson(`/api/webhook-events/stats?hours=24&workflowId=${encodeURIComponent(forceSyncWorkflowId)}`),
      this.fetchJson(`/api/opal/health-with-fallback`)
    ]);

    return {
      forceSync: {
        lastAt: stats.forceSync?.lastForceSync || recentStatus.lastForceSyncAt || null,
        status: stats.workflowStatus || recentStatus.lastWorkflowStatus || null,
        agentCount: stats.forceSync?.forceSyncAgentCount || null
      },
      opal: {
        workflowStatus: stats.workflowStatus || 'unknown',
        agentResponseCount: stats.workflowAnalysis?.agentResponseCount || 0,
        agentStatuses: stats.agentStatuses || {}
      },
      osa: {
        receptionRate: stats.osaWorkflowData?.dataReceptionRate || 0,
        lastWebhookAt: recentStatus.lastWebhookAt || null,
        workflowData: stats.osaWorkflowData || {}
      },
      health: {
        overallStatus: health.overall_status || null,
        signatureValidRate: health.signature_valid_rate || 0,
        errorRate24h: health.error_rate_24h || 0
      }
    };
  }

  /**
   * Analyze health metrics and determine validation status
   */
  private analyzeHealthMetrics(
    metrics: IntegrationHealthMetrics, 
    input: ValidationTriggerInput
  ): { overallStatus: 'green' | 'red' | 'yellow'; summary: string; errors: any } {
    const errors: any = {
      forceSyncIssues: [],
      opalIssues: [],
      osaIssues: [],
      healthIssues: []
    };

    // Analyze Force Sync layer
    if (!metrics.forceSync.status || metrics.forceSync.status === 'failed') {
      errors.forceSyncIssues.push('Force Sync workflow failed or status unknown');
    }

    // Analyze OPAL layer
    const failedAgents = Object.entries(metrics.opal.agentStatuseses || {})
      .filter(([agent, status]) => status === 'failed')
      .map(([agent]) => agent);
    
    if (failedAgents.length > 0) {
      errors.opalIssues.push(`Failed agents: ${failedAgents.join(', ')}`);
    }

    // Analyze OSA layer
    if (metrics.osa.receptionRate < 0.5) {
      errors.osaIssues.push(`Low OSA reception rate: ${(metrics.osa.receptionRate * 100).toFixed(0)}%`);
    }

    // Analyze Health layer
    if (metrics.health.errorRate24h > 0.1) {
      errors.healthIssues.push(`High error rate: ${(metrics.health.errorRate24h * 100).toFixed(1)}%`);
    }

    if (metrics.health.signatureValidRate < 0.9) {
      errors.healthIssues.push(`Low signature validation rate: ${(metrics.health.signatureValidRate * 100).toFixed(0)}%`);
    }

    // Determine overall status
    const hasRedIssues = 
      errors.forceSyncIssues.length > 0 ||
      failedAgents.length > 2 ||
      metrics.osa.receptionRate < 0.3 ||
      metrics.health.errorRate24h > 0.2;

    const hasYellowIssues = 
      failedAgents.length > 0 ||
      metrics.osa.receptionRate < 0.8 ||
      metrics.health.signatureValidRate < 0.9;

    let overallStatus: 'green' | 'red' | 'yellow';
    let summary: string;

    if (hasRedIssues) {
      overallStatus = 'red';
      summary = 'Critical issues detected in OPAL ↔ OSA integration. Immediate attention required.';
    } else if (hasYellowIssues) {
      overallStatus = 'yellow';
      summary = 'Force Sync pipeline is mostly healthy but some components are below optimal thresholds.';
    } else {
      overallStatus = 'green';
      summary = 'Force Sync, OPAL agents, OSA ingestion, and results layer are all healthy.';
    }

    return { overallStatus, summary, errors };
  }

  /**
   * Store validation result in the database
   */
  private async storeValidationResult(
    input: ValidationTriggerInput,
    validationResult: { overallStatus: 'green' | 'red' | 'yellow'; summary: string; errors: any },
    healthMetrics: IntegrationHealthMetrics
  ): Promise<void> {
    const payload = {
      tenantId: input.tenantId,
      forceSyncWorkflowId: input.forceSyncWorkflowId,
      opalCorrelationId: input.opalCorrelationId,
      overallStatus: validationResult.overallStatus,
      summary: validationResult.summary,
      forceSyncData: healthMetrics.forceSync,
      opalData: healthMetrics.opal,
      osaData: healthMetrics.osa,
      healthData: healthMetrics.health,
      errors: validationResult.errors
    };

    await this.fetchJson('/api/admin/osa/integration-status', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Get the latest validation status for a workflow
   */
  async getValidationStatus(forceSyncWorkflowId: string): Promise<any> {
    return this.fetchJson(`/api/admin/osa/integration-status?forceSyncWorkflowId=${encodeURIComponent(forceSyncWorkflowId)}`);
  }

  /**
   * Get validation history for a tenant
   */
  async getValidationHistory(tenantId?: string, limit: number = 10): Promise<any> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (tenantId) {
      params.append('tenantId', tenantId);
    }
    return this.fetchJson(`/api/admin/osa/integration-status?${params.toString()}`);
  }

  /**
   * Helper method for API calls
   */
  private async fetchJson(url: string, options?: RequestInit): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {})
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // Ensure we have a proper URL - use localhost for server-side calls
    const fullUrl = url.startsWith('http') 
      ? url 
      : `${this.baseUrl || 'http://localhost:3000'}${url}`;

    const response = await fetch(fullUrl, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status} ${response.statusText}: ${errorText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Expected JSON response, got ${contentType}`);
    }

    return response.json();
  }
}

/**
 * Default validator instance
 */
export const integrationValidator = new OpalIntegrationValidator();

/**
 * Convenience functions for common operations
 */
export async function validateForceSyncWorkflow(
  forceSyncWorkflowId: string,
  opalCorrelationId?: string,
  tenantId?: string
): Promise<ValidationResult> {
  return integrationValidator.validateWorkflow({
    forceSyncWorkflowId,
    opalCorrelationId,
    tenantId
  });
}

export async function getWorkflowValidationStatus(forceSyncWorkflowId: string) {
  return integrationValidator.getValidationStatus(forceSyncWorkflowId);
}

export async function getTenantValidationHistory(tenantId?: string, limit: number = 10) {
  return integrationValidator.getValidationHistory(tenantId, limit);
}

/**
 * React hook for triggering validation
 * Safe for static generation - checks React availability before using hooks
 */
export function useValidationTrigger() {
  // During static generation, React can be null, so check before using hooks
  if (!React || typeof React.useState !== 'function') {
    // Return safe fallback during static generation
    return {
      triggerValidation: async (input: ValidationTriggerInput) => ({ success: false, errors: ['Hook unavailable during static generation'] }),
      isValidating: false,
      lastResult: null
    };
  }

  const [isValidating, setIsValidating] = React.useState(false);
  const [lastResult, setLastResult] = React.useState<ValidationResult | null>(null);

  const triggerValidation = async (input: ValidationTriggerInput) => {
    setIsValidating(true);
    try {
      const result = await integrationValidator.validateWorkflow(input);
      setLastResult(result);
      return result;
    } finally {
      setIsValidating(false);
    }
  };

  return {
    triggerValidation,
    isValidating,
    lastResult
  };
}

// Import React for the hook
import React from 'react';
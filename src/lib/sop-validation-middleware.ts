/**
 * SOP Validation Middleware
 *
 * Ensures compliance with OSA Content Generation SOP v2.0
 * - Blocks mock data in production
 * - Validates agent source attribution
 * - Enforces pageId format standards
 * - Tracks SOP compliance metrics
 */

// SOP-defined valid OPAL agent sources
const VALID_OPAL_AGENTS = [
  'strategy_workflow',
  'roadmap_generator',
  'content_review',
  'audience_suggester',
  'geo_audit',
  'experiment_blueprinter',
  'personalization_idea_generator',
  'customer_journey',
  'integration_health',
  'cmp_organizer'
] as const;

type ValidOPALAgent = typeof VALID_OPAL_AGENTS[number];

// SOP violation types and severity levels
export interface SOPViolation {
  type: 'MOCK_DATA_DETECTED' | 'INVALID_AGENT_SOURCE' | 'INVALID_PAGEID_FORMAT' | 'MISSING_METADATA' | 'CONFIDENCE_THRESHOLD';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  data?: any;
  location?: string;
  action: 'BLOCK_DEPLOYMENT' | 'REQUIRE_VALID_AGENT' | 'FIX_PAGEID_STRUCTURE' | 'LOG_WARNING';
}

export interface SOPValidationResult {
  compliant: boolean;
  violations: SOPViolation[];
  complianceScore: number; // 0-100
  timestamp: string;
}

export interface AgentOutput {
  agent_source: ValidOPALAgent;
  confidence_score: number;
  timestamp: string;
  data: any;
  metadata?: {
    execution_time?: number;
    data_quality_score?: number;
    dependencies_met?: boolean;
  };
}

export class SOPViolationError extends Error {
  constructor(
    message: string,
    public violation: SOPViolation,
    public location?: string
  ) {
    super(message);
    this.name = 'SOPViolationError';
  }
}

/**
 * Core SOP Validation Middleware Class
 */
export class SOPValidationMiddleware {
  private static instance: SOPValidationMiddleware;
  private violationLog: SOPViolation[] = [];
  private complianceMetrics = {
    mockDataDetections: 0,
    invalidAgentSources: 0,
    pageIdViolations: 0,
    totalValidations: 0,
    complianceRate: 100
  };

  static getInstance(): SOPValidationMiddleware {
    if (!SOPValidationMiddleware.instance) {
      SOPValidationMiddleware.instance = new SOPValidationMiddleware();
    }
    return SOPValidationMiddleware.instance;
  }

  /**
   * Check if SOP is currently enabled via the admin toggle
   */
  private isSOPEnabled(): boolean {
    if (typeof window !== 'undefined') {
      return (window as any).__OPAL_SOP_ENABLED ?? true;
    }
    return true; // Default to enabled on server-side
  }

  /**
   * Primary validation method - validates data against all SOP requirements
   */
  validateDataSource(data: any, pageId: string, location?: string): SOPValidationResult {
    // Check if SOP is enabled via admin toggle
    if (!this.isSOPEnabled()) {
      console.log('🛡️ [SOP Middleware] SOP is disabled - bypassing validation');
      return {
        compliant: true,
        violations: [],
        complianceScore: 100,
        timestamp: new Date().toISOString()
      };
    }

    console.log('🛡️ [SOP Middleware] SOP is enabled - performing validation');
    const violations: SOPViolation[] = [];

    // Critical Check 1: No mock data in production
    const mockDataViolation = this.detectMockData(data, location);
    if (mockDataViolation) {
      violations.push(mockDataViolation);
    }

    // Critical Check 2: Valid OPAL agent source
    const agentSourceViolation = this.validateAgentSource(data, location);
    if (agentSourceViolation) {
      violations.push(agentSourceViolation);
    }

    // High Priority Check 3: PageId format compliance
    const pageIdViolation = this.validatePageIdFormat(pageId, location);
    if (pageIdViolation) {
      violations.push(pageIdViolation);
    }

    // Medium Priority Check 4: Required metadata
    const metadataViolation = this.validateRequiredMetadata(data, location);
    if (metadataViolation) {
      violations.push(metadataViolation);
    }

    // Medium Priority Check 5: Confidence threshold
    const confidenceViolation = this.validateConfidenceThreshold(data, location);
    if (confidenceViolation) {
      violations.push(confidenceViolation);
    }

    // Calculate compliance score
    const complianceScore = this.calculateComplianceScore(violations);

    // Update metrics
    this.updateComplianceMetrics(violations);

    // Log violations for monitoring
    this.logViolations(violations, pageId, location);

    const result: SOPValidationResult = {
      compliant: violations.length === 0,
      violations,
      complianceScore,
      timestamp: new Date().toISOString()
    };

    // In production, throw error for critical violations (only if SOP is enabled)
    if (process.env.NODE_ENV === 'production' && this.isSOPEnabled()) {
      const criticalViolations = violations.filter(v => v.severity === 'CRITICAL');
      if (criticalViolations.length > 0) {
        throw new SOPViolationError(
          `SOP Critical Violation: ${criticalViolations.map(v => v.message).join(', ')}`,
          criticalViolations[0],
          location
        );
      }
    }

    return result;
  }

  /**
   * Detect mock/placeholder data patterns
   */
  private detectMockData(data: any, location?: string): SOPViolation | null {
    const mockPatterns = [
      /mock\w*data/i,
      /placeholder/i,
      /lorem\s+ipsum/i,
      /sample\w*content/i,
      /test\w*data/i,
      /fake\w*metrics/i,
      /dummy\w*data/i,
      /example\w*data/i,
      /(demo|temp)\w*data/i
    ];

    const dataString = JSON.stringify(data);

    for (const pattern of mockPatterns) {
      if (pattern.test(dataString)) {
        return {
          type: 'MOCK_DATA_DETECTED',
          severity: 'CRITICAL',
          message: `Mock data pattern detected: ${pattern.source}`,
          data: { pattern: pattern.source, location },
          location,
          action: 'BLOCK_DEPLOYMENT'
        };
      }
    }

    // Check for common mock data indicators
    if (typeof data === 'object' && data !== null) {
      // Check for mock data flags
      if (data._isMockData || data.mockData || data.isPlaceholder) {
        return {
          type: 'MOCK_DATA_DETECTED',
          severity: 'CRITICAL',
          message: 'Mock data flag detected in data object',
          data: { flags: ['_isMockData', 'mockData', 'isPlaceholder'], location },
          location,
          action: 'BLOCK_DEPLOYMENT'
        };
      }

      // Check for unrealistic values that indicate mock data
      if (this.hasUnrealisticMockValues(data)) {
        return {
          type: 'MOCK_DATA_DETECTED',
          severity: 'CRITICAL',
          message: 'Unrealistic values detected that indicate mock data',
          data: { suspiciousValues: this.findSuspiciousValues(data), location },
          location,
          action: 'BLOCK_DEPLOYMENT'
        };
      }
    }

    return null;
  }

  /**
   * Validate OPAL agent source attribution
   */
  private validateAgentSource(data: any, location?: string): SOPViolation | null {
    if (!data || typeof data !== 'object') {
      return {
        type: 'INVALID_AGENT_SOURCE',
        severity: 'HIGH',
        message: 'Data object is missing or invalid',
        location,
        action: 'REQUIRE_VALID_AGENT'
      };
    }

    // Check for agent_source field
    if (!data.agent_source) {
      return {
        type: 'INVALID_AGENT_SOURCE',
        severity: 'HIGH',
        message: 'Missing agent_source field - all data must be traceable to OPAL agent',
        data: { availableFields: Object.keys(data) },
        location,
        action: 'REQUIRE_VALID_AGENT'
      };
    }

    // Validate agent source is from approved list
    if (!VALID_OPAL_AGENTS.includes(data.agent_source as ValidOPALAgent)) {
      return {
        type: 'INVALID_AGENT_SOURCE',
        severity: 'HIGH',
        message: `Invalid agent source: ${data.agent_source}. Must be one of: ${VALID_OPAL_AGENTS.join(', ')}`,
        data: {
          provided: data.agent_source,
          valid_agents: VALID_OPAL_AGENTS,
          location
        },
        location,
        action: 'REQUIRE_VALID_AGENT'
      };
    }

    return null;
  }

  /**
   * Validate pageId follows SOP format: ${tier1}-${tier2}-${tier3}
   */
  private validatePageIdFormat(pageId: string, location?: string): SOPViolation | null {
    if (!pageId) {
      return {
        type: 'INVALID_PAGEID_FORMAT',
        severity: 'HIGH',
        message: 'PageId is required for SOP compliance',
        location,
        action: 'FIX_PAGEID_STRUCTURE'
      };
    }

    // SOP requirement: ${tier1}-${tier2}-${tier3} format
    const pageIdPattern = /^[a-z]+(-[a-z]+){2}$/;
    if (!pageIdPattern.test(pageId)) {
      return {
        type: 'INVALID_PAGEID_FORMAT',
        severity: 'HIGH',
        message: `PageId format violation. Expected: tier1-tier2-tier3, received: ${pageId}`,
        data: {
          provided: pageId,
          expected_pattern: 'tier1-tier2-tier3',
          regex_pattern: pageIdPattern.source,
          location
        },
        location,
        action: 'FIX_PAGEID_STRUCTURE'
      };
    }

    return null;
  }

  /**
   * Validate required metadata for agent outputs
   */
  private validateRequiredMetadata(data: any, location?: string): SOPViolation | null {
    if (!data || typeof data !== 'object') {
      return null; // Already handled by agent source validation
    }

    const requiredFields = ['timestamp', 'confidence_score'];
    const missingFields = requiredFields.filter(field => !(field in data));

    if (missingFields.length > 0) {
      return {
        type: 'MISSING_METADATA',
        severity: 'MEDIUM',
        message: `Missing required metadata fields: ${missingFields.join(', ')}`,
        data: {
          missing_fields: missingFields,
          required_fields: requiredFields,
          location
        },
        location,
        action: 'LOG_WARNING'
      };
    }

    return null;
  }

  /**
   * Validate agent confidence scores meet minimum threshold
   */
  private validateConfidenceThreshold(data: any, location?: string): SOPViolation | null {
    if (!data?.confidence_score) {
      return null; // Handled by metadata validation
    }

    const minConfidence = 70; // SOP threshold
    if (data.confidence_score < minConfidence) {
      return {
        type: 'CONFIDENCE_THRESHOLD',
        severity: 'MEDIUM',
        message: `Agent confidence score ${data.confidence_score}% below SOP threshold of ${minConfidence}%`,
        data: {
          confidence_score: data.confidence_score,
          threshold: minConfidence,
          agent_source: data.agent_source,
          location
        },
        location,
        action: 'LOG_WARNING'
      };
    }

    return null;
  }

  /**
   * Check for unrealistic values that indicate mock data
   */
  private hasUnrealisticMockValues(data: any): boolean {
    const dataString = JSON.stringify(data);

    // Common mock data patterns
    const mockValuePatterns = [
      /999999|123456|111111|222222|333333/, // Obvious fake numbers
      /(test|demo|sample)@(test|demo|sample|example)\.com/i, // Mock emails
      /\+1-555-\d{3}-\d{4}/, // Fake phone numbers
      /^(test|demo|sample|mock)\s*\w*/i // Test prefixes
    ];

    return mockValuePatterns.some(pattern => pattern.test(dataString));
  }

  /**
   * Find suspicious values that might indicate mock data
   */
  private findSuspiciousValues(data: any): string[] {
    const suspicious: string[] = [];
    const dataString = JSON.stringify(data);

    if (/999999/.test(dataString)) suspicious.push('Suspicious number: 999999');
    if (/123456/.test(dataString)) suspicious.push('Suspicious number: 123456');
    if (/test@test\.com/i.test(dataString)) suspicious.push('Test email address');
    if (/lorem ipsum/i.test(dataString)) suspicious.push('Lorem ipsum placeholder text');

    return suspicious;
  }

  /**
   * Calculate overall compliance score based on violations
   */
  private calculateComplianceScore(violations: SOPViolation[]): number {
    if (violations.length === 0) return 100;

    const severityWeights = {
      CRITICAL: -50,
      HIGH: -25,
      MEDIUM: -10,
      LOW: -5
    };

    const totalDeduction = violations.reduce((sum, violation) => {
      return sum + severityWeights[violation.severity];
    }, 0);

    return Math.max(0, 100 + totalDeduction);
  }

  /**
   * Update internal compliance metrics
   */
  private updateComplianceMetrics(violations: SOPViolation[]): void {
    this.complianceMetrics.totalValidations++;

    violations.forEach(violation => {
      switch (violation.type) {
        case 'MOCK_DATA_DETECTED':
          this.complianceMetrics.mockDataDetections++;
          break;
        case 'INVALID_AGENT_SOURCE':
          this.complianceMetrics.invalidAgentSources++;
          break;
        case 'INVALID_PAGEID_FORMAT':
          this.complianceMetrics.pageIdViolations++;
          break;
      }
    });

    // Calculate compliance rate
    const totalViolations = this.complianceMetrics.mockDataDetections +
                           this.complianceMetrics.invalidAgentSources +
                           this.complianceMetrics.pageIdViolations;

    this.complianceMetrics.complianceRate = this.complianceMetrics.totalValidations > 0
      ? ((this.complianceMetrics.totalValidations - totalViolations) / this.complianceMetrics.totalValidations) * 100
      : 100;
  }

  /**
   * Log violations for monitoring and alerting
   */
  private logViolations(violations: SOPViolation[], pageId: string, location?: string): void {
    if (violations.length === 0) return;

    // Add to internal log
    this.violationLog.push(...violations);

    // Keep log size manageable
    if (this.violationLog.length > 1000) {
      this.violationLog = this.violationLog.slice(-500);
    }

    // Console logging for development and monitoring
    violations.forEach(violation => {
      const logLevel = violation.severity === 'CRITICAL' ? 'error' :
                      violation.severity === 'HIGH' ? 'warn' : 'info';

      console[logLevel](`[SOP Violation] ${violation.severity}: ${violation.message}`, {
        type: violation.type,
        pageId,
        location,
        action: violation.action,
        data: violation.data,
        timestamp: new Date().toISOString()
      });
    });

    // In production, also send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(violations, pageId, location);
    }
  }

  /**
   * Send violations to external monitoring service
   */
  private async sendToMonitoringService(violations: SOPViolation[], pageId: string, location?: string): Promise<void> {
    try {
      // In a real implementation, this would send to your monitoring service
      // For now, we'll just log to a structured format
      const monitoringData = {
        event: 'sop_violation',
        violations: violations.map(v => ({
          type: v.type,
          severity: v.severity,
          message: v.message,
          action: v.action
        })),
        pageId,
        location,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      };

      // This could be sent to DataDog, New Relic, CloudWatch, etc.
      console.info('[SOP Monitoring]', JSON.stringify(monitoringData));
    } catch (error) {
      console.error('[SOP Monitoring] Failed to send violation data:', error);
    }
  }

  /**
   * Get current compliance metrics
   */
  getComplianceMetrics() {
    return {
      ...this.complianceMetrics,
      recentViolations: this.violationLog.slice(-10),
      lastValidation: new Date().toISOString()
    };
  }

  /**
   * Reset compliance metrics (useful for testing)
   */
  resetMetrics(): void {
    this.complianceMetrics = {
      mockDataDetections: 0,
      invalidAgentSources: 0,
      pageIdViolations: 0,
      totalValidations: 0,
      complianceRate: 100
    };
    this.violationLog = [];
  }

  /**
   * Validate agent output specifically
   */
  validateAgentOutput(agentOutput: AgentOutput, pageId: string, location?: string): SOPValidationResult {
    return this.validateDataSource(agentOutput, pageId, location);
  }

  /**
   * Helper method to create SOP-compliant agent output
   */
  static createSOPCompliantOutput(
    agentSource: ValidOPALAgent,
    data: any,
    confidenceScore: number = 85
  ): AgentOutput {
    return {
      agent_source: agentSource,
      confidence_score: confidenceScore,
      timestamp: new Date().toISOString(),
      data,
      metadata: {
        execution_time: Date.now(),
        data_quality_score: confidenceScore,
        dependencies_met: true
      }
    };
  }
}

// Export singleton instance for easy use
export const sopValidation = SOPValidationMiddleware.getInstance();

/**
 * Convenience function for quick validation
 */
export function validateSOPCompliance(
  data: any,
  pageId: string,
  location?: string
): SOPValidationResult {
  return sopValidation.validateDataSource(data, pageId, location);
}

/**
 * Check if SOP is currently enabled (for use outside of middleware)
 */
export function isSOPEnabled(): boolean {
  if (typeof window !== 'undefined') {
    return (window as any).__OPAL_SOP_ENABLED ?? true;
  }
  return true; // Default to enabled on server-side
}

/**
 * React hook for SOP validation in components
 */
export function useSOPValidation() {
  return {
    validate: sopValidation.validateDataSource.bind(sopValidation),
    validateAgentOutput: sopValidation.validateAgentOutput.bind(sopValidation),
    getMetrics: sopValidation.getComplianceMetrics.bind(sopValidation),
    createCompliantOutput: SOPValidationMiddleware.createSOPCompliantOutput,
    isEnabled: isSOPEnabled
  };
}
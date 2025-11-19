/**
 * OPAL Validation Helper
 * Reusable utilities for OPAL integration validation
 */

export interface OPALValidationResult {
  success: boolean;
  correlationId: string;
  validations: {
    authentication: boolean;
    payload: boolean;
    configuration: boolean;
  };
  errors: string[];
  warnings: string[];
}

export class OPALValidator {
  /**
   * Validate OPAL authentication configuration
   */
  static validateAuthentication(): { valid: boolean; error?: string } {
    const authKey = process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY;
    const endpoint = process.env.OPAL_ENDPOINT_URL;

    if (!authKey) {
      return { valid: false, error: 'OPAL_STRATEGY_WORKFLOW_AUTH_KEY not configured' };
    }

    if (!endpoint) {
      return { valid: false, error: 'OPAL_ENDPOINT_URL not configured' };
    }

    return { valid: true };
  }

  /**
   * Validate OPAL workflow payload
   */
  static validateWorkflowPayload(payload: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields validation
    const requiredFields = ['client_name', 'industry'];
    for (const field of requiredFields) {
      if (!payload[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Optional but recommended fields
    const recommendedFields = ['business_objectives', 'timeline_preference'];
    for (const field of recommendedFields) {
      if (!payload[field]) {
        console.warn(`⚠️ [OPAL Validation] Missing recommended field: ${field}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Generate standardized correlation ID
   */
  static generateCorrelationId(prefix: string = 'opal'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Comprehensive OPAL validation
   */
  static async validateOPALIntegration(payload: any): Promise<OPALValidationResult> {
    const correlationId = this.generateCorrelationId('validation');
    const errors: string[] = [];
    const warnings: string[] = [];

    console.log('🔍 [OPAL Validation] Starting comprehensive validation:', correlationId);

    // 1. Authentication validation
    const authValidation = this.validateAuthentication();
    const authValid = authValidation.valid;
    if (!authValid && authValidation.error) {
      errors.push(authValidation.error);
    }

    // 2. Payload validation
    const payloadValidation = this.validateWorkflowPayload(payload);
    const payloadValid = payloadValidation.valid;
    if (!payloadValid) {
      errors.push(...payloadValidation.errors);
    }

    // 3. Configuration validation
    const configValid = process.env.NODE_ENV === 'production' ?
      !!process.env.OPAL_PRODUCTION_ENDPOINT : true;

    if (!configValid) {
      errors.push('Production OPAL endpoint not configured');
    }

    const success = authValid && payloadValid && configValid;

    console.log(success ? '✅' : '❌', '[OPAL Validation] Validation complete:', {
      success,
      correlationId,
      errorCount: errors.length
    });

    return {
      success,
      correlationId,
      validations: {
        authentication: authValid,
        payload: payloadValid,
        configuration: configValid
      },
      errors,
      warnings
    };
  }
}
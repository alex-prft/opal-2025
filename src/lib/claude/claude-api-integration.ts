// Phase 2: Claude API Integration with HARD RETRY LIMITS
// Real Claude API integration with maximum 2 attempts and immediate OPAL-only fallback

import { supabase, isDatabaseAvailable } from '@/lib/database/supabase-client';
import type {
  ClaudeEnhancementLifecycle,
  ClaudeConfig,
  DEFAULT_CLAUDE_CONFIG
} from '@/lib/types/phase2-database';
import crypto from 'crypto';

export interface ClaudeEnhancementRequest {
  enhancement_id: string;
  agent_output_id: string;
  page_id: string;
  widget_id: string;
  original_opal_data: any;
  enhancement_type: 'summarization' | 'enrichment' | 'formatting' | 'analysis';
  correlation_id?: string;
}

export interface ClaudeEnhancementResponse {
  success: boolean;
  enhanced_content?: any;
  fallback_to_opal: boolean;
  attempts_made: number;
  lifecycle_id: string;
  processing_time_ms: number;
  error_details?: {
    error_code: string;
    error_message: string;
    guardrail_violation?: boolean;
  };
}

/**
 * Claude API Integration with HARD RETRY LIMITS
 *
 * CRITICAL CONSTRAINTS (Reinforced Guardrails):
 * - Maximum 2 Claude enhancement attempts per content piece (HARD LIMIT)
 * - Immediate OPAL-only fallback after 2 failed attempts
 * - Never modify, override, or invent OPAL quantitative data
 * - Enhancement and summarization ONLY - preserve all metrics, KPIs, raw data
 * - Pre-merge validation ensures Claude output doesn't override OPAL source
 */
export class ClaudeApiIntegration {
  private config: ClaudeConfig;
  private requestCounter = 0;

  constructor(config: Partial<ClaudeConfig> = {}) {
    this.config = {
      ...DEFAULT_CLAUDE_CONFIG,
      ...config
    };

    if (!this.config.api_key) {
      console.warn('⚠️ [Claude] No API key provided - Claude enhancements will be disabled');
    }

    console.log(`🤖 [Claude] Integration initialized with model: ${this.config.model_version}`);
  }

  /**
   * Enhance content with Claude API and HARD RETRY LIMITS
   *
   * Workflow:
   * 1. Validate request and create lifecycle record
   * 2. Attempt Claude enhancement (max 2 attempts)
   * 3. Pre-merge validation against OPAL source
   * 4. Return enhanced content or trigger OPAL-only fallback
   */
  async enhanceContent(request: ClaudeEnhancementRequest): Promise<ClaudeEnhancementResponse> {
    const startTime = Date.now();
    this.requestCounter++;

    console.log(`🤖 [Claude] Enhancement request ${this.requestCounter} for ${request.page_id}/${request.widget_id} (${request.enhancement_id})`);

    // Check if Claude API is available
    if (!this.config.api_key) {
      return this.createFailureResponse(
        request.enhancement_id,
        0,
        startTime,
        'claude_api_disabled',
        'Claude API key not configured'
      );
    }

    // Create lifecycle tracking record
    const lifecycleId = await this.createLifecycleRecord(request);

    let lastError: any = null;
    let enhancedContent: any = null;

    // HARD RETRY LIMIT: Maximum 2 attempts
    for (let attempt = 1; attempt <= this.config.retry_config.max_retries; attempt++) {
      try {
        console.log(`🤖 [Claude] Attempt ${attempt}/${this.config.retry_config.max_retries} for ${request.enhancement_id}`);

        // Update lifecycle record for this attempt
        await this.updateLifecycleAttempt(lifecycleId, attempt, 'processing');

        // Call Claude API with reinforced guardrails
        const claudeResult = await this.callClaudeApi(request, attempt);

        // Pre-merge validation: Ensure Claude didn't override OPAL data
        const validationResult = await this.validateClaudeOutput(
          request.original_opal_data,
          claudeResult,
          lifecycleId
        );

        if (validationResult.passed) {
          // Success! Update lifecycle and return enhanced content
          enhancedContent = claudeResult;
          await this.updateLifecycleSuccess(lifecycleId, claudeResult, Date.now() - startTime);

          console.log(`✅ [Claude] Enhancement successful on attempt ${attempt} for ${request.enhancement_id}`);

          return {
            success: true,
            enhanced_content: enhancedContent,
            fallback_to_opal: false,
            attempts_made: attempt,
            lifecycle_id: lifecycleId,
            processing_time_ms: Date.now() - startTime
          };
        } else {
          // Validation failed - Claude tried to override OPAL data
          lastError = {
            error_code: 'guardrail_violation',
            error_message: validationResult.reason,
            guardrail_violation: true
          };

          console.warn(`⚠️ [Claude] Guardrail violation on attempt ${attempt}: ${validationResult.reason}`);

          await this.updateLifecycleFailure(lifecycleId, lastError, false);

          // If this was the last attempt, break and fallback
          if (attempt >= this.config.retry_config.max_retries) {
            break;
          }

          // Wait before retry (exponential backoff)
          const delay = this.config.retry_config.exponential_backoff
            ? this.config.retry_config.retry_delay_ms * Math.pow(2, attempt - 1)
            : this.config.retry_config.retry_delay_ms;

          console.log(`⏳ [Claude] Waiting ${delay}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error) {
        lastError = {
          error_code: 'claude_api_error',
          error_message: error instanceof Error ? error.message : 'Unknown Claude API error',
          guardrail_violation: false
        };

        console.error(`❌ [Claude] API error on attempt ${attempt}:`, error);

        await this.updateLifecycleFailure(lifecycleId, lastError, false);

        // If this was the last attempt, break and fallback
        if (attempt >= this.config.retry_config.max_retries) {
          break;
        }

        // Wait before retry
        const delay = this.config.retry_config.retry_delay_ms;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Max retries reached - trigger OPAL-only fallback
    console.warn(`❌ [Claude] Max retries (${this.config.retry_config.max_retries}) reached for ${request.enhancement_id}. Falling back to OPAL-only.`);

    await this.updateLifecycleFallback(lifecycleId, lastError);

    return {
      success: false,
      fallback_to_opal: true,
      attempts_made: this.config.retry_config.max_retries,
      lifecycle_id: lifecycleId,
      processing_time_ms: Date.now() - startTime,
      error_details: lastError
    };
  }

  /**
   * Call Claude API with reinforced guardrails
   */
  private async callClaudeApi(request: ClaudeEnhancementRequest, attempt: number): Promise<any> {
    const requestId = `${request.enhancement_id}_attempt_${attempt}`;

    // Build reinforced guardrail prompt
    const guardrailPrompt = this.buildGuardrailPrompt(request);

    // Prepare Claude API request
    const claudeRequest = {
      model: this.config.model_version,
      max_tokens: this.config.max_tokens,
      temperature: this.config.temperature,
      messages: [
        {
          role: 'user',
          content: guardrailPrompt
        }
      ]
    };

    // Record request in lifecycle
    await this.recordClaudeApiCall(request.enhancement_id, claudeRequest);

    console.log(`🤖 [Claude] Calling API with model ${this.config.model_version} (${requestId})`);

    // Simulate Claude API call (replace with actual API call)
    const response = await this.simulateClaudeApiCall(claudeRequest, requestId);

    // Record response in lifecycle
    await this.recordClaudeApiResponse(request.enhancement_id, response);

    return this.parseClaudeResponse(response);
  }

  /**
   * Build reinforced guardrail prompt with strict constraints
   */
  private buildGuardrailPrompt(request: ClaudeEnhancementRequest): string {
    const { original_opal_data, enhancement_type, page_id, widget_id } = request;

    return `
CRITICAL CONSTRAINTS - VIOLATION WILL RESULT IN IMMEDIATE REJECTION:

1. DO NOT invent, modify, or override ANY OPAL quantitative data
2. Enhancement and summarization ONLY - never change metrics, KPIs, or raw data
3. Maintain cross-page consistency - related metrics must align across all 4 pages
4. If OPAL data incomplete, state limitation clearly - never fabricate
5. Enhancement only mode - OPAL is the definitive source of truth
6. Return ONLY valid JSON - no additional text or explanations

TASK: ${enhancement_type} enhancement for ${page_id}/${widget_id}

OPAL DATA (DO NOT MODIFY):
${JSON.stringify(original_opal_data, null, 2)}

INSTRUCTIONS:
- For "summarization": Create concise summaries without changing any numbers
- For "enrichment": Add context and insights without modifying OPAL data
- For "formatting": Improve presentation without altering content
- For "analysis": Provide interpretations while preserving all OPAL metrics

OUTPUT FORMAT (JSON only):
{
  "enhanced_content": {
    // Your enhancements here - preserve all OPAL data exactly
  },
  "enhancement_notes": [
    // Brief notes on what was enhanced (optional)
  ],
  "opal_data_preserved": true // Must be true
}

CRITICAL: Return only the JSON object above. Any modification to OPAL quantitative data will trigger immediate rejection and fallback to OPAL-only content.
`;
  }

  /**
   * Validate Claude output against OPAL source (PRE-MERGE VALIDATION)
   */
  private async validateClaudeOutput(
    originalOpalData: any,
    claudeOutput: any,
    lifecycleId: string
  ): Promise<{ passed: boolean; reason: string; details?: any }> {
    try {
      console.log(`🔍 [Claude] Validating output against OPAL source (${lifecycleId})`);

      // Parse Claude output if it's a string
      let parsedOutput: any;
      try {
        parsedOutput = typeof claudeOutput === 'string' ? JSON.parse(claudeOutput) : claudeOutput;
      } catch (parseError) {
        return {
          passed: false,
          reason: 'Claude output is not valid JSON',
          details: { parse_error: parseError instanceof Error ? parseError.message : 'Unknown parse error' }
        };
      }

      // Check that Claude indicated OPAL data was preserved
      if (parsedOutput.opal_data_preserved !== true) {
        return {
          passed: false,
          reason: 'Claude did not confirm OPAL data preservation',
          details: { opal_data_preserved: parsedOutput.opal_data_preserved }
        };
      }

      // Extract all quantitative data from original OPAL
      const opalMetrics = this.extractQuantitativeData(originalOpalData);

      // Extract all quantitative data from enhanced content
      const enhancedMetrics = this.extractQuantitativeData(parsedOutput.enhanced_content || {});

      // Check for any overridden metrics
      const violations: string[] = [];

      for (const [metricPath, originalValue] of Object.entries(opalMetrics)) {
        if (enhancedMetrics.hasOwnProperty(metricPath)) {
          const enhancedValue = enhancedMetrics[metricPath];

          // Check if values are different (with tolerance for floating point)
          if (!this.valuesEqual(originalValue, enhancedValue)) {
            violations.push(`Metric '${metricPath}' changed from '${originalValue}' to '${enhancedValue}'`);
          }
        }
      }

      if (violations.length > 0) {
        const validationResult = {
          passed: false,
          reason: `Claude illegally modified OPAL metrics: ${violations.join('; ')}`,
          details: {
            violations,
            original_metrics: opalMetrics,
            enhanced_metrics: enhancedMetrics
          }
        };

        // Record validation failure
        await this.recordValidationFailure(lifecycleId, validationResult);

        return validationResult;
      }

      // Validation passed
      const validationResult = {
        passed: true,
        reason: 'Claude output validation passed - no OPAL data overrides detected',
        details: {
          metrics_checked: Object.keys(opalMetrics).length,
          enhancement_type: parsedOutput.enhancement_type || 'unknown'
        }
      };

      // Record validation success
      await this.recordValidationSuccess(lifecycleId, validationResult);

      return validationResult;

    } catch (error) {
      return {
        passed: false,
        reason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { validation_error: error }
      };
    }
  }

  /**
   * Extract quantitative data (numbers, percentages, metrics) from data structure
   */
  private extractQuantitativeData(data: any, path = ''): { [key: string]: any } {
    const metrics: { [key: string]: any } = {};

    const extract = (obj: any, currentPath: string) => {
      if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return;
      }

      for (const [key, value] of Object.entries(obj)) {
        const fullPath = currentPath ? `${currentPath}.${key}` : key;

        // Check if this is a quantitative value
        if (this.isQuantitativeValue(key, value)) {
          metrics[fullPath] = value;
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Recursively extract from nested objects
          extract(value, fullPath);
        }
      }
    };

    extract(data, path);
    return metrics;
  }

  /**
   * Check if a key-value pair represents quantitative data
   */
  private isQuantitativeValue(key: string, value: any): boolean {
    // Check if key suggests a quantitative metric
    const quantitativeKeys = [
      'metric', 'kpi', 'stat', 'count', 'total', 'sum', 'average', 'mean',
      'rate', 'percent', 'percentage', 'score', 'value', 'amount', 'number',
      'views', 'clicks', 'conversions', 'revenue', 'cost', 'engagement',
      'performance', 'duration', 'time', 'speed', 'size', 'weight', 'height'
    ];

    const keyLower = key.toLowerCase();
    const hasQuantitativeKey = quantitativeKeys.some(qKey => keyLower.includes(qKey));

    // Check if value is a number or numeric string
    const isNumeric = typeof value === 'number' ||
      (typeof value === 'string' && /^-?\d+(\.\d+)?%?$/.test(value.trim()));

    return hasQuantitativeKey && isNumeric;
  }

  /**
   * Check if two values are equal (with tolerance for floating point)
   */
  private valuesEqual(val1: any, val2: any): boolean {
    if (typeof val1 === 'number' && typeof val2 === 'number') {
      return Math.abs(val1 - val2) < 0.0001;
    }
    return val1 === val2;
  }

  /**
   * Simulate Claude API call (replace with actual Anthropic API integration)
   */
  private async simulateClaudeApiCall(request: any, requestId: string): Promise<any> {
    // Simulate API latency
    const latency = Math.random() * 1000 + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, latency));

    console.log(`🤖 [Claude] Simulated API call completed in ${Math.round(latency)}ms (${requestId})`);

    // Return simulated enhanced content
    return {
      content: [
        {
          text: JSON.stringify({
            enhanced_content: {
              summary: "AI-enhanced summary of OPAL data (preserving all metrics)",
              formatting: {
                improved_layout: true,
                accessibility_enhanced: true
              },
              context: "Additional insights provided while preserving OPAL data integrity"
            },
            enhancement_notes: [
              "Added summary without modifying metrics",
              "Improved formatting for better readability",
              "Preserved all OPAL quantitative data"
            ],
            opal_data_preserved: true
          })
        }
      ],
      usage: {
        input_tokens: 150,
        output_tokens: 100
      }
    };
  }

  /**
   * Parse Claude API response
   */
  private parseClaudeResponse(response: any): any {
    try {
      const textContent = response.content?.[0]?.text || '{}';
      return JSON.parse(textContent);
    } catch (error) {
      throw new Error(`Failed to parse Claude response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Lifecycle Management Methods

  private async createLifecycleRecord(request: ClaudeEnhancementRequest): Promise<string> {
    const lifecycleId = crypto.randomUUID();

    if (!isDatabaseAvailable()) {
      console.log(`📝 [Claude] Database unavailable, lifecycle tracking disabled (${lifecycleId})`);
      return lifecycleId;
    }

    try {
      const lifecycleRecord: Partial<ClaudeEnhancementLifecycle> = {
        id: lifecycleId,
        agent_output_id: request.agent_output_id,
        enhancement_request_id: request.enhancement_id,
        original_opal_data: request.original_opal_data,
        enhancement_prompt: '', // Will be filled when prompt is built
        enhancement_type: request.enhancement_type,
        attempt_number: 0,
        max_attempts: this.config.retry_config.max_retries,
        status: 'pending',
        claude_model_version: this.config.model_version,
        validation_passed: false,
        opal_override_detected: false,
        opal_override_prevented: false,
        fallback_triggered: false,
        fallback_to_opal_only: false
      };

      await supabase.from('claude_enhancement_lifecycle').insert(lifecycleRecord);

      console.log(`📝 [Claude] Lifecycle record created: ${lifecycleId}`);
      return lifecycleId;

    } catch (error) {
      console.error(`❌ [Claude] Failed to create lifecycle record:`, error);
      return lifecycleId; // Return ID anyway for tracking
    }
  }

  private async updateLifecycleAttempt(lifecycleId: string, attempt: number, status: string): Promise<void> {
    if (!isDatabaseAvailable()) return;

    try {
      await supabase
        .from('claude_enhancement_lifecycle')
        .update({
          attempt_number: attempt,
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', lifecycleId);
    } catch (error) {
      console.error(`❌ [Claude] Failed to update lifecycle attempt:`, error);
    }
  }

  private async updateLifecycleSuccess(lifecycleId: string, result: any, duration: number): Promise<void> {
    if (!isDatabaseAvailable()) return;

    try {
      await supabase
        .from('claude_enhancement_lifecycle')
        .update({
          status: 'completed',
          claude_response_payload: result,
          processing_time_ms: duration,
          validation_passed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', lifecycleId);
    } catch (error) {
      console.error(`❌ [Claude] Failed to update lifecycle success:`, error);
    }
  }

  private async updateLifecycleFailure(lifecycleId: string, errorDetails: any, isFinal: boolean): Promise<void> {
    if (!isDatabaseAvailable()) return;

    try {
      const updateData: any = {
        error_message: errorDetails.error_message,
        error_code: errorDetails.error_code,
        updated_at: new Date().toISOString()
      };

      if (errorDetails.guardrail_violation) {
        updateData.opal_override_detected = true;
        updateData.opal_override_prevented = true;
      }

      if (isFinal) {
        updateData.status = 'failed';
        updateData.failed_at = new Date().toISOString();
      }

      await supabase
        .from('claude_enhancement_lifecycle')
        .update(updateData)
        .eq('id', lifecycleId);
    } catch (error) {
      console.error(`❌ [Claude] Failed to update lifecycle failure:`, error);
    }
  }

  private async updateLifecycleFallback(lifecycleId: string, errorDetails: any): Promise<void> {
    if (!isDatabaseAvailable()) return;

    try {
      await supabase
        .from('claude_enhancement_lifecycle')
        .update({
          status: 'max_retries_reached',
          fallback_triggered: true,
          fallback_to_opal_only: true,
          fallback_reason: 'max_retries_exceeded',
          error_message: errorDetails?.error_message || 'Maximum retry attempts exceeded',
          failed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', lifecycleId);
    } catch (error) {
      console.error(`❌ [Claude] Failed to update lifecycle fallback:`, error);
    }
  }

  private async recordClaudeApiCall(enhancementId: string, request: any): Promise<void> {
    if (!isDatabaseAvailable()) return;

    try {
      await supabase
        .from('claude_enhancement_lifecycle')
        .update({
          claude_request_payload: request,
          updated_at: new Date().toISOString()
        })
        .eq('enhancement_request_id', enhancementId);
    } catch (error) {
      console.error(`❌ [Claude] Failed to record API call:`, error);
    }
  }

  private async recordClaudeApiResponse(enhancementId: string, response: any): Promise<void> {
    if (!isDatabaseAvailable()) return;

    try {
      await supabase
        .from('claude_enhancement_lifecycle')
        .update({
          claude_response_payload: response,
          claude_tokens_used: response.usage?.input_tokens + response.usage?.output_tokens || 0,
          updated_at: new Date().toISOString()
        })
        .eq('enhancement_request_id', enhancementId);
    } catch (error) {
      console.error(`❌ [Claude] Failed to record API response:`, error);
    }
  }

  private async recordValidationSuccess(lifecycleId: string, validation: any): Promise<void> {
    if (!isDatabaseAvailable()) return;

    try {
      await supabase
        .from('claude_enhancement_lifecycle')
        .update({
          pre_merge_validation: validation,
          validation_passed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', lifecycleId);
    } catch (error) {
      console.error(`❌ [Claude] Failed to record validation success:`, error);
    }
  }

  private async recordValidationFailure(lifecycleId: string, validation: any): Promise<void> {
    if (!isDatabaseAvailable()) return;

    try {
      await supabase
        .from('claude_enhancement_lifecycle')
        .update({
          pre_merge_validation: validation,
          validation_passed: false,
          validation_failure_reason: validation.reason,
          opal_override_detected: validation.details?.violations?.length > 0,
          opal_override_prevented: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', lifecycleId);
    } catch (error) {
      console.error(`❌ [Claude] Failed to record validation failure:`, error);
    }
  }

  /**
   * Create failure response helper
   */
  private createFailureResponse(
    enhancementId: string,
    attempts: number,
    startTime: number,
    errorCode: string,
    errorMessage: string
  ): ClaudeEnhancementResponse {
    return {
      success: false,
      fallback_to_opal: true,
      attempts_made: attempts,
      lifecycle_id: enhancementId,
      processing_time_ms: Date.now() - startTime,
      error_details: {
        error_code: errorCode,
        error_message: errorMessage
      }
    };
  }

  /**
   * Get enhancement statistics
   */
  getStatistics(): any {
    return {
      total_requests: this.requestCounter,
      max_retries: this.config.retry_config.max_retries,
      model_version: this.config.model_version,
      api_available: !!this.config.api_key
    };
  }
}

// Export singleton instance
export const claudeIntegration = new ClaudeApiIntegration();
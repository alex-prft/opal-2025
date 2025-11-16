/**
 * OPAL Connector - Data Validation Module
 *
 * Comprehensive validation functions for osa_workflow_data from Optimizely Opal.
 * Validates structure, data types, business rules, and agent-specific requirements.
 */

import {
  OPALAgentId,
  OSAAgentData,
  OSAWorkflowParameters,
  AgentExecutionMetadata,
  BaseAgentExecutionResult,
  AgentValidationResult,
  WorkflowValidationResult,
  OPALAgentConfig
} from '@/lib/types/opal-types';

// ============================================================================
// AGENT CONFIGURATION AND SCHEMAS
// ============================================================================

/**
 * Complete configuration for all 9 OPAL agents
 */
export const OPAL_AGENT_CONFIGS: Record<OPALAgentId, OPALAgentConfig> = {
  'content_review': {
    name: 'Content Review Agent',
    description: 'Analyzes experiment content and variations for quality and optimization',
    estimated_runtime_ms: 45000,
    timeout_threshold_ms: 120000,
    category: 'analysis',
    output_schema: {
      required_fields: ['content_quality_score', 'seo_optimization_score', 'readability_score'],
      score_ranges: { min: 0, max: 100 }
    }
  },
  'geo_audit': {
    name: 'Geographic Audit Agent',
    description: 'Evaluates geographic performance distribution and regional opportunities',
    estimated_runtime_ms: 60000,
    timeout_threshold_ms: 180000,
    category: 'analysis',
    output_schema: {
      required_fields: ['geographic_performance', 'underperforming_regions'],
      performance_fields: ['region', 'performance_score', 'conversion_rate']
    }
  },
  'audience_suggester': {
    name: 'Audience Suggester Agent',
    description: 'Analyzes audience segment performance and recommends targeting strategies',
    estimated_runtime_ms: 50000,
    timeout_threshold_ms: 150000,
    category: 'strategy',
    output_schema: {
      required_fields: ['audience_segments', 'behavioral_patterns'],
      segment_fields: ['segment_name', 'size_estimate', 'conversion_potential']
    }
  },
  'experiment_blueprinter': {
    name: 'Experiment Blueprinter Agent',
    description: 'Creates detailed A/B test and experimentation strategies',
    estimated_runtime_ms: 70000,
    timeout_threshold_ms: 200000,
    category: 'strategy',
    output_schema: {
      required_fields: ['experiment_proposals', 'testing_roadmap'],
      proposal_fields: ['experiment_name', 'hypothesis', 'success_metrics', 'variations']
    }
  },
  'personalization_idea_generator': {
    name: 'Personalization Idea Generator',
    description: 'Generates personalization strategies and implementation ideas',
    estimated_runtime_ms: 55000,
    timeout_threshold_ms: 180000,
    category: 'strategy',
    output_schema: {
      required_fields: ['personalization_strategies', 'content_variations'],
      strategy_fields: ['strategy_name', 'target_segments', 'personalization_type']
    }
  },
  'roadmap_generator': {
    name: 'Roadmap Generator Agent',
    description: 'Generates implementation roadmaps and project timelines',
    estimated_runtime_ms: 65000,
    timeout_threshold_ms: 180000,
    category: 'strategy',
    output_schema: {
      required_fields: ['implementation_phases', 'timeline_milestones'],
      phase_fields: ['phase_name', 'duration_weeks', 'deliverables', 'resources_required']
    }
  },
  'integration_health': {
    name: 'Integration Health Agent',
    description: 'Monitors DXP integration status and health metrics',
    estimated_runtime_ms: 40000,
    timeout_threshold_ms: 120000,
    category: 'monitoring',
    output_schema: {
      required_fields: ['integration_status', 'performance_metrics'],
      status_fields: ['service_name', 'status', 'response_time_ms', 'uptime_percentage']
    }
  },
  'cmp_organizer': {
    name: 'CMP Organizer Agent',
    description: 'Organizes campaign management platform workflows and processes',
    estimated_runtime_ms: 50000,
    timeout_threshold_ms: 150000,
    category: 'optimization',
    output_schema: {
      required_fields: ['campaign_workflows', 'automation_opportunities'],
      workflow_fields: ['workflow_name', 'automation_level', 'efficiency_score']
    }
  },
  'customer_journey': {
    name: 'Customer Journey Agent',
    description: 'Maps customer journey touchpoints and optimization opportunities',
    estimated_runtime_ms: 70000,
    timeout_threshold_ms: 200000,
    category: 'optimization',
    output_schema: {
      required_fields: ['journey_stages', 'cross_channel_insights'],
      stage_fields: ['stage_name', 'touchpoints', 'conversion_rate', 'drop_off_rate']
    }
  }
};

// ============================================================================
// VALIDATION UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if value is a valid ISO date string
 */
function isValidISODate(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && dateString === date.toISOString();
  } catch {
    return false;
  }
}

/**
 * Check if value is a valid number within specified range
 */
function isValidNumber(value: any, min?: number, max?: number): boolean {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return false;
  }
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}

/**
 * Check if value is a non-empty string
 */
function isValidString(value: any, minLength: number = 1): boolean {
  return typeof value === 'string' && value.length >= minLength;
}

/**
 * Check if value is a valid array with minimum length
 */
function isValidArray(value: any, minLength: number = 0): boolean {
  return Array.isArray(value) && value.length >= minLength;
}

/**
 * Check if agent ID is valid
 */
function isValidAgentId(agentId: any): agentId is OPALAgentId {
  return typeof agentId === 'string' && agentId in OPAL_AGENT_CONFIGS;
}

// ============================================================================
// METADATA VALIDATION
// ============================================================================

/**
 * Validate agent execution metadata structure and values
 */
export function validateAgentMetadata(metadata: any): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields validation
  if (!isValidNumber(metadata?.execution_time_ms, 0)) {
    errors.push('execution_time_ms must be a positive number');
  }

  if (!isValidString(metadata?.timestamp)) {
    errors.push('timestamp must be a non-empty string');
  } else if (!isValidISODate(metadata.timestamp)) {
    warnings.push('timestamp should be a valid ISO date string');
  }

  if (typeof metadata?.success !== 'boolean') {
    errors.push('success must be a boolean value');
  }

  // Optional fields validation
  if (metadata?.error_message !== undefined && !isValidString(metadata.error_message)) {
    errors.push('error_message must be a non-empty string if provided');
  }

  if (metadata?.started_at !== undefined && !isValidString(metadata.started_at)) {
    warnings.push('started_at should be a valid ISO date string if provided');
  }

  if (metadata?.completed_at !== undefined && !isValidString(metadata.completed_at)) {
    warnings.push('completed_at should be a valid ISO date string if provided');
  }

  if (metadata?.progress_percentage !== undefined) {
    if (!isValidNumber(metadata.progress_percentage, 0, 100)) {
      errors.push('progress_percentage must be between 0 and 100');
    }
  }

  if (metadata?.retry_count !== undefined) {
    if (!isValidNumber(metadata.retry_count, 0)) {
      errors.push('retry_count must be a non-negative number');
    }
  }

  // Business logic validation
  if (metadata?.success === false && !metadata?.error_message) {
    warnings.push('error_message should be provided when success is false');
  }

  if (metadata?.execution_time_ms > 600000) { // 10 minutes
    warnings.push('execution_time_ms is unusually high (over 10 minutes)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// EXECUTION RESULTS VALIDATION
// ============================================================================

/**
 * Validate base execution results structure
 */
export function validateBaseExecutionResult(executionResults: any): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required base fields
  if (!isValidString(executionResults?.summary, 10)) {
    errors.push('summary must be a string with at least 10 characters');
  }

  if (!isValidArray(executionResults?.recommendations, 1)) {
    errors.push('recommendations must be an array with at least one item');
  } else {
    // Validate each recommendation is a string
    executionResults.recommendations.forEach((rec: any, index: number) => {
      if (!isValidString(rec)) {
        errors.push(`recommendations[${index}] must be a non-empty string`);
      }
    });
  }

  if (!isValidNumber(executionResults?.confidence_score, 0, 1)) {
    errors.push('confidence_score must be a number between 0 and 1');
  }

  if (!isValidNumber(executionResults?.data_points_analyzed, 1)) {
    errors.push('data_points_analyzed must be a positive number');
  }

  if (!executionResults?.insights || typeof executionResults.insights !== 'object') {
    errors.push('insights must be an object');
  }

  // Optional fields validation
  if (executionResults?.references !== undefined) {
    if (!isValidArray(executionResults.references)) {
      warnings.push('references should be an array if provided');
    }
  }

  if (executionResults?.tags !== undefined) {
    if (!isValidArray(executionResults.tags)) {
      warnings.push('tags should be an array if provided');
    }
  }

  // Business logic warnings
  if (executionResults?.confidence_score < 0.5) {
    warnings.push('confidence_score is low (below 0.5) - results may not be reliable');
  }

  if (executionResults?.data_points_analyzed < 10) {
    warnings.push('data_points_analyzed is low (below 10) - analysis may be limited');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate agent-specific execution results based on agent type
 */
export function validateAgentSpecificResults(
  agentId: OPALAgentId,
  executionResults: any
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const config = OPAL_AGENT_CONFIGS[agentId];

  if (!config.output_schema) {
    return { isValid: true, errors, warnings };
  }

  // Validate required fields based on agent type
  if (config.output_schema.required_fields) {
    config.output_schema.required_fields.forEach((field: string) => {
      if (!(field in executionResults)) {
        errors.push(`${agentId}: Missing required field '${field}' in execution_results`);
      }
    });
  }

  // Agent-specific validation logic
  switch (agentId) {
    case 'content_review':
      if (executionResults.content_quality_score !== undefined) {
        if (!isValidNumber(executionResults.content_quality_score, 0, 100)) {
          errors.push('content_quality_score must be between 0 and 100');
        }
      }
      break;

    case 'geo_audit':
      if (executionResults.geographic_performance) {
        if (!isValidArray(executionResults.geographic_performance)) {
          errors.push('geographic_performance must be an array');
        }
      }
      break;

    case 'audience_suggester':
      if (executionResults.audience_segments) {
        if (!isValidArray(executionResults.audience_segments)) {
          errors.push('audience_segments must be an array');
        }
      }
      break;

    case 'experiment_blueprinter':
      if (executionResults.experiment_proposals) {
        if (!isValidArray(executionResults.experiment_proposals)) {
          errors.push('experiment_proposals must be an array');
        }
      }
      break;

    case 'integration_health':
      if (executionResults.integration_status) {
        if (!isValidArray(executionResults.integration_status)) {
          errors.push('integration_status must be an array');
        }
      }
      break;

    // Add more agent-specific validation as needed
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// AGENT DATA VALIDATION
// ============================================================================

/**
 * Validate individual agent data structure and content
 */
export function validateAgentData(agentData: any): AgentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields validation
  if (!isValidAgentId(agentData?.agent_id)) {
    errors.push('agent_id must be a valid OPAL agent identifier');
    return { is_valid: false, errors, warnings };
  }

  if (!isValidString(agentData?.agent_name)) {
    errors.push('agent_name must be a non-empty string');
  }

  if (!isValidString(agentData?.workflow_id)) {
    errors.push('workflow_id must be a non-empty string');
  }

  if (!agentData?.execution_results || typeof agentData.execution_results !== 'object') {
    errors.push('execution_results must be an object');
  }

  if (!agentData?.metadata || typeof agentData.metadata !== 'object') {
    errors.push('metadata must be an object');
  }

  // Early return if basic structure is invalid
  if (errors.length > 0) {
    return { is_valid: false, errors, warnings };
  }

  // Validate metadata
  const metadataValidation = validateAgentMetadata(agentData.metadata);
  errors.push(...metadataValidation.errors);
  warnings.push(...metadataValidation.warnings);

  // Validate base execution results
  const baseResultsValidation = validateBaseExecutionResult(agentData.execution_results);
  errors.push(...baseResultsValidation.errors);
  warnings.push(...baseResultsValidation.warnings);

  // Validate agent-specific execution results
  const agentSpecificValidation = validateAgentSpecificResults(
    agentData.agent_id,
    agentData.execution_results
  );
  errors.push(...agentSpecificValidation.errors);
  warnings.push(...agentSpecificValidation.warnings);

  // Business logic validation
  const agentConfig = OPAL_AGENT_CONFIGS[agentData.agent_id];
  if (agentData.agent_name !== agentConfig.name) {
    warnings.push(`agent_name '${agentData.agent_name}' does not match expected '${agentConfig.name}'`);
  }

  if (agentData.metadata.execution_time_ms > agentConfig.timeout_threshold_ms) {
    warnings.push(`execution_time_ms (${agentData.metadata.execution_time_ms}ms) exceeds timeout threshold (${agentConfig.timeout_threshold_ms}ms)`);
  }

  // Output data validation (optional)
  if (agentData.output_data !== undefined && typeof agentData.output_data !== 'object') {
    warnings.push('output_data should be an object if provided');
  }

  const isValid = errors.length === 0;
  return {
    is_valid: isValid,
    errors,
    warnings,
    validated_data: isValid ? agentData as OSAAgentData : undefined
  };
}

// ============================================================================
// WORKFLOW VALIDATION
// ============================================================================

/**
 * Validate complete OSA workflow data payload
 */
export function validateOSAWorkflowData(workflowData: any): WorkflowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const agentResults: Record<OPALAgentId, AgentValidationResult> = {} as any;

  // Required fields validation
  if (!isValidString(workflowData?.workflow_id)) {
    errors.push('workflow_id must be a non-empty string');
  }

  if (!isValidArray(workflowData?.agent_data, 1)) {
    errors.push('agent_data must be an array with at least one agent');
    return { is_valid: false, errors, warnings, agent_results: agentResults };
  }

  // Optional fields validation
  if (workflowData?.client_name !== undefined && !isValidString(workflowData.client_name)) {
    warnings.push('client_name should be a non-empty string if provided');
  }

  if (workflowData?.business_objectives !== undefined && !isValidArray(workflowData.business_objectives)) {
    warnings.push('business_objectives should be an array if provided');
  }

  if (workflowData?.workflow_timestamp !== undefined && !isValidString(workflowData.workflow_timestamp)) {
    warnings.push('workflow_timestamp should be a valid ISO date string if provided');
  }

  if (workflowData?.workflow_execution_time_ms !== undefined) {
    if (!isValidNumber(workflowData.workflow_execution_time_ms, 0)) {
      warnings.push('workflow_execution_time_ms should be a positive number if provided');
    }
  }

  // Validate each agent data
  const agentIds = new Set<OPALAgentId>();
  workflowData.agent_data.forEach((agentData: any, index: number) => {
    const agentValidation = validateAgentData(agentData);

    if (agentData?.agent_id && isValidAgentId(agentData.agent_id)) {
      agentResults[agentData.agent_id] = agentValidation;

      // Check for duplicate agents
      if (agentIds.has(agentData.agent_id)) {
        errors.push(`Duplicate agent '${agentData.agent_id}' found in workflow`);
      } else {
        agentIds.add(agentData.agent_id);
      }
    } else {
      errors.push(`agent_data[${index}]: Invalid or missing agent_id`);
    }

    // Propagate agent-specific errors with context
    agentValidation.errors.forEach(error => {
      errors.push(`agent_data[${index}]: ${error}`);
    });
    agentValidation.warnings.forEach(warning => {
      warnings.push(`agent_data[${index}]: ${warning}`);
    });
  });

  // Business logic validation
  if (workflowData.agent_data.length > 9) {
    warnings.push(`More than 9 agents provided (${workflowData.agent_data.length}). Expected maximum 9 OPAL agents.`);
  }

  if (agentIds.size !== workflowData.agent_data.length) {
    errors.push('Some agents have invalid or missing agent_id values');
  }

  // Check for workflow consistency
  const workflowIds = new Set(
    workflowData.agent_data
      .map((agent: any) => agent.workflow_id)
      .filter((id: any) => id)
  );

  if (workflowIds.size > 1) {
    warnings.push('Multiple workflow_id values found across agents - should be consistent');
  }

  if (workflowIds.size === 1 && !workflowIds.has(workflowData.workflow_id)) {
    warnings.push('Agent workflow_id values do not match main workflow_id');
  }

  const isValid = errors.length === 0;
  return {
    is_valid: isValid,
    errors,
    warnings,
    agent_results: agentResults,
    validated_data: isValid ? workflowData as OSAWorkflowParameters : undefined
  };
}

// ============================================================================
// EXPORTED VALIDATION FUNCTIONS
// ============================================================================

export {
  validateAgentMetadata,
  validateBaseExecutionResult,
  validateAgentSpecificResults,
  validateAgentData,
  validateOSAWorkflowData,
  OPAL_AGENT_CONFIGS
};
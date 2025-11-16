/**
 * Enhanced Agent Data Validation for OSA OPAL Integration
 *
 * This file provides comprehensive validation for agent-specific data structures
 * defined in agent-data-enhanced.ts. It extends the existing validation system
 * with detailed business logic validation for each of the 9 OPAL agents.
 */

import {
  AgentDataPayload,
  ContentReviewAgentData,
  AudienceSuggesterAgentData,
  ExperimentBlueprintAgentData,
  PersonalizationAgentData,
  RoadmapGeneratorAgentData,
  CustomerJourneyAgentData,
  GeoAuditAgentData,
  IntegrationHealthAgentData,
  CmpOrganizerAgentData,
  validateBaseAgentData,
  isContentReviewAgent,
  isAudienceSuggesterAgent,
  isExperimentBlueprintAgent,
  isPersonalizationAgent,
  isRoadmapGeneratorAgent,
  isCustomerJourneyAgent,
  isGeoAuditAgent,
  isIntegrationHealthAgent,
  isCmpOrganizerAgent
} from '@/types/agent-data-enhanced';

// ============================================================================
// VALIDATION RESULT INTERFACES
// ============================================================================

export interface EnhancedValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  businessMetrics?: Record<string, any>;
  qualityScore?: number; // 0-100 overall data quality score
}

export interface AgentSpecificValidationResult extends EnhancedValidationResult {
  agent_type: string;
  required_fields_present: string[];
  optional_fields_present: string[];
  business_logic_checks: {
    check_name: string;
    passed: boolean;
    message?: string;
  }[];
}

// ============================================================================
// UTILITY VALIDATION FUNCTIONS
// ============================================================================

function isValidScore(value: any, min: number = 0, max: number = 100): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
}

function isValidArray<T>(value: any, minLength: number = 0): value is T[] {
  return Array.isArray(value) && value.length >= minLength;
}

function isValidString(value: any, minLength: number = 1): value is string {
  return typeof value === 'string' && value.length >= minLength;
}

function isValidNumber(value: any, min?: number, max?: number): value is number {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return false;
  }
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
}

function isValidISODate(dateString: any): boolean {
  if (!isValidString(dateString)) return false;
  try {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  } catch {
    return false;
  }
}

// ============================================================================
// BASE AGENT VALIDATION
// ============================================================================

function validateEnhancedBaseAgent(data: any): EnhancedValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required base fields
  if (!isValidString(data?.agent_id)) {
    errors.push('agent_id must be a non-empty string');
  }

  if (!isValidString(data?.agent_type)) {
    errors.push('agent_type must be a non-empty string');
  }

  if (!isValidISODate(data?.execution_timestamp)) {
    errors.push('execution_timestamp must be a valid ISO date string');
  }

  if (!isValidNumber(data?.confidence_score, 0, 1)) {
    errors.push('confidence_score must be a number between 0 and 1');
  }

  // Optional data quality metrics validation
  if (data?.data_quality_metrics) {
    const metrics = data.data_quality_metrics;
    if (!isValidNumber(metrics.completeness, 0, 1)) {
      warnings.push('data_quality_metrics.completeness should be between 0 and 1');
    }
    if (!isValidNumber(metrics.freshness, 0, 1)) {
      warnings.push('data_quality_metrics.freshness should be between 0 and 1');
    }
    if (!isValidNumber(metrics.consistency, 0, 1)) {
      warnings.push('data_quality_metrics.consistency should be between 0 and 1');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// AGENT-SPECIFIC VALIDATION FUNCTIONS
// ============================================================================

function validateContentReviewAgent(data: ContentReviewAgentData): AgentSpecificValidationResult {
  const baseValidation = validateEnhancedBaseAgent(data);
  const errors = [...baseValidation.errors];
  const warnings = [...baseValidation.warnings];
  const businessChecks: { check_name: string; passed: boolean; message?: string }[] = [];

  // Required fields validation
  const requiredFields = ['content_quality_score', 'seo_optimization_score', 'readability_score'];
  const requiredFieldsPresent: string[] = [];

  requiredFields.forEach(field => {
    if (isValidScore(data[field as keyof ContentReviewAgentData])) {
      requiredFieldsPresent.push(field);
    } else {
      errors.push(`${field} must be a number between 0 and 100`);
    }
  });

  // Engagement metrics validation
  if (data.engagement_metrics) {
    const metrics = data.engagement_metrics;
    if (!isValidNumber(metrics.avg_time_on_page, 0)) {
      errors.push('engagement_metrics.avg_time_on_page must be a positive number');
    }
    if (!isValidNumber(metrics.bounce_rate, 0, 1)) {
      errors.push('engagement_metrics.bounce_rate must be between 0 and 1');
    }
    if (!isValidNumber(metrics.conversion_rate, 0, 1)) {
      errors.push('engagement_metrics.conversion_rate must be between 0 and 1');
    }
    requiredFieldsPresent.push('engagement_metrics');
  } else {
    errors.push('engagement_metrics is required');
  }

  // Recommendations validation
  if (isValidArray(data.recommendations, 1)) {
    data.recommendations.forEach((rec, index) => {
      if (!['high', 'medium', 'low'].includes(rec.priority)) {
        errors.push(`recommendations[${index}].priority must be 'high', 'medium', or 'low'`);
      }
      if (!isValidString(rec.category)) {
        errors.push(`recommendations[${index}].category must be a non-empty string`);
      }
      if (!isValidString(rec.description, 10)) {
        errors.push(`recommendations[${index}].description must be at least 10 characters`);
      }
    });
    requiredFieldsPresent.push('recommendations');
  } else {
    errors.push('recommendations must be an array with at least one recommendation');
  }

  // Business logic checks
  const avgQualityScore = (data.content_quality_score + data.seo_optimization_score + data.readability_score) / 3;
  businessChecks.push({
    check_name: 'quality_consistency',
    passed: Math.abs(avgQualityScore - data.confidence_score * 100) < 20,
    message: avgQualityScore < 50 ? 'Low quality scores may indicate content issues' : undefined
  });

  businessChecks.push({
    check_name: 'recommendation_quality',
    passed: data.recommendations.filter(r => r.priority === 'high').length <= 3,
    message: data.recommendations.filter(r => r.priority === 'high').length > 3 ? 'Too many high-priority recommendations may overwhelm users' : undefined
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    agent_type: 'content_review',
    required_fields_present: requiredFieldsPresent,
    optional_fields_present: ['data_quality_metrics'],
    business_logic_checks: businessChecks,
    businessMetrics: {
      avg_quality_score: avgQualityScore,
      high_priority_recommendations: data.recommendations.filter(r => r.priority === 'high').length
    },
    qualityScore: Math.min(100, avgQualityScore * (errors.length === 0 ? 1 : 0.7))
  };
}

function validateAudienceSuggesterAgent(data: AudienceSuggesterAgentData): AgentSpecificValidationResult {
  const baseValidation = validateEnhancedBaseAgent(data);
  const errors = [...baseValidation.errors];
  const warnings = [...baseValidation.warnings];
  const businessChecks: { check_name: string; passed: boolean; message?: string }[] = [];
  const requiredFieldsPresent: string[] = [];

  // Suggested segments validation
  if (isValidArray(data.suggested_segments, 1)) {
    data.suggested_segments.forEach((segment, index) => {
      if (!isValidString(segment.segment_name)) {
        errors.push(`suggested_segments[${index}].segment_name must be a non-empty string`);
      }
      if (!isValidNumber(segment.estimated_size, 0)) {
        errors.push(`suggested_segments[${index}].estimated_size must be a positive number`);
      }
      if (!isValidNumber(segment.confidence_score, 0, 1)) {
        errors.push(`suggested_segments[${index}].confidence_score must be between 0 and 1`);
      }
      if (!isValidNumber(segment.potential_uplift, 0)) {
        errors.push(`suggested_segments[${index}].potential_uplift must be a positive number`);
      }
    });
    requiredFieldsPresent.push('suggested_segments');
  } else {
    errors.push('suggested_segments must be an array with at least one segment');
  }

  // Personalization opportunities validation
  if (isValidArray(data.personalization_opportunities)) {
    data.personalization_opportunities.forEach((opp, index) => {
      if (!isValidString(opp.segment_id)) {
        errors.push(`personalization_opportunities[${index}].segment_id must be a non-empty string`);
      }
      if (!isValidString(opp.content_type)) {
        errors.push(`personalization_opportunities[${index}].content_type must be a non-empty string`);
      }
      if (!isValidNumber(opp.expected_impact, 0)) {
        warnings.push(`personalization_opportunities[${index}].expected_impact should be a positive number`);
      }
    });
    requiredFieldsPresent.push('personalization_opportunities');
  }

  // Business logic checks
  const avgSegmentSize = data.suggested_segments.reduce((sum, seg) => sum + seg.estimated_size, 0) / data.suggested_segments.length;
  businessChecks.push({
    check_name: 'segment_size_distribution',
    passed: data.suggested_segments.some(seg => seg.estimated_size >= avgSegmentSize * 0.5),
    message: 'Ensure segments have meaningful size distribution'
  });

  const highConfidenceSegments = data.suggested_segments.filter(seg => seg.confidence_score > 0.7).length;
  businessChecks.push({
    check_name: 'confidence_quality',
    passed: highConfidenceSegments >= Math.ceil(data.suggested_segments.length * 0.5),
    message: highConfidenceSegments === 0 ? 'No high-confidence segments found' : undefined
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    agent_type: 'audience_suggester',
    required_fields_present: requiredFieldsPresent,
    optional_fields_present: ['data_quality_metrics'],
    business_logic_checks: businessChecks,
    businessMetrics: {
      total_segments: data.suggested_segments.length,
      avg_segment_size: avgSegmentSize,
      high_confidence_segments: highConfidenceSegments,
      personalization_opportunities: data.personalization_opportunities.length
    },
    qualityScore: Math.min(100, (data.confidence_score * 100) * (errors.length === 0 ? 1 : 0.6))
  };
}

function validateExperimentBlueprintAgent(data: ExperimentBlueprintAgentData): AgentSpecificValidationResult {
  const baseValidation = validateEnhancedBaseAgent(data);
  const errors = [...baseValidation.errors];
  const warnings = [...baseValidation.warnings];
  const businessChecks: { check_name: string; passed: boolean; message?: string }[] = [];
  const requiredFieldsPresent: string[] = [];

  // Experiments validation
  if (isValidArray(data.experiments, 1)) {
    data.experiments.forEach((exp, index) => {
      if (!isValidString(exp.id)) {
        errors.push(`experiments[${index}].id must be a non-empty string`);
      }
      if (!isValidString(exp.name)) {
        errors.push(`experiments[${index}].name must be a non-empty string`);
      }
      if (!isValidString(exp.hypothesis, 20)) {
        errors.push(`experiments[${index}].hypothesis must be at least 20 characters`);
      }
      if (!isValidString(exp.metric)) {
        errors.push(`experiments[${index}].metric must be a non-empty string`);
      }
      if (exp.estimated_uplift !== undefined && !isValidNumber(exp.estimated_uplift, 0)) {
        warnings.push(`experiments[${index}].estimated_uplift should be a positive number`);
      }
    });
    requiredFieldsPresent.push('experiments');
  } else {
    errors.push('experiments must be an array with at least one experiment');
  }

  // Business logic checks
  const experimentsWithUplift = data.experiments.filter(exp => exp.estimated_uplift && exp.estimated_uplift > 0);
  businessChecks.push({
    check_name: 'uplift_estimates',
    passed: experimentsWithUplift.length >= data.experiments.length * 0.7,
    message: 'Most experiments should have estimated uplift values'
  });

  const avgEstimatedUplift = experimentsWithUplift.reduce((sum, exp) => sum + (exp.estimated_uplift || 0), 0) / Math.max(1, experimentsWithUplift.length);
  businessChecks.push({
    check_name: 'realistic_uplifts',
    passed: avgEstimatedUplift <= 50, // Realistic expectation
    message: avgEstimatedUplift > 50 ? 'Estimated uplifts may be too optimistic' : undefined
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    agent_type: 'experiment_blueprinter',
    required_fields_present: requiredFieldsPresent,
    optional_fields_present: ['testing_roadmap', 'data_quality_metrics'],
    business_logic_checks: businessChecks,
    businessMetrics: {
      total_experiments: data.experiments.length,
      experiments_with_uplift: experimentsWithUplift.length,
      avg_estimated_uplift: avgEstimatedUplift
    },
    qualityScore: Math.min(100, (data.confidence_score * 100) * (errors.length === 0 ? 1 : 0.6))
  };
}

// ============================================================================
// MAIN ENHANCED VALIDATION FUNCTION
// ============================================================================

/**
 * Validates enhanced agent data with agent-specific business logic
 */
export function validateEnhancedAgentData(data: any): AgentSpecificValidationResult {
  // First validate base structure
  if (!validateBaseAgentData(data)) {
    return {
      isValid: false,
      errors: ['Invalid base agent data structure'],
      warnings: [],
      agent_type: data?.agent_type || 'unknown',
      required_fields_present: [],
      optional_fields_present: [],
      business_logic_checks: [],
      qualityScore: 0
    };
  }

  // Route to agent-specific validation
  const agentData = data as AgentDataPayload;

  if (isContentReviewAgent(agentData)) {
    return validateContentReviewAgent(agentData);
  } else if (isAudienceSuggesterAgent(agentData)) {
    return validateAudienceSuggesterAgent(agentData);
  } else if (isExperimentBlueprintAgent(agentData)) {
    return validateExperimentBlueprintAgent(agentData);
  } else if (isPersonalizationAgent(agentData)) {
    // TODO: Implement personalization agent validation
    return validateGenericAgent(agentData, 'personalization_generator');
  } else if (isRoadmapGeneratorAgent(agentData)) {
    // TODO: Implement roadmap generator validation
    return validateGenericAgent(agentData, 'roadmap_generator');
  } else if (isCustomerJourneyAgent(agentData)) {
    // TODO: Implement customer journey validation
    return validateGenericAgent(agentData, 'customer_journey');
  } else if (isGeoAuditAgent(agentData)) {
    // TODO: Implement geo audit validation
    return validateGenericAgent(agentData, 'geo_audit');
  } else if (isIntegrationHealthAgent(agentData)) {
    // TODO: Implement integration health validation
    return validateGenericAgent(agentData, 'integration_health');
  } else if (isCmpOrganizerAgent(agentData)) {
    // TODO: Implement CMP organizer validation
    return validateGenericAgent(agentData, 'cmp_organizer');
  }

  return {
    isValid: false,
    errors: [`Unknown agent type: ${agentData.agent_type}`],
    warnings: [],
    agent_type: agentData.agent_type,
    required_fields_present: [],
    optional_fields_present: [],
    business_logic_checks: [],
    qualityScore: 0
  };
}

/**
 * Generic validation for agents that don't have specific validation yet
 */
function validateGenericAgent(data: AgentDataPayload, expectedType: string): AgentSpecificValidationResult {
  const baseValidation = validateEnhancedBaseAgent(data);

  return {
    isValid: baseValidation.isValid && data.agent_type === expectedType,
    errors: data.agent_type !== expectedType ?
      [...baseValidation.errors, `Expected agent_type '${expectedType}', got '${data.agent_type}'`] :
      baseValidation.errors,
    warnings: [...baseValidation.warnings, `Using generic validation for ${expectedType} - implement specific validation`],
    agent_type: expectedType,
    required_fields_present: ['agent_id', 'agent_type', 'execution_timestamp', 'confidence_score'],
    optional_fields_present: ['data_quality_metrics'],
    business_logic_checks: [{
      check_name: 'basic_structure',
      passed: data.agent_type === expectedType,
      message: `Generic validation for ${expectedType}`
    }],
    businessMetrics: {
      confidence_score: data.confidence_score
    },
    qualityScore: data.confidence_score * 100 * (baseValidation.isValid ? 1 : 0.5)
  };
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validates multiple agents in a workflow
 */
export function validateAgentWorkflow(agents: any[]): {
  isValid: boolean;
  results: AgentSpecificValidationResult[];
  overallQuality: number;
  summary: {
    total_agents: number;
    valid_agents: number;
    total_errors: number;
    total_warnings: number;
  };
} {
  const results = agents.map(agent => validateEnhancedAgentData(agent));
  const validAgents = results.filter(r => r.isValid).length;
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  const avgQuality = results.reduce((sum, r) => sum + (r.qualityScore || 0), 0) / Math.max(1, results.length);

  return {
    isValid: validAgents === agents.length,
    results,
    overallQuality: avgQuality,
    summary: {
      total_agents: agents.length,
      valid_agents: validAgents,
      total_errors: totalErrors,
      total_warnings: totalWarnings
    }
  };
}
/**
 * Consolidated OPAL Mapping Schema
 * Unified validation schema supporting all four mapping types:
 * - Strategy Plans
 * - Optimizely DXP Tools
 * - Analytics Insights
 * - Experience Optimization
 */

import { z } from 'zod';

// Base enums for validation
export const MappingTypeEnum = z.enum([
  'strategy-plans',
  'dxp-tools',
  'analytics-insights',
  'experience-optimization'
]);

export const ApiStatusEnum = z.enum([
  'connected',
  'testing',
  'error',
  'disconnected'
]);

export const OptimizationDomainEnum = z.enum([
  'content',
  'experimentation',
  'personalization',
  'ux',
  'technology',
  'cross-domain'
]);

export const UpdateFrequencyEnum = z.enum([
  'real-time',
  'daily',
  'weekly',
  'bi-weekly',
  'monthly',
  'quarterly'
]);

// Core validation schemas
export const Tier3ViewSchema = z.object({
  view_name: z.string().min(1),
  description: z.string().optional(),
  recommended_content: z.array(z.string()).min(1),
  goal: z.string().optional(),

  // Agent assignments
  primary_agent: z.string().min(1),
  supporting_agents: z.array(z.string()).default([]),

  // Microservice integration
  microservice_primary: z.string().optional(),
  microservice_supporting: z.array(z.string()).default([]),

  // Performance and business alignment
  optimization_focus: z.string().optional(),
  update_frequency: UpdateFrequencyEnum.default('daily'),
  kpi_alignment: z.array(z.string()).default([]),
  business_context_required: z.array(z.string()).default([]),

  // Confidence and quality metrics
  confidence_score: z.number().min(0).max(1).optional(),
  data_quality_score: z.number().min(0).max(1).optional(),
  success_probability: z.number().min(0).max(1).optional()
});

export const SubSectionSchema = z.object({
  name: z.string().min(1),
  display_name: z.string().optional(),
  description: z.string().optional(),
  priority: z.number().int().min(1).optional(),

  // Domain-specific fields
  optimization_domains: z.array(z.string()).optional(),
  optimization_focus: z.string().optional(),

  // Navigation structure
  sub_navigation: z.array(z.string()).optional(),
  tier3_views: z.array(Tier3ViewSchema).min(1),

  // Business alignment requirements
  business_alignment_requirements: z.object({
    required_kpis: z.array(z.string()).default([]),
    optimization_priorities: z.array(z.string()).optional(),
    marketing_calendar_integration: z.boolean().default(false),
    product_service_alignment: z.enum(['required', 'recommended', 'optional']).default('optional'),
    cross_domain_dependencies: z.array(z.string()).optional(),
    missing_context_alerts: z.record(z.string()).optional()
  }).optional()
});

export const PersonalizationRuleSchema = z.object({
  rule_name: z.string().min(1),
  rule_type: z.string().default('conditional'),
  priority: z.number().int().min(1).max(10).default(1),

  // Rule logic
  trigger_conditions: z.array(z.string()).min(1),
  data_sources: z.array(z.string()).min(1),
  actions: z.array(z.string()).optional(),

  // Rule performance
  description: z.string().optional(),
  affected_domains: z.array(z.string()).optional(),
  execution_count: z.number().int().default(0),
  success_rate: z.number().min(0).max(1).default(0),

  // Status
  is_active: z.boolean().default(true),
  last_executed_at: z.string().datetime().optional()
});

export const ConfidenceMetricsSchema = z.object({
  confidence_interval: z.number().min(0).max(1),
  success_probability: z.number().min(0).max(1),
  data_quality_score: z.number().min(0).max(1),
  recommendation_reliability: z.number().min(0).max(1).optional(),
  prediction_accuracy: z.number().min(0).max(1).optional(),
  business_alignment_score: z.number().min(0).max(1).optional(),
  cross_domain_integration_confidence: z.number().min(0).max(1).optional(),
  optimization_effectiveness_confidence: z.number().min(0).max(1).optional()
});

export const IntegrationHealthSchema = z.object({
  api_status: ApiStatusEnum,
  last_refresh: z.string().datetime(),
  data_freshness: z.string(),
  system_uptime: z.string().optional(),
  response_time_avg: z.string().optional(),
  error_rate: z.string().optional(),

  // Microservice health tracking
  microservice_health: z.record(z.enum(['operational', 'optimal', 'degraded', 'error'])).optional(),
  cross_domain_integration_status: z.record(z.enum(['connected', 'testing', 'error'])).optional()
});

export const MicroserviceIntegrationSchema = z.object({
  primary_dimensions: z.array(z.string()).optional(),
  primary_domains: z.array(OptimizationDomainEnum).optional(),
  functions: z.array(z.string()).min(1),
  optimization_focus: z.string().optional(),
  supporting_all_dimensions: z.boolean().optional(),

  // Integration capabilities
  confidence_scoring: z.boolean().optional(),
  real_time_processing: z.boolean().optional(),
  natural_language_processing: z.boolean().optional(),
  business_alignment: z.boolean().optional(),
  personalization_rules: z.boolean().optional(),
  user_experience_optimization: z.boolean().optional(),
  ai_powered_insights: z.boolean().optional(),
  system_infrastructure: z.boolean().optional(),
  system_monitoring: z.boolean().optional(),
  integration_health_monitoring: z.boolean().optional()
});

export const AdminCustomizationFrameworkSchema = z.object({
  data_mapping_interface: z.string(),
  customizable_elements: z.array(z.object({
    element: z.string(),
    description: z.string(),
    access_level: z.enum(['admin', 'super_admin', 'data_admin', 'technical_admin']),
    microservice: z.string().optional(),
    impact_scope: z.string()
  }))
});

export const ValidationRulesSchema = z.object({
  required_fields: z.array(z.string()),
  field_formats: z.record(z.union([
    z.array(z.string()),
    z.string(),
    z.object({})
  ])),

  // Validation checks
  business_context_validation: z.object({
    kpi_alignment_check: z.boolean().default(true),
    marketing_calendar_integration_check: z.boolean().optional(),
    strategic_priority_validation: z.boolean().optional(),
    business_objective_integration_check: z.boolean().optional(),
    optimization_priority_validation: z.boolean().optional(),
    cross_domain_dependency_check: z.boolean().optional(),
    missing_context_alert_system: z.boolean().default(true)
  }).optional(),

  microservice_integration_validation: z.object({
    api_connectivity_check: z.boolean().default(true),
    data_flow_validation: z.boolean().optional(),
    cross_domain_data_flow_validation: z.boolean().optional(),
    performance_monitoring: z.boolean().optional(),
    real_time_optimization_monitoring: z.boolean().optional(),
    optimization_performance_tracking: z.boolean().optional(),
    cross_domain_health_check_integration: z.boolean().optional(),
    health_check_integration: z.boolean().optional()
  }).optional(),

  // Schema consistency checks
  '7_dimension_consistency_check': z.object({
    dimension_completeness: z.boolean().optional(),
    cross_section_alignment: z.boolean().optional(),
    microservice_mapping_validation: z.boolean().optional(),
    agent_assignment_check: z.boolean().optional()
  }).optional(),

  optimization_framework_consistency_check: z.object({
    domain_completeness: z.boolean().optional(),
    cross_domain_alignment: z.boolean().optional(),
    microservice_mapping_validation: z.boolean().optional(),
    agent_specialization_check: z.boolean().optional(),
    optimization_coherence_validation: z.boolean().optional()
  }).optional(),

  agent_validation: z.object({
    valid_agents: z.array(z.string()).optional(),
    tool_agent_mapping: z.boolean().optional(),
    dxp_tool_validation: z.boolean().optional()
  }).optional(),

  integration_requirements: z.object({
    minimum_api_version: z.string().optional(),
    required_permissions: z.array(z.string()).optional(),
    data_retention_period: z.string().optional(),
    gdpr_compliance: z.boolean().optional()
  }).optional()
});

// Consolidated OPAL Mapping Configuration Schema
export const ConsolidatedOpalMappingSchema = z.object({
  // Schema identification
  $schema: z.string().optional(),
  title: z.string(),
  category: z.string(),
  version: z.string().default('1.0.0'),
  last_updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

  // Core mapping configuration
  mapping_type: MappingTypeEnum,
  strategy_dashboard_area: z.string().min(1),

  // Navigation structure
  navigation_structure: z.object({
    tier1: z.string(),
    tier2: z.array(z.object({
      name: z.string(),
      display_name: z.string().optional(),
      description: z.string().optional(),
      priority: z.number().int().min(1),
      optimization_focus: z.string().optional(),
      microservice_primary: z.string().optional()
    })).min(1)
  }).optional(),

  // Framework definitions (for analytics-insights)
  dimension_framework: z.object({
    standard_7_dimensions: z.array(z.object({
      name: z.string(),
      description: z.string(),
      goal: z.string(),
      microservice_primary: z.string(),
      microservice_supporting: z.array(z.string()).default([]),
      update_frequency: UpdateFrequencyEnum
    }))
  }).optional(),

  optimization_framework: z.object({
    core_optimization_principles: z.array(z.object({
      principle: z.string(),
      description: z.string(),
      microservice_primary: z.string(),
      update_frequency: UpdateFrequencyEnum
    }))
  }).optional(),

  // Main content structure
  sub_sections: z.array(SubSectionSchema).min(1),

  // OPAL ecosystem integration
  opal_instructions: z.array(z.string()),
  missing_instruction_recommendations: z.array(z.object({
    instruction: z.string(),
    purpose: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    affects_sections: z.array(z.string()),
    implementation_timeline: z.string()
  })).optional(),

  opal_agents: z.array(z.string()).min(1),
  dxp_tools: z.array(z.string()),
  opal_tools: z.array(z.string()).optional(),

  // Advanced configuration
  microservice_integrations: z.record(MicroserviceIntegrationSchema).optional(),
  personalization_rules: z.array(PersonalizationRuleSchema),
  confidence_metrics: ConfidenceMetricsSchema,
  integration_health: IntegrationHealthSchema,

  // Business and admin configuration
  recommendation_metadata: z.object({
    aligned_kpis: z.array(z.string()),
    business_strategy: z.string(),
    marketing_calendar_sync: z.boolean().default(false),
    notes: z.string().optional(),
    admin_customization_path: z.string().optional(),
    microservice_dependencies: z.array(z.string()).optional(),
    optimization_philosophy: z.string().optional(),
    technical_requirements: z.object({
      api_integrations_required: z.array(z.string()).optional(),
      data_sync_frequency: z.string().optional(),
      authentication_method: z.string().optional(),
      rate_limiting: z.string().optional()
    }).optional()
  }),

  admin_customization_framework: AdminCustomizationFrameworkSchema.optional(),
  validation_rules: ValidationRulesSchema
});

// Type exports for TypeScript
export type MappingType = z.infer<typeof MappingTypeEnum>;
export type ApiStatus = z.infer<typeof ApiStatusEnum>;
export type OptimizationDomain = z.infer<typeof OptimizationDomainEnum>;
export type UpdateFrequency = z.infer<typeof UpdateFrequencyEnum>;
export type Tier3View = z.infer<typeof Tier3ViewSchema>;
export type SubSection = z.infer<typeof SubSectionSchema>;
export type PersonalizationRule = z.infer<typeof PersonalizationRuleSchema>;
export type ConfidenceMetrics = z.infer<typeof ConfidenceMetricsSchema>;
export type IntegrationHealth = z.infer<typeof IntegrationHealthSchema>;
export type MicroserviceIntegration = z.infer<typeof MicroserviceIntegrationSchema>;
export type AdminCustomizationFramework = z.infer<typeof AdminCustomizationFrameworkSchema>;
export type ValidationRules = z.infer<typeof ValidationRulesSchema>;
export type ConsolidatedOpalMapping = z.infer<typeof ConsolidatedOpalMappingSchema>;

// Validation helper functions
export function validateMappingConfiguration(config: unknown): {
  success: boolean;
  data?: ConsolidatedOpalMapping;
  errors?: z.ZodError['errors']
} {
  try {
    const validated = ConsolidatedOpalMappingSchema.parse(config);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    throw error;
  }
}

export function validatePartialMapping(config: unknown, mappingType: MappingType): {
  success: boolean;
  data?: Partial<ConsolidatedOpalMapping>;
  errors?: z.ZodError['errors']
} {
  try {
    // Create a partial schema for incremental validation
    const partialSchema = ConsolidatedOpalMappingSchema.partial();
    const validated = partialSchema.parse(config);

    // Ensure mapping type matches if provided
    if (validated.mapping_type && validated.mapping_type !== mappingType) {
      return {
        success: false,
        errors: [{
          code: 'custom' as any,
          path: ['mapping_type'],
          message: `Mapping type mismatch: expected ${mappingType}, got ${validated.mapping_type}`
        }]
      };
    }

    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    throw error;
  }
}

// Schema migration helpers
export function migrateToConsolidatedSchema(
  legacyConfig: any,
  mappingType: MappingType
): ConsolidatedOpalMapping {
  const baseConfig = {
    title: `OPAL Mapping Configuration - ${mappingType}`,
    category: `${mappingType} Navigation`,
    version: '1.0.0',
    last_updated: new Date().toISOString().split('T')[0],
    mapping_type: mappingType,
    strategy_dashboard_area: legacyConfig.strategy_dashboard_area || mappingType,

    // Preserve existing structure
    sub_sections: legacyConfig.sub_sections || [],
    opal_instructions: legacyConfig.opal_instructions || [],
    opal_agents: legacyConfig.opal_agents || [],
    dxp_tools: legacyConfig.dxp_tools || [],

    // Ensure required fields exist
    personalization_rules: legacyConfig.personalization_rules || [],
    confidence_metrics: legacyConfig.confidence_metrics || {
      confidence_interval: 0.85,
      success_probability: 0.80,
      data_quality_score: 0.90
    },
    integration_health: legacyConfig.integration_health || {
      api_status: 'testing' as const,
      last_refresh: new Date().toISOString(),
      data_freshness: 'stale'
    },
    recommendation_metadata: legacyConfig.recommendation_metadata || {
      aligned_kpis: [],
      business_strategy: 'data_driven_optimization',
      marketing_calendar_sync: false
    },
    validation_rules: legacyConfig.validation_rules || {
      required_fields: ['view_name', 'primary_agent', 'recommended_content']
    }
  };

  return ConsolidatedOpalMappingSchema.parse(baseConfig);
}
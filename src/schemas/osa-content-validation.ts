import { z } from 'zod';

// Base validation schemas for OSA Content sections
export const OSAOutputSchema = z.object({
  field: z.string().min(1, "Field name is required"),
  agent: z.enum([
    "content_review_agent",
    "audience_suggester",
    "strategy_workflow"
  ]),
  priority: z.enum(["high", "medium", "low"]),
  confidence: z.number().min(0).max(1),
  type: z.enum(["AI-generated", "static", "hybrid"]),
  type_tooltip: z.string().min(1, "Type tooltip is required"),
  tool: z.string().min(1, "Tool name is required"),
  tool_tooltip: z.string().min(1, "Tool tooltip is required"),
  report: z.string().min(1, "Report name is required"),
  report_tooltip: z.string().min(1, "Report tooltip is required"),
  instructions: z.array(z.string()).min(1, "At least one instruction is required"),
  instructions_tooltip: z.string().min(1, "Instructions tooltip is required"),
  dxp_sources: z.array(z.enum(["CMS", "ODP", "WEBX", "Content Recs", "CMP"])).min(1),
  strategy_link: z.enum(["Quick Wins", "Strategic Roadmap"]),
  decision_layer_impact: z.boolean(),
  personal_configurator: z.boolean(),
  brain_learning: z.boolean(),
  ui_component: z.string().optional(),
  refresh_interval: z.enum(["real-time", "hourly", "daily", "weekly"]).optional(),
  data_validation: z.object({
    required: z.boolean(),
    format: z.string(),
    fallback: z.string()
  }).optional()
});

export const AnalyticsInsightsContentSchema = z.object({
  section: z.literal("Analytics Insights → Content"),
  version: z.string(),
  last_updated: z.string(),
  schema_version: z.string(),
  opal_mapping: z.object({
    source_mapping: z.literal("content-mapping-v2.json"),
    outputs: z.array(OSAOutputSchema).min(1, "At least one output is required")
  }),
  ui_configuration: z.object({
    layout: z.string(),
    responsive: z.boolean(),
    filters: z.array(z.string()),
    export_options: z.array(z.string()),
    real_time_updates: z.boolean()
  }),
  personal_configurator_integration: z.object({
    user_preferences: z.record(z.string()),
    preference_keys: z.array(z.string())
  }),
  decision_layer_integration: z.object({
    impact_scoring: z.boolean(),
    confidence_weighting: z.boolean(),
    recommendation_engine: z.object({
      enabled: z.boolean(),
      threshold: z.number().min(0).max(1),
      auto_suggestions: z.boolean()
    })
  }),
  brain_learning_integration: z.object({
    knowledge_updates: z.boolean(),
    pattern_recognition: z.boolean(),
    feedback_loop: z.string(),
    learning_categories: z.array(z.string())
  }),
  validation_schema: z.object({
    required_fields: z.array(z.string()),
    field_formats: z.record(z.any())
  }),
  error_handling: z.object({
    fallback_data: z.boolean(),
    graceful_degradation: z.boolean(),
    retry_policy: z.object({
      max_retries: z.number(),
      backoff_strategy: z.string()
    })
  }),
  monitoring: z.object({
    performance_tracking: z.boolean(),
    error_logging: z.boolean(),
    usage_analytics: z.boolean(),
    health_checks: z.string()
  })
});

export const StrategyPlansContentSchema = z.object({
  section: z.literal("Strategy Plans → Content Strategy"),
  version: z.string(),
  last_updated: z.string(),
  schema_version: z.string(),
  opal_mapping: z.object({
    source_mapping: z.literal("content-mapping-v2.json"),
    outputs: z.array(OSAOutputSchema)
  }),
  strategic_components: z.object({
    content_suggestions: z.array(z.object({
      title: z.string(),
      description: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      estimated_effort: z.string(),
      depends_on_outputs: z.array(z.string()),
      target_users: z.array(z.string()),
      implementation_status: z.string()
    })),
    report_recommendations: z.array(z.object({
      report: z.string(),
      description: z.string(),
      audience: z.array(z.string()),
      frequency: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      data_sources: z.array(z.string()),
      complexity: z.enum(["high", "medium", "low"])
    })),
    strategic_insights: z.array(z.object({
      insight: z.string(),
      description: z.string(),
      business_impact: z.string(),
      implementation: z.string(),
      confidence: z.number().min(0).max(1),
      data_requirements: z.array(z.string()),
      update_frequency: z.string()
    })),
    improvement_recommendations: z.array(z.object({
      area: z.string(),
      recommendation: z.string(),
      expected_impact: z.string(),
      implementation_complexity: z.enum(["high", "medium", "low"]),
      timeline: z.string(),
      depends_on: z.array(z.string()),
      resource_requirements: z.string(),
      success_metrics: z.array(z.string())
    }))
  })
});

export const ExperienceOptimizationContentSchema = z.object({
  section: z.literal("Experience Optimization → Content"),
  version: z.string(),
  last_updated: z.string(),
  schema_version: z.string(),
  opal_mapping: z.object({
    source_mapping: z.literal("content-mapping-v2.json"),
    optimization_focus: z.string(),
    outputs: z.array(OSAOutputSchema.extend({
      optimization_category: z.string()
    }))
  }),
  experience_optimization_features: z.object({
    real_time_optimization: z.object({
      enabled: z.boolean(),
      triggers: z.array(z.string()),
      auto_adjustments: z.record(z.boolean())
    }),
    a_b_testing_integration: z.object({
      automatic_test_generation: z.boolean(),
      content_variant_creation: z.boolean(),
      performance_comparison: z.boolean(),
      winner_selection: z.string()
    }),
    personalization_engine: z.object({
      content_adaptation: z.boolean(),
      dynamic_recommendations: z.boolean(),
      behavioral_triggers: z.boolean(),
      cross_channel_consistency: z.boolean()
    })
  }),
  optimization_workflows: z.array(z.object({
    name: z.string(),
    description: z.string(),
    trigger: z.string(),
    steps: z.array(z.string()),
    approval_required: z.boolean(),
    confidence_threshold: z.number().min(0).max(1)
  }))
});

export const AgentMonitoringSchema = z.object({
  agent: z.string(),
  category: z.literal("content"),
  last_updated: z.string(),
  monitoring_config: z.object({
    status: z.enum(["active", "inactive", "maintenance"]),
    performance_tracking: z.boolean(),
    error_logging: z.boolean(),
    output_validation: z.boolean()
  }),
  required_updates: z.array(z.object({
    component: z.string(),
    update_type: z.enum([
      "capability_enhancement",
      "new_feature",
      "performance_optimization",
      "new_tool",
      "algorithm_improvement"
    ]),
    description: z.string(),
    priority: z.enum(["high", "medium", "low"]),
    estimated_effort: z.string(),
    affects_outputs: z.array(z.string()),
    validation_required: z.boolean(),
    implementation_status: z.enum(["planned", "in_progress", "completed"]),
    dependencies: z.array(z.string())
  })),
  new_instructions_needed: z.array(z.object({
    instruction: z.string(),
    purpose: z.string(),
    priority: z.enum(["high", "medium", "low"]),
    implementation_timeline: z.string(),
    affects_outputs: z.array(z.string())
  })),
  performance_metrics: z.record(z.object({
    target: z.string(),
    current: z.string(),
    trend: z.enum(["improving", "stable", "declining"])
  })),
  health_checks: z.record(z.enum(["excellent", "good", "fair", "poor", "healthy", "optimal"]))
});

// Validation functions
export function validateAnalyticsInsightsContent(data: unknown) {
  return AnalyticsInsightsContentSchema.safeParse(data);
}

export function validateStrategyPlansContent(data: unknown) {
  return StrategyPlansContentSchema.safeParse(data);
}

export function validateExperienceOptimizationContent(data: unknown) {
  return ExperienceOptimizationContentSchema.safeParse(data);
}

export function validateAgentMonitoring(data: unknown) {
  return AgentMonitoringSchema.safeParse(data);
}

// Type exports
export type OSAOutput = z.infer<typeof OSAOutputSchema>;
export type AnalyticsInsightsContent = z.infer<typeof AnalyticsInsightsContentSchema>;
export type StrategyPlansContent = z.infer<typeof StrategyPlansContentSchema>;
export type ExperienceOptimizationContent = z.infer<typeof ExperienceOptimizationContentSchema>;
export type AgentMonitoring = z.infer<typeof AgentMonitoringSchema>;
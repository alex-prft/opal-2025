/**
 * Enhanced OPAL Configuration
 * Comprehensive data structures supporting analytics, recommendations, and dashboard functionality
 */

import { RecommendationBase, UserContext } from '@/lib/utils/recommendationEngine';

// Enhanced OSA Workflow Output with comprehensive analytics support
export interface EnhancedOSAWorkflowOutput {
  // Core workflow data
  workflow_id: string;
  session_id: string;
  client_name: string;
  industry: string;
  company_size: string;
  generated_at: string;

  // Enhanced analytics data
  analytics: {
    userBehavior: {
      sessionDuration: number;
      pageViews: number;
      interactionCount: number;
      engagementScore: number;
      preferredAreas: string[];
      timeSpentByArea: { [areaId: string]: number };
    };
    contentEngagement: {
      topViewedSections: { section: string; views: number; avgTime: number }[];
      bounceRate: number;
      conversionFunnelData: { step: string; completionRate: number }[];
    };
    recommendationPerformance: {
      totalShown: number;
      totalClicked: number;
      totalDismissed: number;
      engagementRate: number;
      topPerformingTypes: string[];
    };
  };

  // Strategy Plans data with enhanced insights
  strategy_plans: {
    quick_wins: {
      overview: {
        totalOpportunities: number;
        averageImpact: number;
        implementationTimespan: string;
        confidenceScore: number;
      };
      top_opportunities: Array<{
        id: string;
        title: string;
        description: string;
        impact_score: number;
        effort_score: number;
        roi_estimate: string;
        implementation_time: string;
        confidence: number;
        success_probability: number;
        expected_outcomes: string[];
        risk_factors: string[];
        prerequisites: string[];
        success_metrics: Array<{
          metric: string;
          baseline: string;
          target: string;
          timeline: string;
        }>;
      }>;
      impact_effort_matrix: Array<{
        id: string;
        title: string;
        impact: number;
        effort: number;
        priority: 'high' | 'medium' | 'low';
        quadrant: 'quick_wins' | 'major_projects' | 'fill_ins' | 'thankless_tasks';
      }>;
    };

    maturity: {
      overall_score: number;
      assessment_date: string;
      confidence_level: number;
      dimensions: Array<{
        name: string;
        score: number;
        max_score: number;
        assessment: 'crawl' | 'walk' | 'run' | 'fly';
        strengths: string[];
        gaps: string[];
        improvement_priorities: string[];
        next_milestone: string;
      }>;
      industry_benchmarks: {
        peer_average: number;
        top_quartile: number;
        position: string;
        gap_analysis: string;
      };
      readiness_assessment: Array<{
        area: string;
        current_state: string;
        target_state: string;
        readiness_score: number;
        blockers: string[];
        enablers: string[];
      }>;
    };

    phases: {
      framework: 'OPAL' | 'Custom';
      phase_overview: Array<{
        phase: string;
        name: string;
        duration_months: number;
        status: 'not_started' | 'in_progress' | 'completed';
        completion_percentage: number;
        key_outcomes: string[];
        success_criteria: string[];
      }>;
      current_phase: {
        name: string;
        progress: number;
        key_objectives: string[];
        milestones: Array<{
          title: string;
          target_date: string;
          status: 'pending' | 'in_progress' | 'completed' | 'at_risk';
          dependencies: string[];
        }>;
        risks: Array<{
          description: string;
          impact: 'high' | 'medium' | 'low';
          probability: 'high' | 'medium' | 'low';
          mitigation: string;
        }>;
      };
      kpi_tracking: Array<{
        kpi: string;
        current_value: number;
        target_value: number;
        trend: 'improving' | 'stable' | 'declining';
        phase_target: string;
      }>;
    };

    roadmap: {
      timeline_months: number;
      major_milestones: Array<{
        id: string;
        title: string;
        description: string;
        target_date: string;
        status: 'upcoming' | 'in_progress' | 'completed' | 'delayed';
        phase: string;
        impact_score: number;
        dependencies: string[];
        deliverables: string[];
        stakeholders: string[];
      }>;
      resource_requirements: Array<{
        role: string;
        allocation: number; // FTE
        timeline: string;
        skills_required: string[];
        cost_estimate: string;
      }>;
      budget_allocation: Array<{
        category: string;
        amount: number;
        percentage: number;
        phase_distribution: { [phase: string]: number };
      }>;
    };
  };

  // Analytics Insights with comprehensive audience and behavioral data
  analytics_insights: {
    audiences: {
      segment_overview: {
        total_segments: number;
        active_segments: number;
        engagement_rate: number;
        top_performing_segment: string;
      };
      top_segments: Array<{
        id: string;
        name: string;
        size: number;
        engagement_score: number;
        conversion_rate: number;
        revenue_contribution: number;
        growth_trend: 'growing' | 'stable' | 'declining';
        characteristics: string[];
        behavioral_patterns: string[];
        personalization_opportunities: string[];
      }>;
      behavioral_analysis: {
        user_journeys: Array<{
          journey: string;
          frequency: number;
          conversion_rate: number;
          avg_duration: number;
          drop_off_points: string[];
        }>;
        interaction_patterns: Array<{
          pattern: string;
          frequency: number;
          user_types: string[];
          success_indicators: string[];
        }>;
        seasonal_trends: Array<{
          period: string;
          engagement_change: number;
          key_drivers: string[];
        }>;
      };
    };

    cx_analytics: {
      journey_performance: {
        overall_satisfaction: number;
        completion_rate: number;
        avg_journey_time: number;
        friction_points: number;
      };
      conversion_funnel: Array<{
        stage: string;
        visitors: number;
        conversion_rate: number;
        drop_off_rate: number;
        optimization_potential: number;
      }>;
      pain_points: Array<{
        location: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        frequency: number;
        impact: string;
        suggested_fixes: string[];
      }>;
      ux_recommendations: Array<{
        priority: 'high' | 'medium' | 'low';
        area: string;
        recommendation: string;
        expected_impact: string;
        implementation_effort: string;
        success_metrics: string[];
      }>;
    };

    governance: {
      data_quality: {
        overall_score: number;
        completeness: number;
        accuracy: number;
        consistency: number;
        timeliness: number;
        issues_detected: Array<{
          type: string;
          severity: 'critical' | 'high' | 'medium' | 'low';
          count: number;
          description: string;
        }>;
      };
      privacy_compliance: {
        gdpr_score: number;
        ccpa_score: number;
        consent_rate: number;
        data_retention_compliance: number;
        audit_trail_completeness: number;
        policy_violations: Array<{
          type: string;
          count: number;
          risk_level: 'high' | 'medium' | 'low';
        }>;
      };
      integration_health: Array<{
        integration: string;
        status: 'healthy' | 'warning' | 'critical';
        uptime: number;
        response_time: number;
        error_rate: number;
        data_freshness: number;
        last_sync: string;
      }>;
    };
  };

  // Experience Optimization with comprehensive personalization and testing data
  experience_optimization: {
    content: {
      freshness_analysis: {
        overall_score: number;
        pages_analyzed: number;
        outdated_content_percentage: number;
        avg_age_days: number;
        content_lifecycle: Array<{
          stage: string;
          count: number;
          percentage: number;
        }>;
      };
      semantic_scoring: {
        overall_semantic_score: number;
        topic_coverage: number;
        content_gaps: Array<{
          topic: string;
          gap_severity: 'high' | 'medium' | 'low';
          opportunity_score: number;
          suggested_content: string[];
        }>;
        content_clusters: Array<{
          cluster: string;
          pages: number;
          performance_score: number;
          optimization_potential: number;
        }>;
      };
      optimization_priorities: Array<{
        content_id: string;
        title: string;
        priority_score: number;
        issues: string[];
        potential_impact: string;
        effort_estimate: string;
        roi_projection: number;
      }>;
    };

    experimentation: {
      testing_overview: {
        active_tests: number;
        completed_tests_30d: number;
        success_rate: number;
        avg_test_duration: number;
        statistical_power: number;
      };
      top_experiments: Array<{
        id: string;
        name: string;
        status: 'draft' | 'running' | 'completed' | 'paused';
        hypothesis: string;
        test_type: string;
        traffic_allocation: number;
        duration_days: number;
        primary_metric: string;
        expected_lift: number;
        actual_lift?: number;
        confidence_level: number;
        statistical_significance: boolean;
        variants: Array<{
          name: string;
          traffic_percentage: number;
          performance: number;
        }>;
      }>;
      experiment_pipeline: Array<{
        status: 'backlog' | 'planning' | 'development' | 'qa' | 'ready';
        count: number;
        avg_cycle_time: number;
      }>;
    };

    personalization: {
      strategy_overview: {
        active_tactics: number;
        personalization_coverage: number;
        engagement_lift: number;
        conversion_lift: number;
        ai_model_accuracy: number;
      };
      tactics: Array<{
        id: string;
        name: string;
        type: 'content' | 'product' | 'layout' | 'messaging' | 'timing';
        status: 'active' | 'testing' | 'paused' | 'planned';
        audience_segments: string[];
        performance: {
          impressions: number;
          engagement_rate: number;
          conversion_rate: number;
          lift: number;
        };
        implementation: {
          complexity: 'simple' | 'moderate' | 'complex';
          effort_estimate: string;
          dependencies: string[];
        };
      }>;
      ai_recommendations: Array<{
        recommendation_type: string;
        confidence_score: number;
        potential_impact: string;
        implementation_priority: 'high' | 'medium' | 'low';
        required_data: string[];
        expected_timeline: string;
      }>;
    };

    ux_optimization: {
      pain_point_analysis: {
        total_issues: number;
        critical_issues: number;
        avg_resolution_time: number;
        user_impact_score: number;
      };
      cross_platform: {
        desktop_performance: number;
        mobile_performance: number;
        tablet_performance: number;
        performance_gap: number;
        optimization_priorities: Array<{
          platform: string;
          issue: string;
          impact: number;
          effort: string;
        }>;
      };
      ux_fixes: Array<{
        id: string;
        title: string;
        priority: 'critical' | 'high' | 'medium' | 'low';
        affected_users: number;
        current_experience: string;
        proposed_solution: string;
        expected_improvement: string;
        implementation_plan: string[];
        success_metrics: string[];
      }>;
    };

    technology: {
      tech_stack_assessment: {
        overall_score: number;
        modernization_index: number;
        technical_debt_score: number;
        scalability_rating: number;
        security_score: number;
        performance_score: number;
      };
      integration_health: Array<{
        system: string;
        type: 'cms' | 'crm' | 'analytics' | 'martech' | 'ecommerce';
        status: 'excellent' | 'good' | 'fair' | 'poor';
        health_score: number;
        uptime: number;
        latency: number;
        error_rate: number;
        data_quality: number;
        maintenance_effort: string;
      }>;
      enhancement_roadmap: Array<{
        enhancement: string;
        category: 'infrastructure' | 'integration' | 'security' | 'performance';
        priority: 'critical' | 'high' | 'medium' | 'low';
        business_impact: string;
        technical_impact: string;
        effort_estimate: string;
        timeline: string;
        dependencies: string[];
        roi_estimate: string;
      }>;
    };
  };

  // Enhanced recommendations with personalization
  recommendations: {
    personalized_recommendations: Array<{
      id: string;
      title: string;
      category: 'content' | 'personalization' | 'experimentation' | 'ux' | 'technology';
      type: 'quick_win' | 'strategic' | 'infrastructure' | 'optimization' | 'innovation';
      priority_score: number;
      confidence: number;
      personalization: {
        user_role: string;
        reasoning: string;
        role_specific_benefits: string[];
        next_steps: string[];
      };
      metrics: {
        expected_impact: string;
        implementation_effort: string;
        timeline: string;
        success_probability: number;
        roi_estimate: string;
      };
      implementation: {
        phases: Array<{
          phase: string;
          duration: string;
          deliverables: string[];
          resources: string[];
        }>;
        risks: Array<{
          risk: string;
          probability: string;
          impact: string;
          mitigation: string;
        }>;
        success_factors: string[];
      };
    }>;

    recommendation_performance: {
      total_generated: number;
      acceptance_rate: number;
      implementation_rate: number;
      success_rate: number;
      avg_roi_achieved: number;
      user_satisfaction: number;
    };
  };

  // Custom rules and personalization settings
  customization: {
    active_rules: Array<{
      rule_id: string;
      name: string;
      area: string;
      description: string;
      rule_logic: string;
      impact_on_scoring: string;
      created_by: string;
      last_applied: string;
    }>;

    user_preferences: {
      role: string;
      experience_level: 'beginner' | 'intermediate' | 'expert';
      focus_areas: string[];
      risk_tolerance: 'conservative' | 'moderate' | 'aggressive';
      preferred_approach: 'incremental' | 'transformational';
      dashboard_layout: string;
      notification_settings: {
        recommendation_alerts: boolean;
        performance_updates: boolean;
        milestone_reminders: boolean;
      };
    };
  };

  // Real-time analytics and performance metrics
  performance_metrics: {
    dashboard_performance: {
      load_time_ms: number;
      user_session_duration: number;
      bounce_rate: number;
      interaction_rate: number;
      error_rate: number;
    };

    recommendation_engine_metrics: {
      avg_processing_time_ms: number;
      cache_hit_rate: number;
      personalization_accuracy: number;
      user_engagement_with_recommendations: number;
    };

    data_freshness: {
      last_updated: string;
      data_age_hours: number;
      next_scheduled_update: string;
      update_frequency: string;
    };
  };
}

// Enhanced configuration for analytics tracking
export const analyticsConfig = {
  events: {
    page_view: { weight: 1, retention_days: 30 },
    tab_change: { weight: 1, retention_days: 7 },
    recommendation_click: { weight: 5, retention_days: 90 },
    recommendation_dismiss: { weight: 2, retention_days: 90 },
    filter_applied: { weight: 2, retention_days: 30 },
    custom_rule_created: { weight: 10, retention_days: 365 },
    time_spent: { weight: 1, retention_days: 30 },
    interaction_pattern: { weight: 3, retention_days: 60 }
  },

  insights: {
    update_frequency_minutes: 15,
    batch_size: 1000,
    retention_policy: {
      raw_events: 90, // days
      aggregated_data: 365, // days
      user_profiles: 730 // days
    }
  }
};

// Recommendation engine configuration
export const recommendationConfig = {
  scoring: {
    weights: {
      impact_effort_ratio: 0.3,
      historical_success: 0.2,
      preference_alignment: 0.25,
      role_specific: 0.15,
      constraints_fit: 0.1
    },

    risk_tolerance_multipliers: {
      conservative: { low: 1.0, medium: 0.8, high: 0.5 },
      moderate: { low: 1.0, medium: 0.9, high: 0.7 },
      aggressive: { low: 0.95, medium: 1.0, high: 1.1 }
    }
  },

  personalization: {
    min_interaction_threshold: 5,
    learning_rate: 0.1,
    confidence_decay_days: 30,
    cold_start_recommendations: 3
  },

  performance: {
    cache_ttl_minutes: 60,
    max_recommendations_per_request: 20,
    parallel_processing: true
  }
};

// Dashboard layout configurations
export const dashboardLayouts = {
  executive: {
    priority_sections: ['quick_wins', 'maturity', 'roadmap'],
    chart_preferences: ['gauges', 'trend_lines', 'summary_cards'],
    data_granularity: 'high_level',
    update_frequency: 'daily'
  },

  marketing_manager: {
    priority_sections: ['content', 'personalization', 'audiences'],
    chart_preferences: ['funnel_charts', 'heatmaps', 'performance_metrics'],
    data_granularity: 'detailed',
    update_frequency: 'hourly'
  },

  technical_lead: {
    priority_sections: ['technology', 'integration_health', 'experimentation'],
    chart_preferences: ['system_metrics', 'error_rates', 'performance_graphs'],
    data_granularity: 'technical',
    update_frequency: 'real_time'
  },

  ux_designer: {
    priority_sections: ['ux_optimization', 'user_journeys', 'pain_points'],
    chart_preferences: ['journey_maps', 'heatmaps', 'user_flow_diagrams'],
    data_granularity: 'user_centric',
    update_frequency: 'daily'
  }
};

// Export default configuration
export const opalConfig = {
  version: '2.0.0',
  last_updated: '2024-11-08',
  features: {
    analytics: true,
    recommendations: true,
    personalization: true,
    real_time_updates: true,
    custom_rules: true,
    role_based_dashboards: true
  },

  integrations: {
    supabase: {
      enabled: true,
      tables: ['analytics', 'recommendations', 'custom_rules', 'user_preferences']
    },

    external_apis: {
      cms_integration: true,
      crm_integration: false,
      analytics_platform: true
    }
  },

  security: {
    data_encryption: true,
    user_authentication: true,
    role_based_access: true,
    audit_logging: true
  }
};
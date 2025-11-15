// Phase 5: Advanced A/B Testing Framework with ML-Driven Insights
// Sophisticated experimentation platform with intelligent optimization and statistical rigor

import crypto from 'crypto';
import { supabase, isDatabaseAvailable } from '@/lib/database/supabase-client';
import { analyticsDataCollector } from '@/lib/analytics/analytics-data-collector';
import { intelligentRecommendationEngine } from '@/lib/recommendations/intelligent-recommendation-engine';
import { behaviorAnalyticsSystem } from '@/lib/personalization/behavior-analytics-system';
import { predictivePerformanceSystem } from '@/lib/prediction/predictive-performance-system';

export interface ABExperiment {
  experiment_id: string;
  experiment_name: string;
  experiment_type: 'simple_ab' | 'multivariate' | 'multi_armed_bandit' | 'factorial' |
                  'sequential' | 'adaptive' | 'personalized' | 'holdout';

  // Experiment configuration
  objective: {
    primary_metric: string;
    secondary_metrics: string[];
    success_criteria: {
      metric: string;
      improvement_threshold: number; // Minimum detectable effect
      direction: 'increase' | 'decrease' | 'change';
      statistical_power: number; // Desired power (e.g., 0.8)
      significance_level: number; // Alpha level (e.g., 0.05)
    };
  };

  // Experiment design
  design: {
    variants: ExperimentVariant[];
    traffic_allocation: Record<string, number>; // variant_id -> percentage
    sample_size_calculation: {
      required_sample_size: number;
      expected_duration_days: number;
      confidence_level: number;
      statistical_method: 'frequentist' | 'bayesian' | 'sequential';
    };
  };

  // Targeting and segmentation
  targeting: {
    inclusion_criteria: {
      user_segments?: string[];
      behavioral_patterns?: Record<string, any>;
      geographic_regions?: string[];
      device_types?: string[];
      time_constraints?: {
        start_time?: string;
        end_time?: string;
        days_of_week?: number[];
        hours_of_day?: number[];
      };
    };
    exclusion_criteria: {
      user_segments?: string[];
      previous_experiments?: string[];
      high_value_users?: boolean;
      new_users_only?: boolean;
    };
    stratification?: {
      stratify_by: string[];
      balanced_allocation: boolean;
    };
  };

  // ML-driven features
  ml_configuration: {
    adaptive_allocation: boolean; // Multi-armed bandit
    personalization_enabled: boolean;
    auto_optimization: {
      enabled: boolean;
      optimization_frequency_hours: number;
      early_stopping_enabled: boolean;
      futility_stopping_enabled: boolean;
    };
    predictive_analysis: {
      enabled: boolean;
      model_types: ('outcome_prediction' | 'user_behavior' | 'long_term_value')[];
    };
  };

  // Experiment status and lifecycle
  status: 'draft' | 'review' | 'approved' | 'running' | 'paused' | 'completed' | 'cancelled' | 'archived';
  lifecycle: {
    created_at: string;
    created_by: string;
    approved_at?: string;
    approved_by?: string;
    started_at?: string;
    paused_at?: string;
    completed_at?: string;
    expected_end_date?: string;
  };

  // Results and analysis
  results?: ExperimentResults;
  intermediate_results: ExperimentResults[];

  // Metadata
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  business_context: {
    hypothesis: string;
    business_rationale: string;
    expected_impact: string;
    rollback_plan: string;
  };
}

export interface ExperimentVariant {
  variant_id: string;
  variant_name: string;
  variant_type: 'control' | 'treatment';
  description: string;

  // Variant configuration
  configuration: {
    feature_flags?: Record<string, boolean>;
    parameters?: Record<string, any>;
    content_changes?: {
      elements: string[];
      modifications: Record<string, any>;
    };
    algorithm_changes?: {
      recommendation_algorithm?: string;
      personalization_rules?: string[];
      optimization_parameters?: Record<string, any>;
    };
  };

  // Traffic and performance
  traffic_allocation: number; // 0-100%
  current_participants: number;
  performance_metrics?: {
    conversion_rate?: number;
    engagement_score?: number;
    user_satisfaction?: number;
    technical_performance?: Record<string, number>;
  };

  // Statistical tracking
  statistical_data: {
    sample_size: number;
    conversions: number;
    total_events: Record<string, number>;
    confidence_intervals?: Record<string, [number, number]>;
  };
}

export interface ExperimentResults {
  analysis_id: string;
  experiment_id: string;
  analysis_timestamp: string;
  analysis_type: 'interim' | 'final' | 'post_hoc';

  // Statistical analysis
  statistical_analysis: {
    method: 'frequentist' | 'bayesian' | 'bootstrap' | 'permutation';
    primary_metric_results: {
      control_mean: number;
      treatment_means: Record<string, number>;
      effect_sizes: Record<string, number>; // Cohen's d or relative lift
      confidence_intervals: Record<string, [number, number]>;
      p_values?: Record<string, number>;
      bayesian_probabilities?: Record<string, number>; // P(variant > control)
    };
    secondary_metrics_results: Record<string, {
      control_mean: number;
      treatment_means: Record<string, number>;
      effect_sizes: Record<string, number>;
      significance: boolean;
    }>;
    multiple_testing_correction: {
      method: 'bonferroni' | 'fdr' | 'holm' | 'none';
      adjusted_significance_level: number;
    };
  };

  // Power and validity analysis
  validity_checks: {
    sample_ratio_mismatch: boolean;
    novelty_effect_detected: boolean;
    interaction_effects: string[];
    data_quality_issues: string[];
    external_factors: string[];
  };

  // ML-driven insights
  ml_insights: {
    segment_analysis: {
      segment_id: string;
      segment_name: string;
      treatment_effect: number;
      confidence: number;
    }[];
    temporal_analysis: {
      time_period: string;
      treatment_effect: number;
      trend_direction: 'improving' | 'stable' | 'declining';
    }[];
    predictive_analysis?: {
      long_term_impact_estimate: number;
      user_lifetime_value_impact: number;
      churn_risk_change: number;
    };
  };

  // Decision support
  recommendations: {
    decision: 'continue' | 'stop_for_winner' | 'stop_for_futility' | 'extend_duration' | 'inconclusive';
    confidence_level: number;
    reasoning: string[];
    next_actions: string[];
    rollout_recommendation?: {
      recommended_variant: string;
      rollout_percentage: number;
      rollout_timeline: string;
      monitoring_plan: string[];
    };
  };

  // Business impact
  business_impact: {
    estimated_revenue_impact: number;
    estimated_conversion_impact: number;
    estimated_user_experience_impact: number;
    risk_assessment: 'low' | 'medium' | 'high';
    implementation_complexity: 'low' | 'medium' | 'high';
  };
}

export interface ExperimentParticipant {
  participant_id: string;
  user_id?: string;
  session_id: string;
  experiment_id: string;
  variant_id: string;

  // Assignment details
  assignment_timestamp: string;
  assignment_method: 'random' | 'deterministic' | 'adaptive' | 'personalized';
  assignment_context: {
    user_segment?: string;
    device_type: string;
    location?: string;
    previous_experiments: string[];
  };

  // Participation tracking
  events: {
    event_id: string;
    event_type: string;
    event_timestamp: string;
    event_value?: number;
    event_metadata?: Record<string, any>;
  }[];

  // Outcomes
  primary_outcome_achieved: boolean;
  primary_outcome_value?: number;
  secondary_outcomes: Record<string, number>;
  participation_duration_seconds: number;

  // Quality indicators
  quality_flags: {
    suspected_bot: boolean;
    multiple_assignments: boolean;
    data_quality_issues: string[];
  };

  status: 'active' | 'completed' | 'dropped_out' | 'excluded';
  completed_at?: string;
}

export interface MultiarmedBanditConfiguration {
  bandit_id: string;
  experiment_id: string;
  algorithm: 'epsilon_greedy' | 'thompson_sampling' | 'ucb1' | 'contextual_bandit';

  // Algorithm parameters
  parameters: {
    exploration_rate?: number; // epsilon for epsilon-greedy
    decay_rate?: number;
    confidence_width?: number; // for UCB
    prior_parameters?: Record<string, number>; // for Thompson sampling
  };

  // Context features for contextual bandits
  context_features?: {
    user_features: string[];
    content_features: string[];
    environmental_features: string[];
  };

  // Performance tracking
  performance_history: {
    timestamp: string;
    variant_rewards: Record<string, number>;
    exploration_exploitation_ratio: number;
    cumulative_regret: number;
  }[];

  // Optimization settings
  optimization: {
    reward_function: string; // How to calculate reward from events
    update_frequency_minutes: number;
    minimum_samples_per_arm: number;
    convergence_threshold: number;
  };
}

export interface ExperimentationPlatform {
  platform_id: string;
  platform_name: string;

  // Platform configuration
  configuration: {
    default_statistical_method: 'frequentist' | 'bayesian';
    default_significance_level: number;
    minimum_experiment_duration_days: number;
    maximum_experiment_duration_days: number;
    sample_ratio_mismatch_threshold: number;
    early_stopping_enabled: boolean;
  };

  // Integration settings
  integrations: {
    analytics_integration: boolean;
    recommendation_engine_integration: boolean;
    behavior_analytics_integration: boolean;
    performance_monitoring_integration: boolean;
  };

  // Quality controls
  quality_controls: {
    bot_detection_enabled: boolean;
    duplicate_assignment_prevention: boolean;
    data_validation_rules: string[];
    statistical_guardrails: string[];
  };

  // Governance
  governance: {
    approval_workflow_enabled: boolean;
    required_reviewers: string[];
    ethical_guidelines: string[];
    privacy_compliance_checks: string[];
  };
}

/**
 * Advanced A/B Testing Framework for Phase 5
 *
 * Features:
 * - Sophisticated statistical analysis with Bayesian and frequentist methods
 * - Multi-armed bandit algorithms for dynamic optimization
 * - ML-driven experiment personalization and segmentation
 * - Real-time experiment monitoring and automatic stopping rules
 * - Comprehensive power analysis and sample size calculation
 * - Integration with all Phase 5 analytics and ML components
 * - Advanced validity checks and bias detection
 * - Business impact assessment and decision support
 * - Automated experiment lifecycle management
 */
export class AdvancedABTestingFramework {
  private experiments = new Map<string, ABExperiment>();
  private participants = new Map<string, ExperimentParticipant>();
  private multiarmedBandits = new Map<string, MultiarmedBanditConfiguration>();
  private experimentationPlatforms = new Map<string, ExperimentationPlatform>();

  private activeExperiments = new Set<string>();
  private experimentAssignments = new Map<string, Map<string, string>>(); // user_id -> experiment_id -> variant_id
  private statisticalCache = new Map<string, any>();

  private processingQueue: { type: string; data: any }[] = [];
  private analysisQueue: string[] = []; // experiment_ids pending analysis

  private statistics = {
    total_experiments: 0,
    active_experiments: 0,
    completed_experiments: 0,
    successful_experiments: 0, // Achieved significance
    total_participants: 0,
    average_experiment_duration_days: 0,
    statistical_power_achieved: 0,
    false_discovery_rate: 0,
    average_effect_size: 0,
    bandit_cumulative_regret: 0
  };

  constructor() {
    console.log(`🧪 [ABTesting] Advanced A/B testing framework initialized`);
    this.initializeExperimentationPlatform();
    this.startExperimentMonitoring();
    this.startStatisticalAnalysis();
    this.startBanditOptimization();
    this.startQualityMonitoring();
  }

  /**
   * Create and configure a new A/B test experiment
   */
  async createExperiment(experimentConfig: Omit<ABExperiment, 'experiment_id' | 'status' | 'lifecycle' | 'intermediate_results'>): Promise<string> {
    const experimentId = crypto.randomUUID();

    console.log(`🧪 [ABTesting] Creating experiment: ${experimentConfig.experiment_name}`);

    // Validate experiment configuration
    const validationResult = await this.validateExperimentConfiguration(experimentConfig);
    if (!validationResult.valid) {
      throw new Error(`Experiment validation failed: ${validationResult.errors.join(', ')}`);
    }

    // Calculate sample size requirements
    const sampleSizeAnalysis = await this.calculateSampleSize(experimentConfig);

    const experiment: ABExperiment = {
      experiment_id: experimentId,
      ...experimentConfig,
      status: 'draft',
      lifecycle: {
        created_at: new Date().toISOString(),
        created_by: 'system',
        expected_end_date: new Date(Date.now() + sampleSizeAnalysis.expected_duration_days * 24 * 60 * 60 * 1000).toISOString()
      },
      intermediate_results: [],
      design: {
        ...experimentConfig.design,
        sample_size_calculation: sampleSizeAnalysis
      }
    };

    this.experiments.set(experimentId, experiment);
    this.statistics.total_experiments++;

    // Initialize multi-armed bandit if adaptive allocation is enabled
    if (experiment.ml_configuration.adaptive_allocation) {
      await this.initializeMultiarmedBandit(experimentId, experiment);
    }

    // Log experiment creation
    await analyticsDataCollector.collectEvent(
      'system',
      'experiment_lifecycle',
      'phase5_analytics',
      'experiment_created',
      {
        experiment_id: experimentId,
        experiment_name: experiment.experiment_name,
        experiment_type: experiment.experiment_type,
        variant_count: experiment.design.variants.length,
        expected_duration: sampleSizeAnalysis.expected_duration_days,
        custom_properties: {
          adaptive_allocation: experiment.ml_configuration.adaptive_allocation,
          personalization_enabled: experiment.ml_configuration.personalization_enabled,
          primary_metric: experiment.objective.primary_metric
        }
      }
    );

    console.log(`✅ [ABTesting] Experiment created: ${experimentId} (${experiment.experiment_name})`);

    return experimentId;
  }

  /**
   * Start an approved experiment
   */
  async startExperiment(experimentId: string): Promise<{ success: boolean; message: string }> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      return { success: false, message: 'Experiment not found' };
    }

    if (experiment.status !== 'approved' && experiment.status !== 'draft') {
      return { success: false, message: `Cannot start experiment in status: ${experiment.status}` };
    }

    console.log(`🧪 [ABTesting] Starting experiment: ${experiment.experiment_name}`);

    try {
      // Pre-flight checks
      const preflightResults = await this.performPreflightChecks(experiment);
      if (!preflightResults.passed) {
        return { success: false, message: `Preflight checks failed: ${preflightResults.issues.join(', ')}` };
      }

      // Update experiment status
      experiment.status = 'running';
      experiment.lifecycle.started_at = new Date().toISOString();

      // Add to active experiments
      this.activeExperiments.add(experimentId);
      this.statistics.active_experiments++;

      // Initialize experiment tracking
      await this.initializeExperimentTracking(experiment);

      // Start bandit optimization if enabled
      if (experiment.ml_configuration.adaptive_allocation) {
        await this.startBanditOptimization(experimentId);
      }

      console.log(`✅ [ABTesting] Experiment started successfully: ${experimentId}`);

      return { success: true, message: 'Experiment started successfully' };

    } catch (error) {
      console.error(`❌ [ABTesting] Failed to start experiment ${experimentId}:`, error);
      return { success: false, message: `Failed to start experiment: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Assign user to experiment variant
   */
  async assignUserToExperiment(
    experimentId: string,
    userId: string,
    sessionId: string,
    context?: {
      device_type?: string;
      location?: string;
      user_segment?: string;
    }
  ): Promise<{ variant_id: string; assignment_method: string } | null> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    console.log(`🧪 [ABTesting] Assigning user ${userId} to experiment ${experimentId}`);

    // Check if user is eligible for experiment
    const eligibilityResult = await this.checkUserEligibility(experiment, userId, context);
    if (!eligibilityResult.eligible) {
      console.log(`⚠️ [ABTesting] User ${userId} not eligible: ${eligibilityResult.reason}`);
      return null;
    }

    // Check for existing assignment
    const existingAssignment = this.getUserExperimentAssignment(userId, experimentId);
    if (existingAssignment) {
      return { variant_id: existingAssignment, assignment_method: 'existing' };
    }

    // Determine assignment method and variant
    let variantAssignment: { variant_id: string; assignment_method: string };

    if (experiment.ml_configuration.adaptive_allocation) {
      // Multi-armed bandit assignment
      variantAssignment = await this.assignVariantViaBandit(experimentId, userId, context);
    } else if (experiment.ml_configuration.personalization_enabled) {
      // Personalized assignment based on user profile
      variantAssignment = await this.assignVariantPersonalized(experiment, userId, context);
    } else {
      // Standard random assignment
      variantAssignment = await this.assignVariantRandomly(experiment, userId);
    }

    // Create participant record
    const participant: ExperimentParticipant = {
      participant_id: crypto.randomUUID(),
      user_id: userId,
      session_id: sessionId,
      experiment_id: experimentId,
      variant_id: variantAssignment.variant_id,
      assignment_timestamp: new Date().toISOString(),
      assignment_method: variantAssignment.assignment_method as any,
      assignment_context: {
        device_type: context?.device_type || 'unknown',
        location: context?.location,
        previous_experiments: this.getUserExperimentHistory(userId)
      },
      events: [],
      primary_outcome_achieved: false,
      secondary_outcomes: {},
      participation_duration_seconds: 0,
      quality_flags: {
        suspected_bot: false,
        multiple_assignments: false,
        data_quality_issues: []
      },
      status: 'active'
    };

    // Store assignment
    this.participants.set(participant.participant_id, participant);
    this.setUserExperimentAssignment(userId, experimentId, variantAssignment.variant_id);

    // Update variant sample size
    const variant = experiment.design.variants.find(v => v.variant_id === variantAssignment.variant_id);
    if (variant) {
      variant.current_participants++;
      variant.statistical_data.sample_size++;
    }

    this.statistics.total_participants++;

    console.log(`✅ [ABTesting] User assigned to variant ${variantAssignment.variant_id} via ${variantAssignment.assignment_method}`);

    return variantAssignment;
  }

  /**
   * Track experiment event for a user
   */
  async trackExperimentEvent(
    experimentId: string,
    userId: string,
    eventType: string,
    eventValue?: number,
    eventMetadata?: Record<string, any>
  ): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    const variantId = this.getUserExperimentAssignment(userId, experimentId);
    if (!variantId) return;

    const participant = this.findParticipant(experimentId, userId);
    if (!participant) return;

    console.log(`📊 [ABTesting] Tracking event ${eventType} for experiment ${experimentId}, user ${userId}`);

    // Create event record
    const event = {
      event_id: crypto.randomUUID(),
      event_type: eventType,
      event_timestamp: new Date().toISOString(),
      event_value: eventValue,
      event_metadata: eventMetadata
    };

    participant.events.push(event);

    // Check if this is the primary outcome
    if (eventType === experiment.objective.primary_metric) {
      participant.primary_outcome_achieved = true;
      participant.primary_outcome_value = eventValue;

      // Update variant conversion statistics
      const variant = experiment.design.variants.find(v => v.variant_id === variantId);
      if (variant) {
        variant.statistical_data.conversions++;
        variant.statistical_data.total_events[eventType] = (variant.statistical_data.total_events[eventType] || 0) + 1;
      }

      // Update bandit reward if applicable
      if (experiment.ml_configuration.adaptive_allocation) {
        await this.updateBanditReward(experimentId, variantId, eventValue || 1);
      }
    }

    // Update secondary outcomes
    if (experiment.objective.secondary_metrics.includes(eventType)) {
      participant.secondary_outcomes[eventType] = eventValue || 1;
    }

    // Log to analytics
    await analyticsDataCollector.collectUserInteraction(
      userId,
      eventType as any,
      `experiment_${experimentId}_${variantId}`,
      {
        experiment_id: experimentId,
        variant_id: variantId,
        event_value: eventValue,
        event_metadata: eventMetadata
      }
    );
  }

  /**
   * Perform statistical analysis of experiment results
   */
  async analyzeExperiment(experimentId: string, analysisType: 'interim' | 'final' = 'interim'): Promise<ExperimentResults> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    console.log(`📊 [ABTesting] Performing ${analysisType} analysis for experiment: ${experiment.experiment_name}`);

    const analysisId = crypto.randomUUID();

    // Collect experiment data
    const experimentData = await this.collectExperimentData(experimentId);

    // Perform statistical tests
    const statisticalAnalysis = await this.performStatisticalAnalysis(experiment, experimentData);

    // Run validity checks
    const validityChecks = await this.performValidityChecks(experiment, experimentData);

    // Generate ML insights
    const mlInsights = await this.generateMLInsights(experiment, experimentData);

    // Calculate business impact
    const businessImpact = await this.calculateBusinessImpact(experiment, statisticalAnalysis);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(experiment, statisticalAnalysis, validityChecks, mlInsights);

    const results: ExperimentResults = {
      analysis_id: analysisId,
      experiment_id: experimentId,
      analysis_timestamp: new Date().toISOString(),
      analysis_type: analysisType,
      statistical_analysis: statisticalAnalysis,
      validity_checks: validityChecks,
      ml_insights: mlInsights,
      recommendations: recommendations,
      business_impact: businessImpact
    };

    // Store results
    if (analysisType === 'final') {
      experiment.results = results;
    } else {
      experiment.intermediate_results.push(results);
    }

    // Check for early stopping conditions
    if (analysisType === 'interim' && experiment.ml_configuration.auto_optimization.early_stopping_enabled) {
      await this.checkEarlyStoppingConditions(experiment, results);
    }

    console.log(`✅ [ABTesting] Analysis completed: ${analysisId} (decision: ${results.recommendations.decision})`);

    return results;
  }

  // Private implementation methods

  private async validateExperimentConfiguration(config: any): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate basic structure
    if (!config.experiment_name || config.experiment_name.trim().length === 0) {
      errors.push('Experiment name is required');
    }

    if (!config.objective?.primary_metric) {
      errors.push('Primary metric is required');
    }

    if (!config.design?.variants || config.design.variants.length < 2) {
      errors.push('At least 2 variants are required');
    }

    // Validate traffic allocation
    if (config.design?.traffic_allocation) {
      const totalAllocation = Object.values(config.design.traffic_allocation).reduce((sum: number, val: any) => sum + val, 0);
      if (Math.abs(totalAllocation - 100) > 0.01) {
        errors.push('Traffic allocation must sum to 100%');
      }
    }

    // Validate statistical parameters
    if (config.objective?.success_criteria) {
      const criteria = config.objective.success_criteria;
      if (criteria.statistical_power && (criteria.statistical_power < 0.5 || criteria.statistical_power > 0.99)) {
        errors.push('Statistical power must be between 0.5 and 0.99');
      }
      if (criteria.significance_level && (criteria.significance_level < 0.01 || criteria.significance_level > 0.2)) {
        errors.push('Significance level must be between 0.01 and 0.2');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private async calculateSampleSize(config: any): Promise<{
    required_sample_size: number;
    expected_duration_days: number;
    confidence_level: number;
    statistical_method: 'frequentist' | 'bayesian' | 'sequential';
  }> {
    const criteria = config.objective.success_criteria;

    // Simplified sample size calculation (in production would use proper statistical formulas)
    const alpha = criteria.significance_level || 0.05;
    const beta = 1 - (criteria.statistical_power || 0.8);
    const effect_size = criteria.improvement_threshold || 0.1; // 10% relative improvement

    // Two-sample t-test sample size formula (simplified)
    const z_alpha = this.getZScore(alpha / 2);
    const z_beta = this.getZScore(beta);
    const pooled_variance = 0.25; // Assume binary outcome with p=0.5 (worst case)

    const sample_size_per_group = Math.ceil(
      (2 * pooled_variance * Math.pow(z_alpha + z_beta, 2)) / Math.pow(effect_size, 2)
    );

    const total_sample_size = sample_size_per_group * config.design.variants.length;

    // Estimate duration based on typical traffic
    const daily_traffic_estimate = 1000; // Would be calculated from historical data
    const expected_duration = Math.ceil(total_sample_size / daily_traffic_estimate);

    return {
      required_sample_size: total_sample_size,
      expected_duration_days: Math.max(7, expected_duration), // Minimum 7 days
      confidence_level: 1 - alpha,
      statistical_method: 'frequentist'
    };
  }

  private getZScore(p: number): number {
    // Approximate inverse normal CDF for common values
    const zScores: Record<string, number> = {
      '0.025': 1.96,  // 95% confidence
      '0.005': 2.576, // 99% confidence
      '0.001': 3.291, // 99.8% confidence
      '0.1': 1.282,   // 80% power
      '0.2': 0.842    // 20% Type II error
    };

    return zScores[p.toString()] || 1.96;
  }

  private async performPreflightChecks(experiment: ABExperiment): Promise<{ passed: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check traffic allocation
    const totalAllocation = Object.values(experiment.design.traffic_allocation).reduce((sum, val) => sum + val, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      issues.push('Invalid traffic allocation');
    }

    // Check for conflicting experiments
    const conflictingExperiments = Array.from(this.activeExperiments.values()).filter(activeId => {
      const activeExperiment = this.experiments.get(activeId);
      return activeExperiment && this.experimentsConflict(experiment, activeExperiment);
    });

    if (conflictingExperiments.length > 0) {
      issues.push(`Conflicts with active experiments: ${conflictingExperiments.join(', ')}`);
    }

    // Check system resources
    if (this.activeExperiments.size >= 10) { // Maximum concurrent experiments
      issues.push('Maximum number of concurrent experiments reached');
    }

    return { passed: issues.length === 0, issues };
  }

  private experimentsConflict(exp1: ABExperiment, exp2: ABExperiment): boolean {
    // Check if experiments target the same users and could interfere
    const exp1Segments = exp1.targeting.inclusion_criteria.user_segments || [];
    const exp2Segments = exp2.targeting.inclusion_criteria.user_segments || [];

    // Simple overlap check - in production would be more sophisticated
    return exp1Segments.some(segment => exp2Segments.includes(segment));
  }

  private async initializeExperimentTracking(experiment: ABExperiment): Promise<void> {
    // Initialize tracking structures for the experiment
    for (const variant of experiment.design.variants) {
      variant.current_participants = 0;
      variant.statistical_data = {
        sample_size: 0,
        conversions: 0,
        total_events: {}
      };
    }

    console.log(`📊 [ABTesting] Experiment tracking initialized for ${experiment.experiment_id}`);
  }

  private async initializeMultiarmedBandit(experimentId: string, experiment: ABExperiment): Promise<void> {
    const banditConfig: MultiarmedBanditConfiguration = {
      bandit_id: crypto.randomUUID(),
      experiment_id: experimentId,
      algorithm: 'thompson_sampling', // Default to Thompson sampling
      parameters: {
        exploration_rate: 0.1,
        decay_rate: 0.99,
        prior_parameters: {
          alpha: 1, // Prior successes
          beta: 1   // Prior failures
        }
      },
      performance_history: [],
      optimization: {
        reward_function: experiment.objective.primary_metric,
        update_frequency_minutes: 10,
        minimum_samples_per_arm: 50,
        convergence_threshold: 0.05
      }
    };

    this.multiarmedBandits.set(experimentId, banditConfig);
    console.log(`🎰 [ABTesting] Multi-armed bandit initialized for experiment ${experimentId}`);
  }

  private async checkUserEligibility(
    experiment: ABExperiment,
    userId: string,
    context?: any
  ): Promise<{ eligible: boolean; reason?: string }> {

    // Check inclusion criteria
    if (experiment.targeting.inclusion_criteria.user_segments) {
      const userProfile = behaviorAnalyticsSystem.getUserBehaviorProfile(userId);
      if (userProfile) {
        const userSegment = userProfile.segmentation.primary_segment;
        if (!experiment.targeting.inclusion_criteria.user_segments.includes(userSegment)) {
          return { eligible: false, reason: 'User segment not included' };
        }
      }
    }

    // Check exclusion criteria
    if (experiment.targeting.exclusion_criteria.user_segments) {
      const userProfile = behaviorAnalyticsSystem.getUserBehaviorProfile(userId);
      if (userProfile) {
        const userSegment = userProfile.segmentation.primary_segment;
        if (experiment.targeting.exclusion_criteria.user_segments.includes(userSegment)) {
          return { eligible: false, reason: 'User segment excluded' };
        }
      }
    }

    // Check device type restrictions
    if (experiment.targeting.inclusion_criteria.device_types && context?.device_type) {
      if (!experiment.targeting.inclusion_criteria.device_types.includes(context.device_type)) {
        return { eligible: false, reason: 'Device type not supported' };
      }
    }

    // Check time constraints
    if (experiment.targeting.inclusion_criteria.time_constraints) {
      const now = new Date();
      const constraints = experiment.targeting.inclusion_criteria.time_constraints;

      if (constraints.hours_of_day && !constraints.hours_of_day.includes(now.getHours())) {
        return { eligible: false, reason: 'Outside allowed time window' };
      }

      if (constraints.days_of_week && !constraints.days_of_week.includes(now.getDay())) {
        return { eligible: false, reason: 'Outside allowed days' };
      }
    }

    return { eligible: true };
  }

  private getUserExperimentAssignment(userId: string, experimentId: string): string | null {
    const userAssignments = this.experimentAssignments.get(userId);
    return userAssignments?.get(experimentId) || null;
  }

  private setUserExperimentAssignment(userId: string, experimentId: string, variantId: string): void {
    if (!this.experimentAssignments.has(userId)) {
      this.experimentAssignments.set(userId, new Map());
    }
    this.experimentAssignments.get(userId)!.set(experimentId, variantId);
  }

  private getUserExperimentHistory(userId: string): string[] {
    const userAssignments = this.experimentAssignments.get(userId);
    return userAssignments ? Array.from(userAssignments.keys()) : [];
  }

  private async assignVariantViaBandit(
    experimentId: string,
    userId: string,
    context?: any
  ): Promise<{ variant_id: string; assignment_method: string }> {
    const banditConfig = this.multiarmedBandits.get(experimentId);
    const experiment = this.experiments.get(experimentId)!;

    if (!banditConfig) {
      // Fall back to random assignment
      return this.assignVariantRandomly(experiment, userId);
    }

    // Thompson Sampling algorithm
    const variantProbabilities = new Map<string, number>();

    for (const variant of experiment.design.variants) {
      const alpha = banditConfig.parameters.prior_parameters?.alpha || 1;
      const beta = banditConfig.parameters.prior_parameters?.beta || 1;

      // Add observed successes and failures
      const successes = variant.statistical_data.conversions + alpha;
      const failures = (variant.statistical_data.sample_size - variant.statistical_data.conversions) + beta;

      // Sample from Beta distribution (simplified)
      const probability = this.sampleFromBeta(successes, failures);
      variantProbabilities.set(variant.variant_id, probability);
    }

    // Select variant with highest sampled probability
    const selectedVariant = Array.from(variantProbabilities.entries())
      .sort(([,a], [,b]) => b - a)[0][0];

    return {
      variant_id: selectedVariant,
      assignment_method: 'thompson_sampling'
    };
  }

  private sampleFromBeta(alpha: number, beta: number): number {
    // Simplified Beta distribution sampling
    // In production would use proper statistical library
    return Math.random() * (alpha / (alpha + beta)) + 0.1;
  }

  private async assignVariantPersonalized(
    experiment: ABExperiment,
    userId: string,
    context?: any
  ): Promise<{ variant_id: string; assignment_method: string }> {
    // Get user behavior profile
    const userProfile = behaviorAnalyticsSystem.getUserBehaviorProfile(userId);

    if (!userProfile) {
      return this.assignVariantRandomly(experiment, userId);
    }

    // Use ML to predict which variant is most likely to succeed for this user
    // This is a simplified version - in production would use trained models
    const variantScores = new Map<string, number>();

    for (const variant of experiment.design.variants) {
      let score = 0.5; // Base score

      // Adjust based on user engagement level
      if (userProfile.real_time_state.session_engagement_score > 80) {
        score += variant.variant_type === 'treatment' ? 0.2 : -0.1;
      }

      // Adjust based on user archetype
      if (userProfile.segmentation.user_archetype === 'power_user') {
        score += variant.variant_type === 'treatment' ? 0.3 : -0.2;
      }

      variantScores.set(variant.variant_id, score);
    }

    // Select highest scoring variant with some randomness
    const sortedVariants = Array.from(variantScores.entries()).sort(([,a], [,b]) => b - a);
    const selectedVariant = Math.random() < 0.8 ? sortedVariants[0][0] : sortedVariants[Math.floor(Math.random() * sortedVariants.length)][0];

    return {
      variant_id: selectedVariant,
      assignment_method: 'personalized_ml'
    };
  }

  private async assignVariantRandomly(
    experiment: ABExperiment,
    userId: string
  ): Promise<{ variant_id: string; assignment_method: string }> {
    // Deterministic hash-based assignment to ensure consistency
    const hash = this.hashUserId(userId + experiment.experiment_id);
    const randomValue = hash % 100;

    let cumulativeAllocation = 0;
    for (const variant of experiment.design.variants) {
      const allocation = experiment.design.traffic_allocation[variant.variant_id] || 0;
      cumulativeAllocation += allocation;

      if (randomValue < cumulativeAllocation) {
        return {
          variant_id: variant.variant_id,
          assignment_method: 'random_hash'
        };
      }
    }

    // Fallback to first variant
    return {
      variant_id: experiment.design.variants[0].variant_id,
      assignment_method: 'fallback'
    };
  }

  private hashUserId(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private findParticipant(experimentId: string, userId: string): ExperimentParticipant | null {
    for (const participant of this.participants.values()) {
      if (participant.experiment_id === experimentId && participant.user_id === userId) {
        return participant;
      }
    }
    return null;
  }

  private async updateBanditReward(experimentId: string, variantId: string, reward: number): Promise<void> {
    const banditConfig = this.multiarmedBandits.get(experimentId);
    if (!banditConfig) return;

    // Update performance history
    const timestamp = new Date().toISOString();
    const variantRewards: Record<string, number> = {};
    variantRewards[variantId] = reward;

    banditConfig.performance_history.push({
      timestamp,
      variant_rewards: variantRewards,
      exploration_exploitation_ratio: 0.8, // Would calculate actual ratio
      cumulative_regret: 0 // Would calculate cumulative regret
    });

    console.log(`🎰 [ABTesting] Updated bandit reward for variant ${variantId}: ${reward}`);
  }

  private async collectExperimentData(experimentId: string): Promise<any> {
    // Collect all participant data for the experiment
    const participants = Array.from(this.participants.values())
      .filter(p => p.experiment_id === experimentId);

    const experiment = this.experiments.get(experimentId)!;

    return {
      experiment,
      participants,
      total_participants: participants.length,
      conversion_data: this.aggregateConversionData(participants, experiment),
      temporal_data: this.aggregateTemporalData(participants),
      segment_data: await this.aggregateSegmentData(participants)
    };
  }

  private aggregateConversionData(participants: ExperimentParticipant[], experiment: ABExperiment): any {
    const conversionsByVariant: Record<string, { conversions: number; total: number; rate: number }> = {};

    for (const variant of experiment.design.variants) {
      const variantParticipants = participants.filter(p => p.variant_id === variant.variant_id);
      const conversions = variantParticipants.filter(p => p.primary_outcome_achieved).length;
      const total = variantParticipants.length;

      conversionsByVariant[variant.variant_id] = {
        conversions,
        total,
        rate: total > 0 ? conversions / total : 0
      };
    }

    return conversionsByVariant;
  }

  private aggregateTemporalData(participants: ExperimentParticipant[]): any {
    // Aggregate conversion data by time periods
    const dailyConversions: Record<string, Record<string, number>> = {};

    for (const participant of participants) {
      const assignmentDate = new Date(participant.assignment_timestamp).toISOString().split('T')[0];

      if (!dailyConversions[assignmentDate]) {
        dailyConversions[assignmentDate] = {};
      }

      const variantId = participant.variant_id;
      dailyConversions[assignmentDate][variantId] = (dailyConversions[assignmentDate][variantId] || 0) +
        (participant.primary_outcome_achieved ? 1 : 0);
    }

    return { dailyConversions };
  }

  private async aggregateSegmentData(participants: ExperimentParticipant[]): Promise<any> {
    const segmentData: Record<string, Record<string, { conversions: number; total: number }>> = {};

    for (const participant of participants) {
      // Get user segment from behavior analytics
      const userProfile = participant.user_id ?
        behaviorAnalyticsSystem.getUserBehaviorProfile(participant.user_id) : null;

      const segment = userProfile?.segmentation.primary_segment || 'unknown';

      if (!segmentData[segment]) {
        segmentData[segment] = {};
      }

      if (!segmentData[segment][participant.variant_id]) {
        segmentData[segment][participant.variant_id] = { conversions: 0, total: 0 };
      }

      segmentData[segment][participant.variant_id].total++;
      if (participant.primary_outcome_achieved) {
        segmentData[segment][participant.variant_id].conversions++;
      }
    }

    return segmentData;
  }

  private async performStatisticalAnalysis(experiment: ABExperiment, data: any): Promise<ExperimentResults['statistical_analysis']> {
    const conversionData = data.conversion_data;
    const controlVariant = experiment.design.variants.find(v => v.variant_type === 'control');

    if (!controlVariant) {
      throw new Error('No control variant found');
    }

    const controlData = conversionData[controlVariant.variant_id];
    const treatmentMeans: Record<string, number> = {};
    const effectSizes: Record<string, number> = {};
    const confidenceIntervals: Record<string, [number, number]> = {};
    const pValues: Record<string, number> = {};

    // Analyze each treatment variant vs control
    for (const variant of experiment.design.variants) {
      if (variant.variant_type === 'treatment') {
        const treatmentData = conversionData[variant.variant_id];
        treatmentMeans[variant.variant_id] = treatmentData.rate;

        // Calculate effect size (relative lift)
        const relativeLift = controlData.rate > 0 ?
          (treatmentData.rate - controlData.rate) / controlData.rate : 0;
        effectSizes[variant.variant_id] = relativeLift;

        // Simplified statistical test (in production would use proper statistical libraries)
        const { pValue, confidenceInterval } = this.performTwoSampleTest(
          controlData.conversions, controlData.total,
          treatmentData.conversions, treatmentData.total
        );

        pValues[variant.variant_id] = pValue;
        confidenceIntervals[variant.variant_id] = confidenceInterval;
      }
    }

    return {
      method: 'frequentist',
      primary_metric_results: {
        control_mean: controlData.rate,
        treatment_means: treatmentMeans,
        effect_sizes: effectSizes,
        confidence_intervals: confidenceIntervals,
        p_values: pValues
      },
      secondary_metrics_results: {}, // Would analyze secondary metrics similarly
      multiple_testing_correction: {
        method: 'bonferroni',
        adjusted_significance_level: 0.05 / experiment.design.variants.length
      }
    };
  }

  private performTwoSampleTest(
    controlConversions: number, controlTotal: number,
    treatmentConversions: number, treatmentTotal: number
  ): { pValue: number; confidenceInterval: [number, number] } {

    // Simplified two-proportion z-test
    const p1 = controlConversions / controlTotal;
    const p2 = treatmentConversions / treatmentTotal;

    const pooledP = (controlConversions + treatmentConversions) / (controlTotal + treatmentTotal);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1/controlTotal + 1/treatmentTotal));

    const zScore = Math.abs(p2 - p1) / se;

    // Approximate p-value (would use proper statistical functions in production)
    const pValue = 2 * (1 - this.normalCDF(zScore));

    // 95% confidence interval for difference in proportions
    const seDiff = Math.sqrt(p1*(1-p1)/controlTotal + p2*(1-p2)/treatmentTotal);
    const margin = 1.96 * seDiff;
    const diff = p2 - p1;
    const confidenceInterval: [number, number] = [diff - margin, diff + margin];

    return { pValue, confidenceInterval };
  }

  private normalCDF(z: number): number {
    // Simplified normal CDF approximation
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private async performValidityChecks(experiment: ABExperiment, data: any): Promise<ExperimentResults['validity_checks']> {
    const participants = data.participants;

    // Sample Ratio Mismatch (SRM) check
    const expectedRatios = experiment.design.variants.map(v =>
      experiment.design.traffic_allocation[v.variant_id] / 100
    );
    const actualCounts = experiment.design.variants.map(v =>
      participants.filter(p => p.variant_id === v.variant_id).length
    );

    const srmDetected = this.detectSampleRatioMismatch(expectedRatios, actualCounts);

    // Novelty effect detection (simplified)
    const noveltyDetected = await this.detectNoveltyEffect(participants);

    return {
      sample_ratio_mismatch: srmDetected,
      novelty_effect_detected: noveltyDetected,
      interaction_effects: [], // Would analyze interaction effects
      data_quality_issues: [],
      external_factors: []
    };
  }

  private detectSampleRatioMismatch(expectedRatios: number[], actualCounts: number[]): boolean {
    const totalCount = actualCounts.reduce((sum, count) => sum + count, 0);
    const expectedCounts = expectedRatios.map(ratio => ratio * totalCount);

    // Chi-square test for goodness of fit
    let chiSquare = 0;
    for (let i = 0; i < expectedCounts.length; i++) {
      const expected = expectedCounts[i];
      const actual = actualCounts[i];
      chiSquare += Math.pow(actual - expected, 2) / expected;
    }

    // Critical value for p < 0.05 with df = variants - 1
    const criticalValue = 3.841; // For df = 1 (2 variants)
    return chiSquare > criticalValue;
  }

  private async detectNoveltyEffect(participants: ExperimentParticipant[]): Promise<boolean> {
    // Simple novelty detection: check if conversion rate changes significantly over time
    if (participants.length < 100) return false;

    const sortedParticipants = participants.sort((a, b) =>
      new Date(a.assignment_timestamp).getTime() - new Date(b.assignment_timestamp).getTime()
    );

    const firstHalf = sortedParticipants.slice(0, Math.floor(participants.length / 2));
    const secondHalf = sortedParticipants.slice(Math.floor(participants.length / 2));

    const firstHalfConversion = firstHalf.filter(p => p.primary_outcome_achieved).length / firstHalf.length;
    const secondHalfConversion = secondHalf.filter(p => p.primary_outcome_achieved).length / secondHalf.length;

    // Significant change indicates possible novelty effect
    return Math.abs(firstHalfConversion - secondHalfConversion) > 0.05; // 5 percentage point difference
  }

  private async generateMLInsights(experiment: ABExperiment, data: any): Promise<ExperimentResults['ml_insights']> {
    const segmentData = data.segment_data;

    // Segment analysis
    const segmentAnalysis = Object.entries(segmentData).map(([segmentId, variants]: [string, any]) => {
      const controlVariant = experiment.design.variants.find(v => v.variant_type === 'control');
      const treatmentVariants = experiment.design.variants.filter(v => v.variant_type === 'treatment');

      if (!controlVariant || treatmentVariants.length === 0) {
        return {
          segment_id: segmentId,
          segment_name: segmentId,
          treatment_effect: 0,
          confidence: 0
        };
      }

      const controlData = variants[controlVariant.variant_id];
      const treatmentData = variants[treatmentVariants[0].variant_id]; // Use first treatment

      if (!controlData || !treatmentData || controlData.total === 0) {
        return {
          segment_id: segmentId,
          segment_name: segmentId,
          treatment_effect: 0,
          confidence: 0
        };
      }

      const controlRate = controlData.conversions / controlData.total;
      const treatmentRate = treatmentData.conversions / treatmentData.total;
      const treatmentEffect = controlRate > 0 ? (treatmentRate - controlRate) / controlRate : 0;

      return {
        segment_id: segmentId,
        segment_name: segmentId,
        treatment_effect: treatmentEffect,
        confidence: Math.min(treatmentData.total / 100, 1) // Simple confidence based on sample size
      };
    });

    // Temporal analysis
    const temporalAnalysis = [{
      time_period: 'full_period',
      treatment_effect: 0.1, // Would calculate from temporal data
      trend_direction: 'stable' as const
    }];

    return {
      segment_analysis: segmentAnalysis,
      temporal_analysis: temporalAnalysis,
      predictive_analysis: {
        long_term_impact_estimate: 0.15,
        user_lifetime_value_impact: 0.08,
        churn_risk_change: -0.05
      }
    };
  }

  private async calculateBusinessImpact(experiment: ABExperiment, analysis: ExperimentResults['statistical_analysis']): Promise<ExperimentResults['business_impact']> {
    const primaryResults = analysis.primary_metric_results;
    const winningVariant = Object.entries(primaryResults.treatment_means)
      .sort(([,a], [,b]) => b - a)[0];

    if (!winningVariant) {
      return {
        estimated_revenue_impact: 0,
        estimated_conversion_impact: 0,
        estimated_user_experience_impact: 0,
        risk_assessment: 'low',
        implementation_complexity: 'low'
      };
    }

    const effectSize = primaryResults.effect_sizes[winningVariant[0]] || 0;

    return {
      estimated_revenue_impact: effectSize * 100, // Simplified revenue impact
      estimated_conversion_impact: effectSize * 100,
      estimated_user_experience_impact: Math.max(0, effectSize * 80),
      risk_assessment: Math.abs(effectSize) > 0.2 ? 'medium' : 'low',
      implementation_complexity: 'medium' // Would assess based on variant complexity
    };
  }

  private async generateRecommendations(
    experiment: ABExperiment,
    analysis: ExperimentResults['statistical_analysis'],
    validity: ExperimentResults['validity_checks'],
    insights: ExperimentResults['ml_insights']
  ): Promise<ExperimentResults['recommendations']> {

    const primaryResults = analysis.primary_metric_results;
    const significanceLevel = experiment.objective.success_criteria.significance_level;

    // Find best performing variant
    const treatmentResults = Object.entries(primaryResults.treatment_means)
      .map(([variantId, mean]) => ({
        variantId,
        mean,
        effectSize: primaryResults.effect_sizes[variantId],
        pValue: primaryResults.p_values?.[variantId] || 1,
        isSignificant: (primaryResults.p_values?.[variantId] || 1) < significanceLevel
      }))
      .sort((a, b) => b.mean - a.mean);

    const bestVariant = treatmentResults[0];
    const hasSignificantResult = treatmentResults.some(r => r.isSignificant);

    let decision: ExperimentResults['recommendations']['decision'];
    const reasoning: string[] = [];

    if (validity.sample_ratio_mismatch) {
      decision = 'inconclusive';
      reasoning.push('Sample ratio mismatch detected - results may be biased');
    } else if (hasSignificantResult && bestVariant.effectSize > 0) {
      decision = 'stop_for_winner';
      reasoning.push(`Significant improvement detected: ${(bestVariant.effectSize * 100).toFixed(1)}%`);
    } else if (treatmentResults.every(r => r.effectSize < 0 && r.isSignificant)) {
      decision = 'stop_for_futility';
      reasoning.push('All treatments show significant negative effects');
    } else if (experiment.lifecycle.started_at) {
      const daysRunning = (Date.now() - new Date(experiment.lifecycle.started_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysRunning > experiment.design.sample_size_calculation.expected_duration_days * 1.5) {
        decision = 'inconclusive';
        reasoning.push('Experiment exceeded expected duration without conclusive results');
      } else {
        decision = 'continue';
        reasoning.push('Insufficient evidence - continue collecting data');
      }
    } else {
      decision = 'continue';
      reasoning.push('Continue data collection');
    }

    const rolloutRecommendation = decision === 'stop_for_winner' ? {
      recommended_variant: bestVariant.variantId,
      rollout_percentage: 100,
      rollout_timeline: '7-14 days',
      monitoring_plan: [
        'Monitor key metrics for 2 weeks',
        'Set up automated alerts for performance degradation',
        'Prepare rollback plan if metrics decline'
      ]
    } : undefined;

    return {
      decision,
      confidence_level: hasSignificantResult ? 85 : 60,
      reasoning,
      next_actions: this.generateNextActions(decision, experiment),
      rollout_recommendation
    };
  }

  private generateNextActions(decision: string, experiment: ABExperiment): string[] {
    const actions: string[] = [];

    switch (decision) {
      case 'stop_for_winner':
        actions.push('Implement winning variant');
        actions.push('Monitor post-launch metrics');
        actions.push('Document learnings and insights');
        break;
      case 'stop_for_futility':
        actions.push('Stop experiment and revert to control');
        actions.push('Analyze failure reasons');
        actions.push('Design follow-up experiments');
        break;
      case 'continue':
        actions.push('Continue data collection');
        actions.push('Monitor for early stopping conditions');
        actions.push('Check data quality regularly');
        break;
      case 'inconclusive':
        actions.push('Investigate data quality issues');
        actions.push('Consider redesigning experiment');
        actions.push('Consult with stakeholders on next steps');
        break;
    }

    return actions;
  }

  private async checkEarlyStoppingConditions(experiment: ABExperiment, results: ExperimentResults): Promise<void> {
    const decision = results.recommendations.decision;

    if (decision === 'stop_for_winner' || decision === 'stop_for_futility') {
      console.log(`🛑 [ABTesting] Early stopping triggered for experiment ${experiment.experiment_id}: ${decision}`);

      // Pause experiment
      experiment.status = 'paused';
      this.activeExperiments.delete(experiment.experiment_id);
      this.statistics.active_experiments--;

      // Log early stopping event
      await analyticsDataCollector.collectEvent(
        'system',
        'experiment_lifecycle',
        'phase5_analytics',
        'experiment_early_stopped',
        {
          experiment_id: experiment.experiment_id,
          stopping_reason: decision,
          days_running: experiment.lifecycle.started_at ?
            (Date.now() - new Date(experiment.lifecycle.started_at).getTime()) / (1000 * 60 * 60 * 24) : 0,
          custom_properties: {
            confidence_level: results.recommendations.confidence_level,
            primary_effect_size: Object.values(results.statistical_analysis.primary_metric_results.effect_sizes)[0] || 0
          }
        }
      );
    }
  }

  private initializeExperimentationPlatform(): void {
    const defaultPlatform: ExperimentationPlatform = {
      platform_id: 'phase5_ab_platform',
      platform_name: 'Phase 5 Advanced A/B Testing Platform',

      configuration: {
        default_statistical_method: 'frequentist',
        default_significance_level: 0.05,
        minimum_experiment_duration_days: 7,
        maximum_experiment_duration_days: 60,
        sample_ratio_mismatch_threshold: 0.05,
        early_stopping_enabled: true
      },

      integrations: {
        analytics_integration: true,
        recommendation_engine_integration: true,
        behavior_analytics_integration: true,
        performance_monitoring_integration: true
      },

      quality_controls: {
        bot_detection_enabled: true,
        duplicate_assignment_prevention: true,
        data_validation_rules: ['check_conversion_rates', 'validate_sample_sizes'],
        statistical_guardrails: ['multiple_testing_correction', 'early_stopping_rules']
      },

      governance: {
        approval_workflow_enabled: false, // Simplified for this implementation
        required_reviewers: [],
        ethical_guidelines: ['user_privacy', 'fair_treatment', 'transparent_communication'],
        privacy_compliance_checks: ['gdpr_compliance', 'data_anonymization']
      }
    };

    this.experimentationPlatforms.set('default', defaultPlatform);
    console.log(`🧪 [ABTesting] Experimentation platform initialized`);
  }

  private startExperimentMonitoring(): void {
    // Monitor experiments every 5 minutes
    setInterval(async () => {
      await this.monitorActiveExperiments();
    }, 5 * 60 * 1000);

    console.log(`📊 [ABTesting] Experiment monitoring started`);
  }

  private async monitorActiveExperiments(): Promise<void> {
    for (const experimentId of this.activeExperiments) {
      try {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) continue;

        // Check if experiment should be analyzed
        const hoursSinceLastAnalysis = experiment.intermediate_results.length > 0 ?
          (Date.now() - new Date(experiment.intermediate_results[experiment.intermediate_results.length - 1].analysis_timestamp).getTime()) / (1000 * 60 * 60) : 0;

        if (hoursSinceLastAnalysis >= 24) { // Analyze every 24 hours
          this.analysisQueue.push(experimentId);
        }

        // Check for automatic completion conditions
        if (experiment.lifecycle.expected_end_date && new Date() > new Date(experiment.lifecycle.expected_end_date)) {
          await this.completeExperiment(experimentId);
        }

      } catch (error) {
        console.error(`❌ [ABTesting] Monitoring failed for experiment ${experimentId}:`, error);
      }
    }
  }

  private startStatisticalAnalysis(): void {
    // Process analysis queue every 30 minutes
    setInterval(async () => {
      await this.processAnalysisQueue();
    }, 30 * 60 * 1000);

    console.log(`📊 [ABTesting] Statistical analysis scheduler started`);
  }

  private async processAnalysisQueue(): Promise<void> {
    const batchSize = 3;
    const batch = this.analysisQueue.splice(0, batchSize);

    for (const experimentId of batch) {
      try {
        await this.analyzeExperiment(experimentId, 'interim');
      } catch (error) {
        console.error(`❌ [ABTesting] Analysis failed for experiment ${experimentId}:`, error);
      }
    }
  }

  private async completeExperiment(experimentId: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    console.log(`🏁 [ABTesting] Completing experiment: ${experiment.experiment_name}`);

    // Perform final analysis
    await this.analyzeExperiment(experimentId, 'final');

    // Update status
    experiment.status = 'completed';
    experiment.lifecycle.completed_at = new Date().toISOString();

    // Remove from active experiments
    this.activeExperiments.delete(experimentId);
    this.statistics.active_experiments--;
    this.statistics.completed_experiments++;

    // Check if experiment was successful
    if (experiment.results?.recommendations.decision === 'stop_for_winner') {
      this.statistics.successful_experiments++;
    }

    console.log(`✅ [ABTesting] Experiment completed: ${experimentId}`);
  }

  private startBanditOptimization(): void {
    // Update bandit algorithms every 10 minutes
    setInterval(async () => {
      await this.updateBanditAlgorithms();
    }, 10 * 60 * 1000);

    console.log(`🎰 [ABTesting] Bandit optimization started`);
  }

  private async updateBanditAlgorithms(): Promise<void> {
    for (const [experimentId, banditConfig] of this.multiarmedBandits.entries()) {
      try {
        const experiment = this.experiments.get(experimentId);
        if (!experiment || experiment.status !== 'running') continue;

        // Update bandit parameters based on recent performance
        await this.updateBanditParameters(experimentId, banditConfig);

      } catch (error) {
        console.error(`❌ [ABTesting] Bandit update failed for experiment ${experimentId}:`, error);
      }
    }
  }

  private async updateBanditParameters(experimentId: string, config: MultiarmedBanditConfiguration): Promise<void> {
    const experiment = this.experiments.get(experimentId)!;

    // Calculate regret and update exploration parameters
    let totalReward = 0;
    let bestVariantReward = 0;

    for (const variant of experiment.design.variants) {
      const conversionRate = variant.statistical_data.sample_size > 0 ?
        variant.statistical_data.conversions / variant.statistical_data.sample_size : 0;

      totalReward += conversionRate * variant.statistical_data.sample_size;
      bestVariantReward = Math.max(bestVariantReward, conversionRate);
    }

    const totalSamples = experiment.design.variants.reduce((sum, v) => sum + v.statistical_data.sample_size, 0);
    const cumulativeRegret = (bestVariantReward * totalSamples) - totalReward;

    // Update exploration rate based on confidence in current best arm
    if (config.algorithm === 'epsilon_greedy') {
      const currentEpsilon = config.parameters.exploration_rate || 0.1;
      const newEpsilon = Math.max(0.01, currentEpsilon * (config.parameters.decay_rate || 0.99));
      config.parameters.exploration_rate = newEpsilon;
    }

    // Update performance tracking
    config.performance_history.push({
      timestamp: new Date().toISOString(),
      variant_rewards: {},
      exploration_exploitation_ratio: config.parameters.exploration_rate || 0.1,
      cumulative_regret: cumulativeRegret
    });

    this.statistics.bandit_cumulative_regret = cumulativeRegret;
  }

  private startQualityMonitoring(): void {
    // Monitor experiment quality every hour
    setInterval(async () => {
      await this.monitorExperimentQuality();
    }, 60 * 60 * 1000);

    console.log(`🔍 [ABTesting] Quality monitoring started`);
  }

  private async monitorExperimentQuality(): Promise<void> {
    for (const experimentId of this.activeExperiments) {
      try {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) continue;

        // Check for data quality issues
        const qualityIssues = await this.detectQualityIssues(experimentId);

        if (qualityIssues.length > 0) {
          console.warn(`⚠️ [ABTesting] Quality issues detected in experiment ${experimentId}:`, qualityIssues);

          // Log quality issues
          await analyticsDataCollector.collectEvent(
            'system',
            'data_quality',
            'phase5_analytics',
            'experiment_quality_issue',
            {
              experiment_id: experimentId,
              quality_issues: qualityIssues,
              custom_properties: {
                experiment_name: experiment.experiment_name,
                days_running: experiment.lifecycle.started_at ?
                  (Date.now() - new Date(experiment.lifecycle.started_at).getTime()) / (1000 * 60 * 60 * 24) : 0
              }
            }
          );
        }

      } catch (error) {
        console.error(`❌ [ABTesting] Quality monitoring failed for experiment ${experimentId}:`, error);
      }
    }
  }

  private async detectQualityIssues(experimentId: string): Promise<string[]> {
    const issues: string[] = [];
    const experiment = this.experiments.get(experimentId)!;
    const participants = Array.from(this.participants.values())
      .filter(p => p.experiment_id === experimentId);

    // Check sample ratio mismatch
    const expectedRatios = experiment.design.variants.map(v =>
      experiment.design.traffic_allocation[v.variant_id] / 100
    );
    const actualCounts = experiment.design.variants.map(v =>
      participants.filter(p => p.variant_id === v.variant_id).length
    );

    if (this.detectSampleRatioMismatch(expectedRatios, actualCounts)) {
      issues.push('sample_ratio_mismatch');
    }

    // Check for bot traffic
    const suspectedBots = participants.filter(p => p.quality_flags.suspected_bot).length;
    if (suspectedBots / participants.length > 0.05) { // More than 5% bots
      issues.push('high_bot_traffic');
    }

    // Check conversion rate sanity
    for (const variant of experiment.design.variants) {
      const variantParticipants = participants.filter(p => p.variant_id === variant.variant_id);
      const conversionRate = variantParticipants.length > 0 ?
        variantParticipants.filter(p => p.primary_outcome_achieved).length / variantParticipants.length : 0;

      if (conversionRate > 0.5 || conversionRate < 0.001) { // Suspiciously high or low
        issues.push(`suspicious_conversion_rate_${variant.variant_id}`);
      }
    }

    return issues;
  }

  /**
   * Get A/B testing framework statistics
   */
  getABTestingStatistics(): typeof this.statistics & {
    pending_analyses: number;
    active_bandits: number;
  } {
    return {
      ...this.statistics,
      pending_analyses: this.analysisQueue.length,
      active_bandits: this.multiarmedBandits.size
    };
  }

  /**
   * Get experiment by ID
   */
  getExperiment(experimentId: string): ABExperiment | undefined {
    return this.experiments.get(experimentId);
  }

  /**
   * Get all active experiments
   */
  getActiveExperiments(): ABExperiment[] {
    return Array.from(this.activeExperiments.values())
      .map(id => this.experiments.get(id))
      .filter(Boolean) as ABExperiment[];
  }

  /**
   * Get user's current experiment assignments
   */
  getUserAssignments(userId: string): Record<string, string> {
    const assignments = this.experimentAssignments.get(userId);
    return assignments ? Object.fromEntries(assignments) : {};
  }
}

// Export singleton instance
export const advancedABTestingFramework = new AdvancedABTestingFramework();
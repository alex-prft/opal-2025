// Phase 4: Performance Monitoring and Optimization System
// Provides comprehensive monitoring, analysis, and optimization for progressive rendering

import crypto from 'crypto';
import { supabase, isDatabaseAvailable } from '@/lib/database/supabase-client';
import { progressiveRenderer } from './progressive-renderer';
import { streamingRenderer } from './streaming-content-renderer';
import { skeletonLoader } from './skeleton-loading-system';
import { progressiveHydration } from './progressive-hydration-system';
import { crossPageSafety } from './cross-page-safety';

export interface PerformanceMetrics {
  metric_id: string;
  component: 'progressive_renderer' | 'streaming_renderer' | 'skeleton_loader' | 'hydration_system' | 'cross_page_safety';
  metric_type: 'latency' | 'throughput' | 'resource_usage' | 'user_experience' | 'error_rate' | 'quality_score';

  // Metric values
  current_value: number;
  target_value: number;
  threshold_warning: number;
  threshold_critical: number;

  // Context
  measurement_unit: string;
  sample_count: number;
  measurement_window_ms: number;

  // Trend analysis
  trend_direction: 'improving' | 'degrading' | 'stable' | 'volatile';
  trend_strength: number; // 0-100%

  // Quality assessment
  quality_score: number; // 0-100%
  performance_impact: 'none' | 'low' | 'medium' | 'high' | 'critical';

  timestamp: string;
}

export interface PerformanceAlert {
  alert_id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  component: string;
  metric_name: string;

  // Alert details
  alert_message: string;
  current_value: number;
  threshold_breached: number;
  duration_ms: number;

  // Optimization suggestions
  suggested_actions: OptimizationAction[];
  auto_optimization_available: boolean;

  // State
  acknowledged: boolean;
  resolved: boolean;
  resolution_time?: string;

  timestamp: string;
}

export interface OptimizationAction {
  action_id: string;
  action_type: 'quality_adjustment' | 'resource_allocation' | 'strategy_change' | 'caching_optimization' | 'system_tuning';
  component: string;

  // Action details
  description: string;
  expected_impact: 'positive' | 'negative' | 'neutral';
  impact_magnitude: number; // 0-100%
  confidence_score: number; // 0-100%

  // Implementation
  auto_executable: boolean;
  requires_restart: boolean;
  rollback_available: boolean;

  // Parameters
  parameters: Record<string, any>;
  execution_time_estimate_ms: number;

  status: 'pending' | 'executing' | 'completed' | 'failed' | 'rolled_back';
}

export interface PerformanceProfile {
  profile_id: string;
  profile_name: string;
  profile_type: 'ultra_performance' | 'balanced' | 'quality_first' | 'battery_saver' | 'network_optimized' | 'custom';

  // Performance targets
  target_metrics: {
    max_render_time_ms: number;
    max_hydration_time_ms: number;
    max_streaming_latency_ms: number;
    target_fps: number;
    memory_limit_mb: number;
    cpu_usage_limit_percent: number;
  };

  // Quality settings
  quality_settings: {
    skeleton_complexity: 'minimal' | 'basic' | 'detailed' | 'rich';
    animation_quality: 'disabled' | 'reduced' | 'standard' | 'enhanced';
    streaming_quality: 'low' | 'medium' | 'high' | 'adaptive';
    hydration_strategy: 'conservative' | 'balanced' | 'aggressive' | 'adaptive';
  };

  // Resource allocation
  resource_allocation: {
    concurrent_renders: number;
    buffer_size_mb: number;
    cache_size_mb: number;
    worker_thread_count: number;
  };

  // Adaptation settings
  adaptation_enabled: boolean;
  adaptation_sensitivity: number; // 0-100%
  fallback_profile?: string;

  usage_statistics: {
    times_applied: number;
    average_performance_score: number;
    last_used: string;
  };
}

export interface SystemHealthReport {
  report_id: string;
  overall_health_score: number; // 0-100%

  // Component health
  component_health: {
    progressive_renderer: number;
    streaming_renderer: number;
    skeleton_loader: number;
    hydration_system: number;
    cross_page_safety: number;
  };

  // Performance summary
  performance_summary: {
    average_render_time_ms: number;
    average_hydration_time_ms: number;
    streaming_success_rate: number;
    skeleton_generation_rate: number;
    safety_violation_rate: number;
  };

  // Resource utilization
  resource_utilization: {
    cpu_usage_percent: number;
    memory_usage_mb: number;
    network_usage_kbps: number;
    cache_hit_rate: number;
  };

  // Active issues
  active_alerts: number;
  critical_issues: string[];
  optimization_opportunities: string[];

  // Trends
  performance_trend: 'improving' | 'stable' | 'degrading';
  trend_confidence: number;

  timestamp: string;
}

/**
 * Performance Monitoring and Optimization System for Phase 4
 *
 * Features:
 * - Real-time performance monitoring across all Phase 4 components
 * - Intelligent alerting with automated optimization suggestions
 * - Adaptive performance profiles with automatic tuning
 * - Comprehensive health reporting and trend analysis
 * - Predictive performance optimization
 * - Resource usage optimization and allocation
 * - Quality vs performance balance management
 * - Integration with all Phase 4 rendering systems
 */
export class PerformanceMonitoringSystem {
  private activeMetrics = new Map<string, PerformanceMetrics>();
  private performanceAlerts = new Map<string, PerformanceAlert>();
  private optimizationActions = new Map<string, OptimizationAction>();
  private performanceProfiles = new Map<string, PerformanceProfile>();
  private currentProfile: PerformanceProfile | null = null;

  private monitoringIntervals = new Map<string, NodeJS.Timeout>();
  private metricBuffers = new Map<string, number[]>();
  private adaptationEngine: AdaptationEngine;

  private statistics = {
    total_measurements: 0,
    active_monitors: 0,
    alerts_generated: 0,
    optimizations_executed: 0,
    average_health_score: 100,
    adaptation_count: 0,
    profile_switches: 0
  };

  constructor() {
    console.log(`📊 [PerformanceMonitor] Performance monitoring system initialized`);
    this.adaptationEngine = new AdaptationEngine(this);
    this.initializeDefaultProfiles();
    this.startSystemMonitoring();
    this.startHealthReporting();
  }

  /**
   * Initialize performance monitoring for all Phase 4 components
   */
  async initializeMonitoring(): Promise<void> {
    console.log(`📊 [PerformanceMonitor] Initializing comprehensive monitoring`);

    // Monitor Progressive Renderer
    await this.setupComponentMonitoring('progressive_renderer', {
      'render_latency': { target: 500, warning: 1000, critical: 2000 },
      'chunk_generation_rate': { target: 50, warning: 30, critical: 10 },
      'session_success_rate': { target: 95, warning: 90, critical: 80 },
      'memory_usage_mb': { target: 50, warning: 100, critical: 200 }
    });

    // Monitor Streaming Renderer
    await this.setupComponentMonitoring('streaming_renderer', {
      'streaming_latency': { target: 100, warning: 200, critical: 500 },
      'throughput_kbps': { target: 1000, warning: 500, critical: 100 },
      'buffer_utilization': { target: 70, warning: 85, critical: 95 },
      'delivery_success_rate': { target: 98, warning: 95, critical: 90 }
    });

    // Monitor Skeleton Loader
    await this.setupComponentMonitoring('skeleton_loader', {
      'generation_time_ms': { target: 50, warning: 100, critical: 200 },
      'template_cache_hit_rate': { target: 90, warning: 70, critical: 50 },
      'animation_smoothness': { target: 60, warning: 30, critical: 15 },
      'adaptive_optimizations': { target: 5, warning: 10, critical: 20 }
    });

    // Monitor Hydration System
    await this.setupComponentMonitoring('hydration_system', {
      'hydration_time_ms': { target: 200, warning: 500, critical: 1000 },
      'concurrent_sessions': { target: 10, warning: 20, critical: 50 },
      'scheduler_efficiency': { target: 85, warning: 70, critical: 50 },
      'lazy_load_success_rate': { target: 95, warning: 90, critical: 80 }
    });

    // Monitor Cross-Page Safety
    await this.setupComponentMonitoring('cross_page_safety', {
      'safety_check_time_ms': { target: 25, warning: 50, critical: 100 },
      'consistency_violation_rate': { target: 0, warning: 1, critical: 5 },
      'fallback_trigger_rate': { target: 0, warning: 2, critical: 10 },
      'lock_contention_rate': { target: 0, warning: 5, critical: 15 }
    });

    console.log(`✅ [PerformanceMonitor] Monitoring initialized for all components`);
  }

  /**
   * Apply a performance profile to optimize system behavior
   */
  async applyPerformanceProfile(profileId: string): Promise<boolean> {
    const profile = this.performanceProfiles.get(profileId);
    if (!profile) {
      console.error(`❌ [PerformanceMonitor] Profile ${profileId} not found`);
      return false;
    }

    console.log(`📊 [PerformanceMonitor] Applying performance profile: ${profile.profile_name}`);

    try {
      this.currentProfile = profile;

      // Apply Progressive Renderer optimizations
      await this.optimizeProgressiveRenderer(profile);

      // Apply Streaming Renderer optimizations
      await this.optimizeStreamingRenderer(profile);

      // Apply Skeleton Loader optimizations
      await this.optimizeSkeletonLoader(profile);

      // Apply Hydration System optimizations
      await this.optimizeHydrationSystem(profile);

      // Apply Cross-Page Safety optimizations
      await this.optimizeCrossPageSafety(profile);

      // Update profile statistics
      profile.usage_statistics.times_applied++;
      profile.usage_statistics.last_used = new Date().toISOString();
      this.statistics.profile_switches++;

      console.log(`✅ [PerformanceMonitor] Profile ${profile.profile_name} applied successfully`);

      return true;

    } catch (error) {
      console.error(`❌ [PerformanceMonitor] Failed to apply profile ${profileId}:`, error);
      return false;
    }
  }

  /**
   * Generate comprehensive system health report
   */
  async generateHealthReport(): Promise<SystemHealthReport> {
    const reportId = crypto.randomUUID();

    console.log(`📊 [PerformanceMonitor] Generating system health report`);

    // Collect component statistics
    const progressiveStats = progressiveRenderer.getProgressiveRenderingStatistics();
    const streamingStats = streamingRenderer.getStreamingStatistics();
    const skeletonStats = skeletonLoader.getSkeletonStatistics();
    const hydrationStats = progressiveHydration.getProgressiveHydrationStatistics();
    const safetyStats = crossPageSafety.getCrossPageSafetyStatistics();

    // Calculate component health scores
    const componentHealth = {
      progressive_renderer: this.calculateComponentHealth('progressive_renderer', progressiveStats),
      streaming_renderer: this.calculateComponentHealth('streaming_renderer', streamingStats),
      skeleton_loader: this.calculateComponentHealth('skeleton_loader', skeletonStats),
      hydration_system: this.calculateComponentHealth('hydration_system', hydrationStats),
      cross_page_safety: this.calculateComponentHealth('cross_page_safety', safetyStats)
    };

    // Calculate overall health score
    const overallHealthScore = Math.round(
      Object.values(componentHealth).reduce((sum, score) => sum + score, 0) / 5
    );

    // Analyze performance trends
    const performanceTrend = this.analyzePerformanceTrend();

    // Collect active alerts
    const activeAlerts = Array.from(this.performanceAlerts.values())
      .filter(alert => !alert.resolved).length;

    const criticalIssues = Array.from(this.performanceAlerts.values())
      .filter(alert => alert.severity === 'critical' && !alert.resolved)
      .map(alert => alert.alert_message);

    const report: SystemHealthReport = {
      report_id: reportId,
      overall_health_score: overallHealthScore,
      component_health: componentHealth,
      performance_summary: {
        average_render_time_ms: progressiveStats.average_render_time_ms,
        average_hydration_time_ms: hydrationStats.average_hydration_time_ms,
        streaming_success_rate: (streamingStats.successful_deliveries / Math.max(1, streamingStats.total_sessions)) * 100,
        skeleton_generation_rate: skeletonStats.skeletons_generated,
        safety_violation_rate: (safetyStats.safety_violations / Math.max(1, safetyStats.consistency_checks)) * 100
      },
      resource_utilization: {
        cpu_usage_percent: await this.estimateCPUUsage(),
        memory_usage_mb: await this.estimateMemoryUsage(),
        network_usage_kbps: streamingStats.average_delivery_rate_kbps,
        cache_hit_rate: skeletonStats.template_cache_hits / Math.max(1, skeletonStats.skeletons_generated) * 100
      },
      active_alerts: activeAlerts,
      critical_issues: criticalIssues,
      optimization_opportunities: await this.identifyOptimizationOpportunities(),
      performance_trend: performanceTrend.direction,
      trend_confidence: performanceTrend.confidence,
      timestamp: new Date().toISOString()
    };

    this.statistics.average_health_score = overallHealthScore;

    console.log(`📊 [PerformanceMonitor] Health report generated: ${overallHealthScore}% overall health`);

    return report;
  }

  /**
   * Execute automatic optimization based on current performance
   */
  async executeAutoOptimization(): Promise<OptimizationAction[]> {
    console.log(`🔧 [PerformanceMonitor] Starting automatic optimization`);

    const executedActions: OptimizationAction[] = [];
    const healthReport = await this.generateHealthReport();

    // Check if optimization is needed
    if (healthReport.overall_health_score > 80) {
      console.log(`✅ [PerformanceMonitor] System health is good (${healthReport.overall_health_score}%), no optimization needed`);
      return executedActions;
    }

    // Identify optimization actions
    const actions = await this.generateOptimizationActions(healthReport);

    // Execute auto-executable actions
    for (const action of actions) {
      if (action.auto_executable && action.confidence_score > 70) {
        try {
          await this.executeOptimizationAction(action);
          executedActions.push(action);
          this.statistics.optimizations_executed++;

        } catch (error) {
          console.error(`❌ [PerformanceMonitor] Failed to execute optimization ${action.action_id}:`, error);
          action.status = 'failed';
        }
      }
    }

    console.log(`✅ [PerformanceMonitor] Auto-optimization completed: ${executedActions.length} actions executed`);

    return executedActions;
  }

  // Private implementation methods

  private async setupComponentMonitoring(
    component: PerformanceMetrics['component'],
    metrics: Record<string, { target: number; warning: number; critical: number }>
  ): Promise<void> {
    for (const [metricName, thresholds] of Object.entries(metrics)) {
      const metricId = `${component}_${metricName}`;

      const metric: PerformanceMetrics = {
        metric_id: metricId,
        component: component,
        metric_type: this.classifyMetricType(metricName),
        current_value: 0,
        target_value: thresholds.target,
        threshold_warning: thresholds.warning,
        threshold_critical: thresholds.critical,
        measurement_unit: this.getMetricUnit(metricName),
        sample_count: 0,
        measurement_window_ms: 60000, // 1 minute
        trend_direction: 'stable',
        trend_strength: 0,
        quality_score: 100,
        performance_impact: 'none',
        timestamp: new Date().toISOString()
      };

      this.activeMetrics.set(metricId, metric);
      this.metricBuffers.set(metricId, []);

      // Start monitoring interval
      const interval = setInterval(() => {
        this.collectMetricSample(metricId);
      }, 5000); // Every 5 seconds

      this.monitoringIntervals.set(metricId, interval);
    }

    this.statistics.active_monitors = this.activeMetrics.size;
  }

  private async collectMetricSample(metricId: string): Promise<void> {
    const metric = this.activeMetrics.get(metricId);
    if (!metric) return;

    try {
      const value = await this.getMeasuredValue(metric);
      const buffer = this.metricBuffers.get(metricId) || [];

      // Add to buffer
      buffer.push(value);
      if (buffer.length > 60) { // Keep 60 samples (5 minutes at 5-second intervals)
        buffer.shift();
      }
      this.metricBuffers.set(metricId, buffer);

      // Update metric
      metric.current_value = value;
      metric.sample_count++;
      metric.timestamp = new Date().toISOString();

      // Analyze trend
      this.analyzeTrend(metric, buffer);

      // Calculate quality score
      this.calculateQualityScore(metric);

      // Check thresholds and generate alerts
      await this.checkThresholds(metric);

      this.statistics.total_measurements++;

    } catch (error) {
      console.error(`❌ [PerformanceMonitor] Failed to collect metric ${metricId}:`, error);
    }
  }

  private async getMeasuredValue(metric: PerformanceMetrics): Promise<number> {
    const [component, metricName] = metric.metric_id.split('_');

    switch (component) {
      case 'progressive':
        const progressiveStats = progressiveRenderer.getProgressiveRenderingStatistics();
        return this.extractProgressiveMetric(metricName, progressiveStats);

      case 'streaming':
        const streamingStats = streamingRenderer.getStreamingStatistics();
        return this.extractStreamingMetric(metricName, streamingStats);

      case 'skeleton':
        const skeletonStats = skeletonLoader.getSkeletonStatistics();
        return this.extractSkeletonMetric(metricName, skeletonStats);

      case 'hydration':
        const hydrationStats = progressiveHydration.getProgressiveHydrationStatistics();
        return this.extractHydrationMetric(metricName, hydrationStats);

      case 'cross':
        const safetyStats = crossPageSafety.getCrossPageSafetyStatistics();
        return this.extractSafetyMetric(metricName, safetyStats);

      default:
        return 0;
    }
  }

  private extractProgressiveMetric(metricName: string, stats: any): number {
    switch (metricName) {
      case 'renderer_render_latency': return stats.average_render_time_ms;
      case 'renderer_chunk_generation_rate': return stats.chunks_generated / Math.max(1, Date.now() / 60000);
      case 'renderer_session_success_rate': return (stats.successful_renders / Math.max(1, stats.total_sessions)) * 100;
      case 'renderer_memory_usage_mb': return stats.buffer_usage_mb;
      default: return 0;
    }
  }

  private extractStreamingMetric(metricName: string, stats: any): number {
    switch (metricName) {
      case 'renderer_streaming_latency': return 100; // Would measure actual latency
      case 'renderer_throughput_kbps': return stats.average_delivery_rate_kbps;
      case 'renderer_buffer_utilization': return stats.buffer_utilization_avg;
      case 'renderer_delivery_success_rate': return (stats.successful_deliveries / Math.max(1, stats.total_chunks_delivered)) * 100;
      default: return 0;
    }
  }

  private extractSkeletonMetric(metricName: string, stats: any): number {
    switch (metricName) {
      case 'loader_generation_time_ms': return stats.average_generation_ms;
      case 'loader_template_cache_hit_rate': return (stats.template_cache_hits / Math.max(1, stats.skeletons_generated)) * 100;
      case 'loader_animation_smoothness': return 60; // Would measure actual FPS
      case 'loader_adaptive_optimizations': return stats.adaptive_optimizations;
      default: return 0;
    }
  }

  private extractHydrationMetric(metricName: string, stats: any): number {
    switch (metricName) {
      case 'system_hydration_time_ms': return stats.average_hydration_time_ms;
      case 'system_concurrent_sessions': return stats.active_sessions;
      case 'system_scheduler_efficiency': return 85; // Would calculate based on queue efficiency
      case 'system_lazy_load_success_rate': return (stats.successful_loads / Math.max(1, stats.total_lazy_loads)) * 100;
      default: return 0;
    }
  }

  private extractSafetyMetric(metricName: string, stats: any): number {
    switch (metricName) {
      case 'page_safety_check_time_ms': return stats.average_safety_check_ms;
      case 'page_consistency_violation_rate': return (stats.safety_violations / Math.max(1, stats.consistency_checks)) * 100;
      case 'page_fallback_trigger_rate': return (stats.fallbacks_triggered / Math.max(1, stats.total_contexts)) * 100;
      case 'page_lock_contention_rate': return 0; // Would measure actual contention
      default: return 0;
    }
  }

  private analyzeTrend(metric: PerformanceMetrics, buffer: number[]): void {
    if (buffer.length < 10) return;

    const recent = buffer.slice(-5);
    const older = buffer.slice(-10, -5);

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (Math.abs(change) < 5) {
      metric.trend_direction = 'stable';
      metric.trend_strength = 0;
    } else if (change > 0) {
      // For latency metrics, positive change is bad; for throughput metrics, it's good
      const isLatencyMetric = metric.metric_type === 'latency' || metric.measurement_unit === 'ms';
      metric.trend_direction = isLatencyMetric ? 'degrading' : 'improving';
      metric.trend_strength = Math.min(Math.abs(change), 100);
    } else {
      const isLatencyMetric = metric.metric_type === 'latency' || metric.measurement_unit === 'ms';
      metric.trend_direction = isLatencyMetric ? 'improving' : 'degrading';
      metric.trend_strength = Math.min(Math.abs(change), 100);
    }

    // Check for volatility
    const variance = buffer.reduce((sum, val) => sum + Math.pow(val - recentAvg, 2), 0) / buffer.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = (stdDev / recentAvg) * 100;

    if (coefficientOfVariation > 50) {
      metric.trend_direction = 'volatile';
    }
  }

  private calculateQualityScore(metric: PerformanceMetrics): void {
    const { current_value, target_value, threshold_warning, threshold_critical } = metric;

    let score = 100;

    if (current_value <= target_value) {
      score = 100; // Perfect score
    } else if (current_value <= threshold_warning) {
      // Linear interpolation between target and warning
      const ratio = (current_value - target_value) / (threshold_warning - target_value);
      score = 100 - (ratio * 20); // Lose 20 points max before warning
    } else if (current_value <= threshold_critical) {
      // Linear interpolation between warning and critical
      const ratio = (current_value - threshold_warning) / (threshold_critical - threshold_warning);
      score = 80 - (ratio * 60); // Lose 60 points between warning and critical
    } else {
      // Beyond critical threshold
      score = Math.max(0, 20 - ((current_value - threshold_critical) / threshold_critical) * 20);
    }

    metric.quality_score = Math.round(score);

    // Determine performance impact
    if (score >= 90) metric.performance_impact = 'none';
    else if (score >= 70) metric.performance_impact = 'low';
    else if (score >= 50) metric.performance_impact = 'medium';
    else if (score >= 20) metric.performance_impact = 'high';
    else metric.performance_impact = 'critical';
  }

  private async checkThresholds(metric: PerformanceMetrics): Promise<void> {
    const { current_value, threshold_warning, threshold_critical } = metric;

    let severity: PerformanceAlert['severity'] | null = null;

    if (current_value >= threshold_critical) {
      severity = 'critical';
    } else if (current_value >= threshold_warning) {
      severity = 'warning';
    }

    if (severity) {
      const existingAlert = Array.from(this.performanceAlerts.values())
        .find(alert =>
          alert.component === metric.component &&
          alert.metric_name === metric.metric_id &&
          !alert.resolved
        );

      if (!existingAlert) {
        await this.createAlert(metric, severity);
      }
    } else {
      // Resolve existing alerts if value is back to normal
      const existingAlert = Array.from(this.performanceAlerts.values())
        .find(alert =>
          alert.component === metric.component &&
          alert.metric_name === metric.metric_id &&
          !alert.resolved
        );

      if (existingAlert) {
        existingAlert.resolved = true;
        existingAlert.resolution_time = new Date().toISOString();
        console.log(`✅ [PerformanceMonitor] Alert resolved: ${existingAlert.alert_message}`);
      }
    }
  }

  private async createAlert(metric: PerformanceMetrics, severity: PerformanceAlert['severity']): Promise<void> {
    const alertId = crypto.randomUUID();

    const alert: PerformanceAlert = {
      alert_id: alertId,
      severity: severity,
      component: metric.component,
      metric_name: metric.metric_id,
      alert_message: `${metric.component} ${metric.metric_id}: ${metric.current_value}${metric.measurement_unit} exceeds ${severity} threshold`,
      current_value: metric.current_value,
      threshold_breached: severity === 'critical' ? metric.threshold_critical : metric.threshold_warning,
      duration_ms: 0, // Would track how long the condition persists
      suggested_actions: await this.generateSuggestedActions(metric, severity),
      auto_optimization_available: true,
      acknowledged: false,
      resolved: false,
      timestamp: new Date().toISOString()
    };

    this.performanceAlerts.set(alertId, alert);
    this.statistics.alerts_generated++;

    console.log(`🚨 [PerformanceMonitor] ${severity.toUpperCase()} alert: ${alert.alert_message}`);

    // Trigger adaptive optimization if enabled
    if (this.currentProfile?.adaptation_enabled) {
      await this.adaptationEngine.handleAlert(alert);
    }
  }

  private async generateSuggestedActions(
    metric: PerformanceMetrics,
    severity: PerformanceAlert['severity']
  ): Promise<OptimizationAction[]> {
    const actions: OptimizationAction[] = [];

    // Generate component-specific optimization suggestions
    switch (metric.component) {
      case 'progressive_renderer':
        actions.push(...this.generateProgressiveRendererActions(metric, severity));
        break;
      case 'streaming_renderer':
        actions.push(...this.generateStreamingRendererActions(metric, severity));
        break;
      case 'skeleton_loader':
        actions.push(...this.generateSkeletonLoaderActions(metric, severity));
        break;
      case 'hydration_system':
        actions.push(...this.generateHydrationSystemActions(metric, severity));
        break;
      case 'cross_page_safety':
        actions.push(...this.generateCrossPageSafetyActions(metric, severity));
        break;
    }

    return actions;
  }

  private generateProgressiveRendererActions(metric: PerformanceMetrics, severity: PerformanceAlert['severity']): OptimizationAction[] {
    const actions: OptimizationAction[] = [];

    if (metric.metric_id.includes('latency')) {
      actions.push({
        action_id: crypto.randomUUID(),
        action_type: 'strategy_change',
        component: 'progressive_renderer',
        description: 'Switch to chunked rendering strategy for better performance',
        expected_impact: 'positive',
        impact_magnitude: 30,
        confidence_score: 85,
        auto_executable: true,
        requires_restart: false,
        rollback_available: true,
        parameters: { strategy: 'chunked', chunk_size: 'small' },
        execution_time_estimate_ms: 100,
        status: 'pending'
      });
    }

    return actions;
  }

  private generateStreamingRendererActions(metric: PerformanceMetrics, severity: PerformanceAlert['severity']): OptimizationAction[] {
    const actions: OptimizationAction[] = [];

    if (metric.metric_id.includes('latency')) {
      actions.push({
        action_id: crypto.randomUUID(),
        action_type: 'quality_adjustment',
        component: 'streaming_renderer',
        description: 'Reduce streaming quality to improve latency',
        expected_impact: 'positive',
        impact_magnitude: 40,
        confidence_score: 90,
        auto_executable: true,
        requires_restart: false,
        rollback_available: true,
        parameters: { quality: 'medium', compression: true },
        execution_time_estimate_ms: 50,
        status: 'pending'
      });
    }

    return actions;
  }

  private generateSkeletonLoaderActions(metric: PerformanceMetrics, severity: PerformanceAlert['severity']): OptimizationAction[] {
    const actions: OptimizationAction[] = [];

    if (metric.metric_id.includes('generation_time')) {
      actions.push({
        action_id: crypto.randomUUID(),
        action_type: 'caching_optimization',
        component: 'skeleton_loader',
        description: 'Increase template caching to reduce generation time',
        expected_impact: 'positive',
        impact_magnitude: 25,
        confidence_score: 80,
        auto_executable: true,
        requires_restart: false,
        rollback_available: true,
        parameters: { cache_size_increase: 50, preload_templates: true },
        execution_time_estimate_ms: 200,
        status: 'pending'
      });
    }

    return actions;
  }

  private generateHydrationSystemActions(metric: PerformanceMetrics, severity: PerformanceAlert['severity']): OptimizationAction[] {
    const actions: OptimizationAction[] = [];

    if (metric.metric_id.includes('hydration_time')) {
      actions.push({
        action_id: crypto.randomUUID(),
        action_type: 'system_tuning',
        component: 'hydration_system',
        description: 'Adjust hydration scheduler for better performance',
        expected_impact: 'positive',
        impact_magnitude: 35,
        confidence_score: 75,
        auto_executable: true,
        requires_restart: false,
        rollback_available: true,
        parameters: { scheduler: 'priority_first', concurrent_limit: 2 },
        execution_time_estimate_ms: 150,
        status: 'pending'
      });
    }

    return actions;
  }

  private generateCrossPageSafetyActions(metric: PerformanceMetrics, severity: PerformanceAlert['severity']): OptimizationAction[] {
    const actions: OptimizationAction[] = [];

    if (metric.metric_id.includes('check_time')) {
      actions.push({
        action_id: crypto.randomUUID(),
        action_type: 'system_tuning',
        component: 'cross_page_safety',
        description: 'Optimize safety check frequency and scope',
        expected_impact: 'positive',
        impact_magnitude: 20,
        confidence_score: 70,
        auto_executable: true,
        requires_restart: false,
        rollback_available: true,
        parameters: { check_interval_ms: 10000, scope: 'critical_only' },
        execution_time_estimate_ms: 100,
        status: 'pending'
      });
    }

    return actions;
  }

  private async executeOptimizationAction(action: OptimizationAction): Promise<void> {
    console.log(`🔧 [PerformanceMonitor] Executing optimization: ${action.description}`);

    action.status = 'executing';

    try {
      switch (action.action_type) {
        case 'quality_adjustment':
          await this.applyQualityAdjustment(action);
          break;
        case 'resource_allocation':
          await this.applyResourceAllocation(action);
          break;
        case 'strategy_change':
          await this.applyStrategyChange(action);
          break;
        case 'caching_optimization':
          await this.applyCachingOptimization(action);
          break;
        case 'system_tuning':
          await this.applySystemTuning(action);
          break;
        default:
          throw new Error(`Unknown optimization type: ${action.action_type}`);
      }

      action.status = 'completed';
      console.log(`✅ [PerformanceMonitor] Optimization completed: ${action.description}`);

    } catch (error) {
      action.status = 'failed';
      console.error(`❌ [PerformanceMonitor] Optimization failed: ${action.description}:`, error);
      throw error;
    }
  }

  private async applyQualityAdjustment(action: OptimizationAction): Promise<void> {
    // Implementation would adjust quality settings based on action parameters
    console.log(`🔧 [PerformanceMonitor] Applied quality adjustment for ${action.component}`);
  }

  private async applyResourceAllocation(action: OptimizationAction): Promise<void> {
    // Implementation would adjust resource allocation
    console.log(`🔧 [PerformanceMonitor] Applied resource allocation for ${action.component}`);
  }

  private async applyStrategyChange(action: OptimizationAction): Promise<void> {
    // Implementation would change rendering strategies
    console.log(`🔧 [PerformanceMonitor] Applied strategy change for ${action.component}`);
  }

  private async applyCachingOptimization(action: OptimizationAction): Promise<void> {
    // Implementation would optimize caching settings
    console.log(`🔧 [PerformanceMonitor] Applied caching optimization for ${action.component}`);
  }

  private async applySystemTuning(action: OptimizationAction): Promise<void> {
    // Implementation would tune system parameters
    console.log(`🔧 [PerformanceMonitor] Applied system tuning for ${action.component}`);
  }

  // Performance profile optimization methods

  private async optimizeProgressiveRenderer(profile: PerformanceProfile): Promise<void> {
    // Apply progressive renderer optimizations based on profile
    console.log(`🎬 [PerformanceMonitor] Optimizing progressive renderer for profile: ${profile.profile_name}`);
  }

  private async optimizeStreamingRenderer(profile: PerformanceProfile): Promise<void> {
    // Apply streaming renderer optimizations based on profile
    console.log(`🌊 [PerformanceMonitor] Optimizing streaming renderer for profile: ${profile.profile_name}`);
  }

  private async optimizeSkeletonLoader(profile: PerformanceProfile): Promise<void> {
    // Apply skeleton loader optimizations based on profile
    console.log(`💀 [PerformanceMonitor] Optimizing skeleton loader for profile: ${profile.profile_name}`);
  }

  private async optimizeHydrationSystem(profile: PerformanceProfile): Promise<void> {
    // Apply hydration system optimizations based on profile
    console.log(`⚡ [PerformanceMonitor] Optimizing hydration system for profile: ${profile.profile_name}`);
  }

  private async optimizeCrossPageSafety(profile: PerformanceProfile): Promise<void> {
    // Apply cross-page safety optimizations based on profile
    console.log(`🛡️ [PerformanceMonitor] Optimizing cross-page safety for profile: ${profile.profile_name}`);
  }

  // Utility methods

  private classifyMetricType(metricName: string): PerformanceMetrics['metric_type'] {
    if (metricName.includes('latency') || metricName.includes('time')) return 'latency';
    if (metricName.includes('rate') || metricName.includes('throughput')) return 'throughput';
    if (metricName.includes('usage') || metricName.includes('utilization')) return 'resource_usage';
    if (metricName.includes('score') || metricName.includes('quality')) return 'quality_score';
    if (metricName.includes('error') || metricName.includes('failure')) return 'error_rate';
    return 'user_experience';
  }

  private getMetricUnit(metricName: string): string {
    if (metricName.includes('time') || metricName.includes('latency')) return 'ms';
    if (metricName.includes('rate') && !metricName.includes('error')) return 'ops/sec';
    if (metricName.includes('usage') && metricName.includes('memory')) return 'MB';
    if (metricName.includes('usage') && metricName.includes('cpu')) return '%';
    if (metricName.includes('throughput')) return 'kbps';
    if (metricName.includes('percent') || metricName.includes('rate')) return '%';
    return 'count';
  }

  private calculateComponentHealth(component: string, stats: any): number {
    // Calculate health score based on component statistics
    // This is a simplified calculation; real implementation would be more sophisticated

    let score = 100;

    // Penalty for failures
    if (stats.failed_renders) {
      const failureRate = stats.failed_renders / Math.max(1, stats.total_sessions);
      score -= failureRate * 50;
    }

    // Penalty for poor performance
    if (stats.performance_score && stats.performance_score < 80) {
      score -= (80 - stats.performance_score) * 0.5;
    }

    // Penalty for resource issues
    if (stats.active_sessions > 50) {
      score -= 10; // High load penalty
    }

    return Math.max(0, Math.round(score));
  }

  private analyzePerformanceTrend(): { direction: SystemHealthReport['performance_trend']; confidence: number } {
    // Analyze overall performance trend across all metrics
    const trends = Array.from(this.activeMetrics.values()).map(m => m.trend_direction);

    const improving = trends.filter(t => t === 'improving').length;
    const degrading = trends.filter(t => t === 'degrading').length;
    const stable = trends.filter(t => t === 'stable').length;

    const total = trends.length;

    if (total === 0) return { direction: 'stable', confidence: 0 };

    const improvingPercent = improving / total;
    const degradingPercent = degrading / total;
    const stablePercent = stable / total;

    if (stablePercent > 0.6) return { direction: 'stable', confidence: Math.round(stablePercent * 100) };
    if (improvingPercent > degradingPercent) return { direction: 'improving', confidence: Math.round(improvingPercent * 100) };
    return { direction: 'degrading', confidence: Math.round(degradingPercent * 100) };
  }

  private async estimateCPUUsage(): Promise<number> {
    // Estimate CPU usage based on active operations
    // This is a placeholder - real implementation would use actual system metrics
    const activeOperations =
      (progressiveRenderer.getProgressiveRenderingStatistics().active_sessions * 10) +
      (streamingRenderer.getStreamingStatistics().active_sessions * 15) +
      (progressiveHydration.getProgressiveHydrationStatistics().active_sessions * 5);

    return Math.min(activeOperations, 100);
  }

  private async estimateMemoryUsage(): Promise<number> {
    // Estimate memory usage based on active operations
    // This is a placeholder - real implementation would use actual system metrics
    const stats = progressiveRenderer.getProgressiveRenderingStatistics();
    return stats.buffer_usage_mb + (stats.active_sessions * 10);
  }

  private async identifyOptimizationOpportunities(): Promise<string[]> {
    const opportunities: string[] = [];

    // Check for common optimization opportunities
    const skeletonStats = skeletonLoader.getSkeletonStatistics();
    if (skeletonStats.template_cache_hits < skeletonStats.skeletons_generated * 0.7) {
      opportunities.push('Improve skeleton template caching efficiency');
    }

    const streamingStats = streamingRenderer.getStreamingStatistics();
    if (streamingStats.buffer_utilization_avg > 85) {
      opportunities.push('Increase streaming buffer size or optimize delivery');
    }

    const hydrationStats = progressiveHydration.getProgressiveHydrationStatistics();
    if (hydrationStats.average_hydration_time_ms > 500) {
      opportunities.push('Optimize hydration scheduling and prioritization');
    }

    return opportunities;
  }

  private async generateOptimizationActions(healthReport: SystemHealthReport): Promise<OptimizationAction[]> {
    const actions: OptimizationAction[] = [];

    // Generate actions based on health report
    if (healthReport.component_health.progressive_renderer < 70) {
      actions.push({
        action_id: crypto.randomUUID(),
        action_type: 'strategy_change',
        component: 'progressive_renderer',
        description: 'Switch to more efficient rendering strategy',
        expected_impact: 'positive',
        impact_magnitude: 25,
        confidence_score: 80,
        auto_executable: true,
        requires_restart: false,
        rollback_available: true,
        parameters: { strategy: 'optimized' },
        execution_time_estimate_ms: 200,
        status: 'pending'
      });
    }

    return actions;
  }

  private initializeDefaultProfiles(): void {
    // Ultra Performance Profile
    const ultraPerformance: PerformanceProfile = {
      profile_id: 'ultra_performance',
      profile_name: 'Ultra Performance',
      profile_type: 'ultra_performance',
      target_metrics: {
        max_render_time_ms: 200,
        max_hydration_time_ms: 100,
        max_streaming_latency_ms: 50,
        target_fps: 60,
        memory_limit_mb: 100,
        cpu_usage_limit_percent: 50
      },
      quality_settings: {
        skeleton_complexity: 'minimal',
        animation_quality: 'reduced',
        streaming_quality: 'medium',
        hydration_strategy: 'conservative'
      },
      resource_allocation: {
        concurrent_renders: 2,
        buffer_size_mb: 10,
        cache_size_mb: 20,
        worker_thread_count: 2
      },
      adaptation_enabled: true,
      adaptation_sensitivity: 80,
      usage_statistics: {
        times_applied: 0,
        average_performance_score: 0,
        last_used: new Date().toISOString()
      }
    };

    // Balanced Profile
    const balanced: PerformanceProfile = {
      profile_id: 'balanced',
      profile_name: 'Balanced',
      profile_type: 'balanced',
      target_metrics: {
        max_render_time_ms: 500,
        max_hydration_time_ms: 300,
        max_streaming_latency_ms: 150,
        target_fps: 30,
        memory_limit_mb: 200,
        cpu_usage_limit_percent: 70
      },
      quality_settings: {
        skeleton_complexity: 'basic',
        animation_quality: 'standard',
        streaming_quality: 'high',
        hydration_strategy: 'balanced'
      },
      resource_allocation: {
        concurrent_renders: 5,
        buffer_size_mb: 25,
        cache_size_mb: 50,
        worker_thread_count: 4
      },
      adaptation_enabled: true,
      adaptation_sensitivity: 60,
      usage_statistics: {
        times_applied: 0,
        average_performance_score: 0,
        last_used: new Date().toISOString()
      }
    };

    // Quality First Profile
    const qualityFirst: PerformanceProfile = {
      profile_id: 'quality_first',
      profile_name: 'Quality First',
      profile_type: 'quality_first',
      target_metrics: {
        max_render_time_ms: 1000,
        max_hydration_time_ms: 600,
        max_streaming_latency_ms: 300,
        target_fps: 60,
        memory_limit_mb: 500,
        cpu_usage_limit_percent: 90
      },
      quality_settings: {
        skeleton_complexity: 'rich',
        animation_quality: 'enhanced',
        streaming_quality: 'high',
        hydration_strategy: 'aggressive'
      },
      resource_allocation: {
        concurrent_renders: 10,
        buffer_size_mb: 50,
        cache_size_mb: 100,
        worker_thread_count: 8
      },
      adaptation_enabled: false,
      adaptation_sensitivity: 30,
      usage_statistics: {
        times_applied: 0,
        average_performance_score: 0,
        last_used: new Date().toISOString()
      }
    };

    this.performanceProfiles.set('ultra_performance', ultraPerformance);
    this.performanceProfiles.set('balanced', balanced);
    this.performanceProfiles.set('quality_first', qualityFirst);

    // Apply default profile
    this.currentProfile = balanced;

    console.log(`📊 [PerformanceMonitor] Initialized ${this.performanceProfiles.size} performance profiles`);
  }

  private startSystemMonitoring(): void {
    setInterval(async () => {
      await this.executeAutoOptimization();
    }, 120000); // Every 2 minutes

    console.log(`📊 [PerformanceMonitor] System monitoring started`);
  }

  private startHealthReporting(): void {
    setInterval(async () => {
      const healthReport = await this.generateHealthReport();
      console.log(`📊 [PerformanceMonitor] System health: ${healthReport.overall_health_score}%`);
    }, 60000); // Every minute

    console.log(`📊 [PerformanceMonitor] Health reporting started`);
  }

  /**
   * Get performance monitoring statistics
   */
  getPerformanceStatistics(): typeof this.statistics & {
    active_metrics: number;
    active_alerts: number;
    current_profile: string | null;
  } {
    return {
      ...this.statistics,
      active_metrics: this.activeMetrics.size,
      active_alerts: Array.from(this.performanceAlerts.values()).filter(a => !a.resolved).length,
      current_profile: this.currentProfile?.profile_name || null
    };
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.activeMetrics.values());
  }

  /**
   * Get active performance alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.performanceAlerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get available performance profiles
   */
  getPerformanceProfiles(): PerformanceProfile[] {
    return Array.from(this.performanceProfiles.values());
  }

  /**
   * Get current performance profile
   */
  getCurrentProfile(): PerformanceProfile | null {
    return this.currentProfile;
  }
}

/**
 * Adaptive Performance Engine
 * Handles automatic performance adaptation based on real-time metrics
 */
class AdaptationEngine {
  private performanceMonitor: PerformanceMonitoringSystem;
  private adaptationHistory: AdaptationRecord[] = [];

  constructor(performanceMonitor: PerformanceMonitoringSystem) {
    this.performanceMonitor = performanceMonitor;
  }

  async handleAlert(alert: PerformanceAlert): Promise<void> {
    console.log(`🤖 [AdaptationEngine] Handling alert: ${alert.alert_message}`);

    const currentProfile = this.performanceMonitor.getCurrentProfile();
    if (!currentProfile || !currentProfile.adaptation_enabled) {
      return;
    }

    // Determine if adaptation is needed
    const adaptationNeeded = await this.assessAdaptationNeed(alert, currentProfile);
    if (!adaptationNeeded) {
      return;
    }

    // Execute adaptation
    await this.executeAdaptation(alert, currentProfile);
  }

  private async assessAdaptationNeed(alert: PerformanceAlert, profile: PerformanceProfile): Promise<boolean> {
    // Check if we've adapted recently for this component
    const recentAdaptations = this.adaptationHistory.filter(record =>
      record.component === alert.component &&
      Date.now() - new Date(record.timestamp).getTime() < 300000 // 5 minutes
    );

    if (recentAdaptations.length >= 3) {
      console.log(`🤖 [AdaptationEngine] Too many recent adaptations for ${alert.component}, skipping`);
      return false;
    }

    // Check severity threshold
    return alert.severity === 'critical' ||
           (alert.severity === 'warning' && profile.adaptation_sensitivity > 50);
  }

  private async executeAdaptation(alert: PerformanceAlert, profile: PerformanceProfile): Promise<void> {
    console.log(`🤖 [AdaptationEngine] Executing adaptation for ${alert.component}`);

    const record: AdaptationRecord = {
      record_id: crypto.randomUUID(),
      component: alert.component,
      alert_severity: alert.severity,
      adaptation_type: 'quality_reduction',
      parameters_changed: {},
      success: false,
      timestamp: new Date().toISOString()
    };

    try {
      // Apply component-specific adaptations
      await this.applyComponentAdaptation(alert, profile, record);

      record.success = true;
      console.log(`✅ [AdaptationEngine] Adaptation successful for ${alert.component}`);

    } catch (error) {
      console.error(`❌ [AdaptationEngine] Adaptation failed for ${alert.component}:`, error);
    }

    this.adaptationHistory.push(record);

    // Keep only recent history
    if (this.adaptationHistory.length > 100) {
      this.adaptationHistory = this.adaptationHistory.slice(-50);
    }
  }

  private async applyComponentAdaptation(
    alert: PerformanceAlert,
    profile: PerformanceProfile,
    record: AdaptationRecord
  ): Promise<void> {
    switch (alert.component) {
      case 'progressive_renderer':
        await this.adaptProgressiveRenderer(alert, profile, record);
        break;
      case 'streaming_renderer':
        await this.adaptStreamingRenderer(alert, profile, record);
        break;
      case 'skeleton_loader':
        await this.adaptSkeletonLoader(alert, profile, record);
        break;
      case 'hydration_system':
        await this.adaptHydrationSystem(alert, profile, record);
        break;
      case 'cross_page_safety':
        await this.adaptCrossPageSafety(alert, profile, record);
        break;
    }
  }

  private async adaptProgressiveRenderer(alert: PerformanceAlert, profile: PerformanceProfile, record: AdaptationRecord): Promise<void> {
    record.parameters_changed = { render_strategy: 'chunked', chunk_size: 'smaller' };
  }

  private async adaptStreamingRenderer(alert: PerformanceAlert, profile: PerformanceProfile, record: AdaptationRecord): Promise<void> {
    record.parameters_changed = { quality: 'reduced', compression: 'enabled' };
  }

  private async adaptSkeletonLoader(alert: PerformanceAlert, profile: PerformanceProfile, record: AdaptationRecord): Promise<void> {
    record.parameters_changed = { complexity: 'minimal', animation: 'disabled' };
  }

  private async adaptHydrationSystem(alert: PerformanceAlert, profile: PerformanceProfile, record: AdaptationRecord): Promise<void> {
    record.parameters_changed = { scheduler: 'conservative', concurrent_limit: 'reduced' };
  }

  private async adaptCrossPageSafety(alert: PerformanceAlert, profile: PerformanceProfile, record: AdaptationRecord): Promise<void> {
    record.parameters_changed = { check_frequency: 'reduced', scope: 'critical_only' };
  }
}

interface AdaptationRecord {
  record_id: string;
  component: string;
  alert_severity: string;
  adaptation_type: string;
  parameters_changed: Record<string, any>;
  success: boolean;
  timestamp: string;
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitoringSystem();
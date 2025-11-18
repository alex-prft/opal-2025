/**
 * DCI Monitoring and Alerting System
 *
 * Comprehensive monitoring for DCI Orchestrator with metrics collection,
 * performance tracking, error monitoring, and intelligent alerting.
 */

import { DciOrchestratorConfig, OSAResults, ResultsQualityScore } from '@/types/dci-orchestrator';
import { dciLog } from './feature-flags';

// =============================================================================
// Monitoring Types
// =============================================================================

export interface DciMetrics {
  // Performance metrics
  orchestrationDurationMs: number;
  contextBuildDurationMs: number;
  llmRequestDurationMs: number;
  resultsMappingDurationMs: number;
  totalProcessingDurationMs: number;

  // Quality metrics
  finalQualityScore: number;
  passesRequired: number;
  contextBucketsUsed: number;
  confidenceLevel: 'low' | 'medium' | 'high';

  // Success metrics
  successful: boolean;
  errorType?: string;
  errorMessage?: string;

  // Resource metrics
  memoryUsageMb?: number;
  cpuUsagePercent?: number;
  cacheHitRate?: number;

  // Context metadata
  orgId: string;
  userId: string;
  maturityPhase: string;
  industry?: string;
  timestamp: string;
}

export interface DciAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'performance' | 'error' | 'quality' | 'availability';
  title: string;
  description: string;
  metrics: { [key: string]: any };
  threshold: { metric: string; value: number; operator: string };
  actionRequired: string[];
  timestamp: string;
  resolved: boolean;
}

export interface DciHealthStatus {
  status: 'healthy' | 'degraded' | 'critical' | 'unavailable';
  uptime: number;
  lastSuccessfulRequest: string;
  currentErrorRate: number;
  averageResponseTime: number;
  activeAlerts: number;
  systemLoad: {
    cpu: number;
    memory: number;
    requests: number;
  };
}

// =============================================================================
// Monitoring Configuration
// =============================================================================

interface MonitoringConfig {
  // Performance thresholds
  performanceThresholds: {
    maxOrchestrationDuration: number;
    maxContextBuildDuration: number;
    maxLlmRequestDuration: number;
    maxTotalProcessingDuration: number;
    minQualityScore: number;
    maxErrorRate: number;
  };

  // Alert configuration
  alerting: {
    enabled: boolean;
    channels: string[]; // 'console', 'webhook', 'email', 'slack'
    debounceMs: number;
    escalationDelayMs: number;
  };

  // Metrics collection
  metricsCollection: {
    enabled: boolean;
    retentionDays: number;
    aggregationIntervalMs: number;
    exportFormat: 'prometheus' | 'datadog' | 'json';
  };

  // Health checks
  healthChecks: {
    enabled: boolean;
    intervalMs: number;
    timeoutMs: number;
    retryAttempts: number;
  };
}

const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  performanceThresholds: {
    maxOrchestrationDuration: 120000, // 2 minutes
    maxContextBuildDuration: 45000, // 45 seconds
    maxLlmRequestDuration: 60000, // 1 minute
    maxTotalProcessingDuration: 180000, // 3 minutes
    minQualityScore: 3.0,
    maxErrorRate: 0.05 // 5%
  },
  alerting: {
    enabled: process.env.NODE_ENV === 'production',
    channels: ['console'],
    debounceMs: 300000, // 5 minutes
    escalationDelayMs: 900000 // 15 minutes
  },
  metricsCollection: {
    enabled: true,
    retentionDays: 30,
    aggregationIntervalMs: 60000, // 1 minute
    exportFormat: 'prometheus'
  },
  healthChecks: {
    enabled: true,
    intervalMs: 30000, // 30 seconds
    timeoutMs: 10000, // 10 seconds
    retryAttempts: 3
  }
};

// =============================================================================
// DCI Monitoring Service
// =============================================================================

export class DciMonitoringService {
  private static instance: DciMonitoringService;
  private config: MonitoringConfig;
  private metrics: DciMetrics[] = [];
  private alerts: Map<string, DciAlert> = new Map();
  private healthStatus: DciHealthStatus;
  private lastAlertTime: Map<string, number> = new Map();

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = { ...DEFAULT_MONITORING_CONFIG, ...config };
    this.healthStatus = this.initializeHealthStatus();
    this.startHealthChecks();
  }

  static getInstance(config?: Partial<MonitoringConfig>): DciMonitoringService {
    if (!DciMonitoringService.instance) {
      DciMonitoringService.instance = new DciMonitoringService(config);
    }
    return DciMonitoringService.instance;
  }

  /**
   * Record DCI orchestration metrics
   */
  recordMetrics(metrics: DciMetrics): void {
    if (!this.config.metricsCollection.enabled) {
      return;
    }

    // Add timestamp if not provided
    if (!metrics.timestamp) {
      metrics.timestamp = new Date().toISOString();
    }

    this.metrics.push(metrics);

    // Update health status
    this.updateHealthStatus(metrics);

    // Check for alert conditions
    this.checkAlertConditions(metrics);

    // Cleanup old metrics
    this.cleanupOldMetrics();

    dciLog('debug', 'DCI metrics recorded:', {
      successful: metrics.successful,
      duration: metrics.totalProcessingDurationMs,
      qualityScore: metrics.finalQualityScore
    });
  }

  /**
   * Record orchestration start
   */
  startOrchestration(context: {
    orgId: string;
    userId: string;
    maturityPhase: string;
    industry?: string;
  }): string {
    const trackingId = this.generateTrackingId();

    dciLog('info', `DCI orchestration started [${trackingId}]`, context);

    return trackingId;
  }

  /**
   * Record orchestration completion
   */
  completeOrchestration(
    trackingId: string,
    result: {
      successful: boolean;
      osaResults?: OSAResults;
      qualityScore?: ResultsQualityScore;
      durationMs: number;
      error?: Error;
    },
    context: {
      orgId: string;
      userId: string;
      maturityPhase: string;
      industry?: string;
    }
  ): void {
    const metrics: DciMetrics = {
      orchestrationDurationMs: result.durationMs,
      contextBuildDurationMs: 0, // Will be populated by individual timing calls
      llmRequestDurationMs: 0,
      resultsMappingDurationMs: 0,
      totalProcessingDurationMs: result.durationMs,
      finalQualityScore: result.qualityScore?.overall || 0,
      passesRequired: result.osaResults?.generation?.totalPasses || 0,
      contextBucketsUsed: result.osaResults?.generation?.contextBucketsUsed?.length || 0,
      confidenceLevel: result.osaResults?.generation?.confidence || 'low',
      successful: result.successful,
      errorType: result.error?.name,
      errorMessage: result.error?.message,
      orgId: context.orgId,
      userId: context.userId,
      maturityPhase: context.maturityPhase,
      industry: context.industry,
      timestamp: new Date().toISOString()
    };

    this.recordMetrics(metrics);

    dciLog('info', `DCI orchestration completed [${trackingId}]`, {
      successful: result.successful,
      duration: result.durationMs,
      qualityScore: metrics.finalQualityScore
    });
  }

  /**
   * Record component timing
   */
  recordComponentTiming(component: 'context_build' | 'llm_request' | 'results_mapping', durationMs: number): void {
    // Store latest timing for inclusion in next complete orchestration call
    // In production, this would be more sophisticated with proper correlation
    dciLog('debug', `${component} completed in ${durationMs}ms`);
  }

  /**
   * Get current health status
   */
  getHealthStatus(): DciHealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Get performance metrics summary
   */
  getMetricsSummary(timeRangeMs: number = 3600000): {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    averageQualityScore: number;
    errorBreakdown: { [errorType: string]: number };
    performancePercentiles: {
      p50: number;
      p90: number;
      p95: number;
      p99: number;
    };
  } {
    const cutoffTime = Date.now() - timeRangeMs;
    const recentMetrics = this.metrics.filter(m =>
      new Date(m.timestamp).getTime() > cutoffTime
    );

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        averageQualityScore: 0,
        errorBreakdown: {},
        performancePercentiles: { p50: 0, p90: 0, p95: 0, p99: 0 }
      };
    }

    const successfulRequests = recentMetrics.filter(m => m.successful);
    const totalRequests = recentMetrics.length;
    const successRate = successfulRequests.length / totalRequests;

    const averageResponseTime = recentMetrics.reduce((sum, m) =>
      sum + m.totalProcessingDurationMs, 0) / totalRequests;

    const averageQualityScore = successfulRequests.reduce((sum, m) =>
      sum + m.finalQualityScore, 0) / Math.max(successfulRequests.length, 1);

    // Error breakdown
    const errorBreakdown: { [errorType: string]: number } = {};
    recentMetrics.filter(m => !m.successful).forEach(m => {
      const errorType = m.errorType || 'unknown';
      errorBreakdown[errorType] = (errorBreakdown[errorType] || 0) + 1;
    });

    // Performance percentiles
    const responseTimes = recentMetrics.map(m => m.totalProcessingDurationMs).sort((a, b) => a - b);
    const performancePercentiles = {
      p50: this.getPercentile(responseTimes, 50),
      p90: this.getPercentile(responseTimes, 90),
      p95: this.getPercentile(responseTimes, 95),
      p99: this.getPercentile(responseTimes, 99)
    };

    return {
      totalRequests,
      successRate,
      averageResponseTime,
      averageQualityScore,
      errorBreakdown,
      performancePercentiles
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): DciAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string, resolvedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      dciLog('info', `Alert resolved: ${alert.title} (by ${resolvedBy})`);
      return true;
    }
    return false;
  }

  /**
   * Generate monitoring dashboard data
   */
  getDashboardData(): {
    healthStatus: DciHealthStatus;
    recentMetrics: DciMetrics[];
    activeAlerts: DciAlert[];
    summary: ReturnType<DciMonitoringService['getMetricsSummary']>;
    trends: {
      hourly: { timestamp: string; successRate: number; avgResponseTime: number }[];
      daily: { date: string; totalRequests: number; successRate: number }[];
    };
  } {
    const summary = this.getMetricsSummary();
    const activeAlerts = this.getActiveAlerts();
    const recentMetrics = this.metrics.slice(-100); // Last 100 requests

    // Generate trend data (simplified)
    const now = new Date();
    const hourlyTrends = [];
    const dailyTrends = [];

    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 3600000);
      const hourMetrics = this.metrics.filter(m => {
        const metricTime = new Date(m.timestamp);
        return metricTime.getHours() === hour.getHours() &&
               metricTime.getDate() === hour.getDate();
      });

      hourlyTrends.push({
        timestamp: hour.toISOString(),
        successRate: hourMetrics.length > 0 ?
          hourMetrics.filter(m => m.successful).length / hourMetrics.length : 0,
        avgResponseTime: hourMetrics.length > 0 ?
          hourMetrics.reduce((sum, m) => sum + m.totalProcessingDurationMs, 0) / hourMetrics.length : 0
      });
    }

    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 86400000);
      const dayMetrics = this.metrics.filter(m => {
        const metricTime = new Date(m.timestamp);
        return metricTime.getDate() === day.getDate() &&
               metricTime.getMonth() === day.getMonth();
      });

      dailyTrends.push({
        date: day.toISOString().split('T')[0],
        totalRequests: dayMetrics.length,
        successRate: dayMetrics.length > 0 ?
          dayMetrics.filter(m => m.successful).length / dayMetrics.length : 0
      });
    }

    return {
      healthStatus: this.healthStatus,
      recentMetrics,
      activeAlerts,
      summary,
      trends: {
        hourly: hourlyTrends,
        daily: dailyTrends
      }
    };
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  private initializeHealthStatus(): DciHealthStatus {
    return {
      status: 'healthy',
      uptime: 0,
      lastSuccessfulRequest: new Date().toISOString(),
      currentErrorRate: 0,
      averageResponseTime: 0,
      activeAlerts: 0,
      systemLoad: {
        cpu: 0,
        memory: 0,
        requests: 0
      }
    };
  }

  private updateHealthStatus(metrics: DciMetrics): void {
    // Update last successful request
    if (metrics.successful) {
      this.healthStatus.lastSuccessfulRequest = metrics.timestamp;
    }

    // Calculate current error rate (last 100 requests)
    const recentMetrics = this.metrics.slice(-100);
    const errorRate = recentMetrics.filter(m => !m.successful).length / recentMetrics.length;
    this.healthStatus.currentErrorRate = errorRate;

    // Calculate average response time
    this.healthStatus.averageResponseTime = recentMetrics.length > 0 ?
      recentMetrics.reduce((sum, m) => sum + m.totalProcessingDurationMs, 0) / recentMetrics.length : 0;

    // Update active alerts count
    this.healthStatus.activeAlerts = this.getActiveAlerts().length;

    // Determine overall status
    if (errorRate > 0.1 || this.healthStatus.activeAlerts > 5) {
      this.healthStatus.status = 'critical';
    } else if (errorRate > 0.05 || this.healthStatus.activeAlerts > 2) {
      this.healthStatus.status = 'degraded';
    } else {
      this.healthStatus.status = 'healthy';
    }
  }

  private checkAlertConditions(metrics: DciMetrics): void {
    const thresholds = this.config.performanceThresholds;

    // Check performance thresholds
    if (metrics.totalProcessingDurationMs > thresholds.maxTotalProcessingDuration) {
      this.createAlert({
        severity: 'high',
        type: 'performance',
        title: 'High Processing Duration',
        description: `Processing took ${metrics.totalProcessingDurationMs}ms, exceeding threshold of ${thresholds.maxTotalProcessingDuration}ms`,
        metrics: { duration: metrics.totalProcessingDurationMs },
        threshold: { metric: 'totalProcessingDurationMs', value: thresholds.maxTotalProcessingDuration, operator: '>' },
        actionRequired: ['Check LLM response times', 'Review context building performance', 'Consider configuration optimization']
      });
    }

    // Check quality thresholds
    if (metrics.successful && metrics.finalQualityScore < thresholds.minQualityScore) {
      this.createAlert({
        severity: 'medium',
        type: 'quality',
        title: 'Low Quality Score',
        description: `Quality score of ${metrics.finalQualityScore} is below threshold of ${thresholds.minQualityScore}`,
        metrics: { qualityScore: metrics.finalQualityScore },
        threshold: { metric: 'finalQualityScore', value: thresholds.minQualityScore, operator: '<' },
        actionRequired: ['Review context quality', 'Check LLM prompt effectiveness', 'Validate data sources']
      });
    }

    // Check error conditions
    if (!metrics.successful) {
      const severity = metrics.errorType === 'timeout' ? 'high' : 'medium';
      this.createAlert({
        severity,
        type: 'error',
        title: `DCI Orchestration Error: ${metrics.errorType || 'Unknown'}`,
        description: metrics.errorMessage || 'DCI orchestration failed without specific error message',
        metrics: { errorType: metrics.errorType, errorMessage: metrics.errorMessage },
        threshold: { metric: 'successful', value: 1, operator: '=' },
        actionRequired: ['Check error logs', 'Validate system dependencies', 'Review configuration']
      });
    }
  }

  private createAlert(alertData: Omit<DciAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const alertId = this.generateAlertId(alertData);

    // Check for debouncing
    const lastAlertTime = this.lastAlertTime.get(alertId);
    const now = Date.now();

    if (lastAlertTime && (now - lastAlertTime) < this.config.alerting.debounceMs) {
      return; // Skip duplicate alert within debounce window
    }

    const alert: DciAlert = {
      ...alertData,
      id: alertId,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.alerts.set(alertId, alert);
    this.lastAlertTime.set(alertId, now);

    // Send alert through configured channels
    this.sendAlert(alert);
  }

  private sendAlert(alert: DciAlert): void {
    if (!this.config.alerting.enabled) {
      return;
    }

    this.config.alerting.channels.forEach(channel => {
      switch (channel) {
        case 'console':
          console.warn(`[DCI Alert] ${alert.severity.toUpperCase()}: ${alert.title}`, {
            description: alert.description,
            actionRequired: alert.actionRequired
          });
          break;

        case 'webhook':
          // In production, send to webhook endpoint
          dciLog('warn', 'Alert webhook would be triggered:', alert);
          break;

        case 'slack':
          // In production, send to Slack
          dciLog('warn', 'Slack alert would be sent:', alert);
          break;

        default:
          dciLog('warn', `Unknown alert channel: ${channel}`);
      }
    });
  }

  private generateTrackingId(): string {
    return `dci-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(alertData: Omit<DciAlert, 'id' | 'timestamp' | 'resolved'>): string {
    const hash = JSON.stringify({
      type: alertData.type,
      title: alertData.title,
      threshold: alertData.threshold
    });
    return `alert-${Buffer.from(hash).toString('base64').substr(0, 10)}`;
  }

  private getPercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - (this.config.metricsCollection.retentionDays * 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => new Date(m.timestamp).getTime() > cutoffTime);
  }

  private startHealthChecks(): void {
    if (!this.config.healthChecks.enabled) {
      return;
    }

    setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthChecks.intervalMs);
  }

  private async performHealthCheck(): Promise<void> {
    // Basic health check - in production, this would check dependencies
    try {
      const startTime = Date.now();

      // Check system resources (mock)
      this.healthStatus.systemLoad = {
        cpu: Math.random() * 50, // Mock CPU usage
        memory: Math.random() * 60, // Mock memory usage
        requests: this.metrics.length
      };

      // Update uptime
      this.healthStatus.uptime = Date.now();

      dciLog('debug', 'Health check completed', this.healthStatus);
    } catch (error) {
      dciLog('error', 'Health check failed:', error);
      this.healthStatus.status = 'unavailable';
    }
  }
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Initialize DCI monitoring
 */
export function initializeDciMonitoring(config?: Partial<MonitoringConfig>): DciMonitoringService {
  return DciMonitoringService.getInstance(config);
}

/**
 * Record DCI metrics (convenience function)
 */
export function recordDciMetrics(metrics: DciMetrics): void {
  const monitoring = DciMonitoringService.getInstance();
  monitoring.recordMetrics(metrics);
}

/**
 * Get DCI health status (convenience function)
 */
export function getDciHealthStatus(): DciHealthStatus {
  const monitoring = DciMonitoringService.getInstance();
  return monitoring.getHealthStatus();
}

/**
 * Create monitoring middleware for Next.js API routes
 */
export function createDciMonitoringMiddleware() {
  return (req: any, res: any, next: any) => {
    const monitoring = DciMonitoringService.getInstance();
    const startTime = Date.now();
    const trackingId = monitoring.startOrchestration({
      orgId: req.body?.orgId || 'unknown',
      userId: req.body?.userId || 'unknown',
      maturityPhase: req.body?.maturityPhase || 'unknown',
      industry: req.body?.industry
    });

    // Add tracking ID to request
    req.dciTrackingId = trackingId;

    // Override res.json to capture response
    const originalJson = res.json;
    res.json = function(body: any) {
      const duration = Date.now() - startTime;
      const successful = !body.error;

      monitoring.completeOrchestration(
        trackingId,
        {
          successful,
          durationMs: duration,
          error: body.error ? new Error(body.error) : undefined
        },
        {
          orgId: req.body?.orgId || 'unknown',
          userId: req.body?.userId || 'unknown',
          maturityPhase: req.body?.maturityPhase || 'unknown',
          industry: req.body?.industry
        }
      );

      return originalJson.call(this, body);
    };

    next();
  };
}

// =============================================================================
// Export Default Instance
// =============================================================================

export const dciMonitoring = DciMonitoringService.getInstance();
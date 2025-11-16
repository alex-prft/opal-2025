/**
 * Professional Prometheus Metrics Integration using prom-client
 *
 * Your implementation enhanced with OSA-specific metrics and proper integration.
 * Uses the industry-standard prom-client library for production-grade monitoring.
 */

import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

// ============================================================================
// OSA METRICS CONFIGURATION
// ============================================================================

interface MetricDefinition {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  description: string;
  labels?: string[];
  buckets?: number[];
}

const OSA_METRICS: MetricDefinition[] = [
  // PII Protection Metrics
  {
    name: 'osa_pii_protections_total',
    type: 'counter',
    description: 'Total number of PII protection operations performed',
    labels: ['pii_type', 'redaction_mode', 'confidence_level']
  },
  {
    name: 'osa_pii_protection_duration_seconds',
    type: 'histogram',
    description: 'Duration of PII protection operations in seconds',
    labels: ['pii_type', 'redaction_mode'],
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
  },

  // OPAL Agent Metrics
  {
    name: 'osa_agent_executions_total',
    type: 'counter',
    description: 'Total number of OPAL agent executions',
    labels: ['agent_id', 'status', 'workflow_type']
  },
  {
    name: 'osa_agent_execution_duration_seconds',
    type: 'histogram',
    description: 'Duration of OPAL agent execution in seconds',
    labels: ['agent_id', 'status'],
    buckets: [0.1, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0]
  },
  {
    name: 'osa_agent_confidence_score',
    type: 'gauge',
    description: 'Confidence score of OPAL agent results (0-100)',
    labels: ['agent_id', 'workflow_id']
  },

  // Webhook Processing Metrics
  {
    name: 'osa_webhooks_processed_total',
    type: 'counter',
    description: 'Total number of webhooks processed',
    labels: ['agent_id', 'status', 'webhook_type']
  },
  {
    name: 'osa_webhook_processing_duration_seconds',
    type: 'histogram',
    description: 'Duration of webhook processing in seconds',
    labels: ['agent_id', 'webhook_type'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
  },
  {
    name: 'osa_webhook_payload_size_bytes',
    type: 'histogram',
    description: 'Size of webhook payloads in bytes',
    labels: ['agent_id'],
    buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000]
  },

  // System Health Metrics
  {
    name: 'osa_system_health_score',
    type: 'gauge',
    description: 'System health score (0-1, where 1 is healthy)',
    labels: ['component', 'environment']
  },
  {
    name: 'osa_database_connections_active',
    type: 'gauge',
    description: 'Number of active database connections',
    labels: ['database_type']
  },
  {
    name: 'osa_cache_operations_total',
    type: 'counter',
    description: 'Total cache operations',
    labels: ['operation', 'cache_type', 'status']
  },
  {
    name: 'osa_cache_hit_ratio',
    type: 'gauge',
    description: 'Cache hit ratio (0-1)',
    labels: ['cache_type']
  },

  // API Performance Metrics
  {
    name: 'osa_api_requests_total',
    type: 'counter',
    description: 'Total number of API requests',
    labels: ['method', 'endpoint', 'status_code', 'user_agent']
  },
  {
    name: 'osa_api_request_duration_seconds',
    type: 'histogram',
    description: 'Duration of API requests in seconds',
    labels: ['method', 'endpoint', 'status_class'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
  },
  {
    name: 'osa_api_concurrent_requests',
    type: 'gauge',
    description: 'Number of concurrent API requests being processed',
    labels: ['endpoint']
  },

  // Business Metrics
  {
    name: 'osa_strategy_recommendations_generated_total',
    type: 'counter',
    description: 'Total number of strategy recommendations generated',
    labels: ['recommendation_type', 'confidence_level', 'user_segment']
  },
  {
    name: 'osa_user_sessions_total',
    type: 'counter',
    description: 'Total number of user sessions',
    labels: ['user_type', 'session_duration_category']
  },
  {
    name: 'osa_compliance_violations_total',
    type: 'counter',
    description: 'Total compliance violations detected',
    labels: ['violation_type', 'severity', 'framework']
  }
];

// ============================================================================
// PROFESSIONAL METRICS COLLECTOR
// ============================================================================

class MetricsCollector {
  private registry = new Registry();
  private metrics: Map<string, Counter | Gauge | Histogram> = new Map();

  constructor() {
    // Collect default Node.js metrics (memory, CPU, etc.)
    collectDefaultMetrics({
      register: this.registry,
      prefix: 'nodejs_',
      timeout: 10000 // Collect every 10 seconds
    });

    this.initializeMetrics();
    console.log('📊 [Prometheus] Professional metrics collector initialized with prom-client');
  }

  /**
   * Your enhanced initializeMetrics method with OSA-specific metrics
   */
  private initializeMetrics(): void {
    OSA_METRICS.forEach(metric => {
      try {
        if (metric.type === 'counter') {
          const counter = new Counter({
            name: metric.name,
            help: metric.description,
            labelNames: metric.labels || [],
            registers: [this.registry]
          });
          this.metrics.set(metric.name, counter);

        } else if (metric.type === 'gauge') {
          const gauge = new Gauge({
            name: metric.name,
            help: metric.description,
            labelNames: metric.labels || [],
            registers: [this.registry]
          });
          this.metrics.set(metric.name, gauge);

        } else if (metric.type === 'histogram') {
          const histogram = new Histogram({
            name: metric.name,
            help: metric.description,
            labelNames: metric.labels || [],
            buckets: metric.buckets || [0.1, 0.5, 1, 2.5, 5, 10],
            registers: [this.registry]
          });
          this.metrics.set(metric.name, histogram);
        }

        console.log(`📈 [Prometheus] Registered metric: ${metric.name} (${metric.type})`);
      } catch (error) {
        console.error(`❌ [Prometheus] Failed to register metric ${metric.name}:`, error);
      }
    });
  }

  /**
   * Your corrected exportMetrics method - now working with prom-client
   */
  async exportMetrics(): Promise<string> {
    try {
      return await this.registry.metrics();
    } catch (error) {
      console.error('❌ [Prometheus] Failed to export metrics:', error);
      return '# Error exporting metrics\n';
    }
  }

  /**
   * Export metrics in different content types
   */
  async exportMetricsWithContentType(): Promise<{ metrics: string; contentType: string }> {
    const metrics = await this.exportMetrics();
    return {
      metrics,
      contentType: this.registry.contentType
    };
  }

  // ============================================================================
  // OSA-SPECIFIC METRIC RECORDING METHODS
  // ============================================================================

  /**
   * Record PII protection operation
   */
  recordPIIProtection(piiType: string, redactionMode: string, processingTimeMs: number, confidenceLevel: string = 'high'): void {
    const counter = this.metrics.get('osa_pii_protections_total') as Counter;
    const histogram = this.metrics.get('osa_pii_protection_duration_seconds') as Histogram;

    if (counter) {
      counter.labels({ pii_type: piiType, redaction_mode: redactionMode, confidence_level: confidenceLevel }).inc();
    }
    if (histogram) {
      histogram.labels({ pii_type: piiType, redaction_mode: redactionMode }).observe(processingTimeMs / 1000);
    }
  }

  /**
   * Record OPAL agent execution
   */
  recordAgentExecution(agentId: string, status: string, executionTimeMs: number, workflowType: string = 'strategy', confidenceScore?: number, workflowId?: string): void {
    const counter = this.metrics.get('osa_agent_executions_total') as Counter;
    const histogram = this.metrics.get('osa_agent_execution_duration_seconds') as Histogram;
    const gauge = this.metrics.get('osa_agent_confidence_score') as Gauge;

    if (counter) {
      counter.labels({ agent_id: agentId, status, workflow_type: workflowType }).inc();
    }
    if (histogram) {
      histogram.labels({ agent_id: agentId, status }).observe(executionTimeMs / 1000);
    }
    if (gauge && confidenceScore !== undefined && workflowId) {
      gauge.labels({ agent_id: agentId, workflow_id: workflowId }).set(confidenceScore);
    }
  }

  /**
   * Record webhook processing
   */
  recordWebhookProcessing(agentId: string, status: string, processingTimeMs: number, webhookType: string = 'opal', payloadSizeBytes?: number): void {
    const counter = this.metrics.get('osa_webhooks_processed_total') as Counter;
    const histogram = this.metrics.get('osa_webhook_processing_duration_seconds') as Histogram;
    const sizeHistogram = this.metrics.get('osa_webhook_payload_size_bytes') as Histogram;

    if (counter) {
      counter.labels({ agent_id: agentId, status, webhook_type: webhookType }).inc();
    }
    if (histogram) {
      histogram.labels({ agent_id: agentId, webhook_type: webhookType }).observe(processingTimeMs / 1000);
    }
    if (sizeHistogram && payloadSizeBytes !== undefined) {
      sizeHistogram.labels({ agent_id: agentId }).observe(payloadSizeBytes);
    }
  }

  /**
   * Update system health
   */
  updateSystemHealth(component: string, healthScore: number, environment: string = 'production'): void {
    const gauge = this.metrics.get('osa_system_health_score') as Gauge;
    if (gauge) {
      gauge.labels({ component, environment }).set(healthScore);
    }
  }

  /**
   * Record API request
   */
  recordAPIRequest(method: string, endpoint: string, statusCode: number, durationMs: number, userAgent?: string): void {
    const counter = this.metrics.get('osa_api_requests_total') as Counter;
    const histogram = this.metrics.get('osa_api_request_duration_seconds') as Histogram;

    const statusClass = Math.floor(statusCode / 100) + 'xx';

    if (counter) {
      counter.labels({
        method,
        endpoint,
        status_code: statusCode.toString(),
        user_agent: userAgent || 'unknown'
      }).inc();
    }
    if (histogram) {
      histogram.labels({ method, endpoint, status_class: statusClass }).observe(durationMs / 1000);
    }
  }

  /**
   * Record cache operation
   */
  recordCacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', cacheType: string, status: 'success' | 'error' = 'success'): void {
    const counter = this.metrics.get('osa_cache_operations_total') as Counter;
    if (counter) {
      counter.labels({ operation, cache_type: cacheType, status }).inc();
    }
  }

  /**
   * Update cache hit ratio
   */
  updateCacheHitRatio(cacheType: string, hitRatio: number): void {
    const gauge = this.metrics.get('osa_cache_hit_ratio') as Gauge;
    if (gauge) {
      gauge.labels({ cache_type: cacheType }).set(hitRatio);
    }
  }

  /**
   * Record strategy recommendation
   */
  recordStrategyRecommendation(recommendationType: string, confidenceLevel: string, userSegment: string = 'general'): void {
    const counter = this.metrics.get('osa_strategy_recommendations_generated_total') as Counter;
    if (counter) {
      counter.labels({
        recommendation_type: recommendationType,
        confidence_level: confidenceLevel,
        user_segment: userSegment
      }).inc();
    }
  }

  /**
   * Record compliance violation
   */
  recordComplianceViolation(violationType: string, severity: 'low' | 'medium' | 'high' | 'critical', framework: string): void {
    const counter = this.metrics.get('osa_compliance_violations_total') as Counter;
    if (counter) {
      counter.labels({ violation_type: violationType, severity, framework }).inc();
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get specific metric by name
   */
  getMetric(name: string): Counter | Gauge | Histogram | undefined {
    return this.metrics.get(name);
  }

  /**
   * Get all registered metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Get registry statistics
   */
  getRegistryStats(): { totalMetrics: number; defaultMetrics: boolean; contentType: string } {
    return {
      totalMetrics: this.metrics.size,
      defaultMetrics: true,
      contentType: this.registry.contentType
    };
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.registry.clear();
    this.metrics.clear();
    collectDefaultMetrics({ register: this.registry });
    this.initializeMetrics();
    console.log('📊 [Prometheus] All metrics reset');
  }

  /**
   * Get metrics summary for monitoring dashboard
   */
  async getMetricsSummary(): Promise<{
    totalMetrics: number;
    lastExportTime: string;
    registrySize: number;
    metricsPreview: string;
  }> {
    const metrics = await this.exportMetrics();
    const lines = metrics.split('\n').filter(line => line && !line.startsWith('#'));

    return {
      totalMetrics: this.metrics.size,
      lastExportTime: new Date().toISOString(),
      registrySize: metrics.length,
      metricsPreview: lines.slice(0, 5).join('\n')
    };
  }
}

// Export singleton instance
export const prometheusMetrics = new MetricsCollector();

// ============================================================================
// CONVENIENCE DECORATORS & MIDDLEWARE
// ============================================================================

/**
 * Decorator to automatically time method execution
 */
export function TimedExecution(metricName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const finalMetricName = metricName || `osa_method_execution_duration_seconds`;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();

      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;

        prometheusMetrics.recordAPIRequest(
          'METHOD',
          `${target.constructor.name}.${propertyName}`,
          200,
          duration
        );

        return result;
      } catch (error) {
        const duration = Date.now() - start;

        prometheusMetrics.recordAPIRequest(
          'METHOD',
          `${target.constructor.name}.${propertyName}`,
          500,
          duration
        );

        throw error;
      }
    };
  };
}

/**
 * Express/Next.js middleware for automatic API metrics collection
 */
export function createPrometheusMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const originalSend = res.send;

    res.send = function (data: any) {
      const duration = Date.now() - start;

      prometheusMetrics.recordAPIRequest(
        req.method,
        req.path || req.url,
        res.statusCode,
        duration,
        req.get('User-Agent')
      );

      return originalSend.call(this, data);
    };

    next();
  };
}
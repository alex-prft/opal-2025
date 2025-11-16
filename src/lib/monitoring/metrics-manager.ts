/**
 * Metrics Manager - Enterprise Monitoring & Prometheus Integration
 *
 * Comprehensive metrics collection and export system for OSA application,
 * integrating with PII protection, agent workflows, and system health.
 */

import { performance } from 'perf_hooks';

// ============================================================================
// METRICS INTERFACES & TYPES
// ============================================================================

export interface MetricValue {
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface MetricDefinition {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  help: string;
  labels?: string[];
}

export interface PrometheusMetric {
  name: string;
  type: string;
  help: string;
  values: MetricValue[];
}

export interface MetricsExportOptions {
  format?: 'prometheus' | 'json';
  includeTimestamp?: boolean;
  filterPrefix?: string;
}

// ============================================================================
// METRICS REGISTRY & MANAGER
// ============================================================================

export class MetricsManager {
  private metrics: Map<string, PrometheusMetric> = new Map();
  private registries: Map<string, Map<string, PrometheusMetric>> = new Map();
  private startTime: number = Date.now();

  constructor() {
    this.initializeDefaultMetrics();
    console.log('📊 [Metrics] Metrics Manager initialized with Prometheus compatibility');
  }

  /**
   * Your original exportMetrics method - corrected and enhanced
   */
  async exportMetrics(options: MetricsExportOptions = {}): Promise<string> {
    const { format = 'prometheus', includeTimestamp = false, filterPrefix } = options;

    // Get the main registry or a specific one
    const registry = this.registries.get('register') || this.metrics;

    if (format === 'prometheus') {
      return await this.exportPrometheusFormat(registry, { includeTimestamp, filterPrefix });
    } else {
      return await this.exportJsonFormat(registry, { filterPrefix });
    }
  }

  /**
   * Alternative method signature that matches your original intent
   */
  async exportMetricsFromRegistry(registryName: string = 'register'): Promise<string> {
    const registry = this.registries.get(registryName);
    if (!registry) {
      throw new Error(`Registry '${registryName}' not found`);
    }
    return await this.exportPrometheusFormat(registry);
  }

  /**
   * Register a new metric definition
   */
  registerMetric(definition: MetricDefinition): void {
    const metric: PrometheusMetric = {
      name: definition.name,
      type: definition.type,
      help: definition.help,
      values: []
    };

    this.metrics.set(definition.name, metric);

    // Also register in the 'register' registry for compatibility
    if (!this.registries.has('register')) {
      this.registries.set('register', new Map());
    }
    this.registries.get('register')!.set(definition.name, metric);

    console.log(`📈 [Metrics] Registered metric: ${definition.name} (${definition.type})`);
  }

  /**
   * Update metric value (counter increment, gauge set, etc.)
   */
  updateMetric(name: string, value: number, labels?: Record<string, string>): void {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`⚠️ [Metrics] Metric '${name}' not found`);
      return;
    }

    const metricValue: MetricValue = {
      value,
      timestamp: Date.now(),
      labels
    };

    if (metric.type === 'counter') {
      // For counters, add to existing value
      const existing = metric.values.find(v =>
        JSON.stringify(v.labels) === JSON.stringify(labels)
      );
      if (existing) {
        existing.value += value;
        existing.timestamp = metricValue.timestamp;
      } else {
        metric.values.push(metricValue);
      }
    } else {
      // For gauges, histograms, summaries - replace or add
      const existingIndex = metric.values.findIndex(v =>
        JSON.stringify(v.labels) === JSON.stringify(labels)
      );
      if (existingIndex >= 0) {
        metric.values[existingIndex] = metricValue;
      } else {
        metric.values.push(metricValue);
      }
    }
  }

  /**
   * Increment counter metric
   */
  incrementCounter(name: string, increment: number = 1, labels?: Record<string, string>): void {
    this.updateMetric(name, increment, labels);
  }

  /**
   * Set gauge value
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.updateMetric(name, value, labels);
  }

  /**
   * Record histogram observation
   */
  observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
    this.updateMetric(name, value, labels);
  }

  /**
   * Time a function execution and record as histogram
   */
  async timeFunction<T>(
    metricName: string,
    fn: () => Promise<T> | T,
    labels?: Record<string, string>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.observeHistogram(metricName, duration, labels);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.observeHistogram(metricName, duration, { ...labels, status: 'error' });
      throw error;
    }
  }

  // ============================================================================
  // OSA-SPECIFIC METRICS METHODS
  // ============================================================================

  /**
   * Record PII protection operation metrics
   */
  recordPIIProtection(piiType: string, redactionMode: string, processingTimeMs: number): void {
    this.incrementCounter('osa_pii_protections_total', 1, {
      pii_type: piiType,
      redaction_mode: redactionMode
    });
    this.observeHistogram('osa_pii_protection_duration_ms', processingTimeMs, {
      pii_type: piiType
    });
  }

  /**
   * Record webhook processing metrics
   */
  recordWebhookProcessing(agentId: string, status: string, processingTimeMs: number): void {
    this.incrementCounter('osa_webhooks_processed_total', 1, {
      agent_id: agentId,
      status: status
    });
    this.observeHistogram('osa_webhook_processing_duration_ms', processingTimeMs, {
      agent_id: agentId
    });
  }

  /**
   * Record agent execution metrics
   */
  recordAgentExecution(agentId: string, status: string, executionTimeMs: number): void {
    this.incrementCounter('osa_agent_executions_total', 1, {
      agent_id: agentId,
      status: status
    });
    this.observeHistogram('osa_agent_execution_duration_ms', executionTimeMs, {
      agent_id: agentId
    });
  }

  /**
   * Update system health metrics
   */
  updateSystemHealth(component: string, status: 'healthy' | 'unhealthy' | 'degraded'): void {
    const statusValue = status === 'healthy' ? 1 : status === 'degraded' ? 0.5 : 0;
    this.setGauge('osa_system_health', statusValue, { component });
  }

  /**
   * Record API endpoint metrics
   */
  recordAPICall(endpoint: string, method: string, statusCode: number, responseTimeMs: number): void {
    this.incrementCounter('osa_api_requests_total', 1, {
      endpoint: endpoint,
      method: method,
      status_code: statusCode.toString()
    });
    this.observeHistogram('osa_api_response_duration_ms', responseTimeMs, {
      endpoint: endpoint,
      method: method
    });
  }

  // ============================================================================
  // EXPORT METHODS
  // ============================================================================

  /**
   * Export metrics in Prometheus format
   */
  private async exportPrometheusFormat(
    registry: Map<string, PrometheusMetric>,
    options: { includeTimestamp?: boolean; filterPrefix?: string } = {}
  ): Promise<string> {
    const lines: string[] = [];
    const { includeTimestamp = false, filterPrefix } = options;

    for (const [name, metric] of registry) {
      if (filterPrefix && !name.startsWith(filterPrefix)) {
        continue;
      }

      // Add help and type comments
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);

      // Add metric values
      for (const value of metric.values) {
        let line = metric.name;

        // Add labels if present
        if (value.labels && Object.keys(value.labels).length > 0) {
          const labelPairs = Object.entries(value.labels)
            .map(([key, val]) => `${key}="${val}"`)
            .join(',');
          line += `{${labelPairs}}`;
        }

        // Add value
        line += ` ${value.value}`;

        // Add timestamp if requested
        if (includeTimestamp) {
          line += ` ${value.timestamp}`;
        }

        lines.push(line);
      }

      lines.push(''); // Empty line between metrics
    }

    return lines.join('\n');
  }

  /**
   * Export metrics in JSON format
   */
  private async exportJsonFormat(
    registry: Map<string, PrometheusMetric>,
    options: { filterPrefix?: string } = {}
  ): Promise<string> {
    const { filterPrefix } = options;
    const metrics: Record<string, any> = {};

    for (const [name, metric] of registry) {
      if (filterPrefix && !name.startsWith(filterPrefix)) {
        continue;
      }

      metrics[name] = {
        type: metric.type,
        help: metric.help,
        values: metric.values
      };
    }

    return JSON.stringify({
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
      metrics
    }, null, 2);
  }

  // ============================================================================
  // INITIALIZATION & UTILITIES
  // ============================================================================

  /**
   * Initialize default OSA metrics
   */
  private initializeDefaultMetrics(): void {
    const defaultMetrics: MetricDefinition[] = [
      {
        name: 'osa_pii_protections_total',
        type: 'counter',
        help: 'Total number of PII protection operations performed',
        labels: ['pii_type', 'redaction_mode']
      },
      {
        name: 'osa_pii_protection_duration_ms',
        type: 'histogram',
        help: 'Duration of PII protection operations in milliseconds',
        labels: ['pii_type']
      },
      {
        name: 'osa_webhooks_processed_total',
        type: 'counter',
        help: 'Total number of webhooks processed',
        labels: ['agent_id', 'status']
      },
      {
        name: 'osa_webhook_processing_duration_ms',
        type: 'histogram',
        help: 'Duration of webhook processing in milliseconds',
        labels: ['agent_id']
      },
      {
        name: 'osa_agent_executions_total',
        type: 'counter',
        help: 'Total number of agent executions',
        labels: ['agent_id', 'status']
      },
      {
        name: 'osa_agent_execution_duration_ms',
        type: 'histogram',
        help: 'Duration of agent execution in milliseconds',
        labels: ['agent_id']
      },
      {
        name: 'osa_system_health',
        type: 'gauge',
        help: 'System health status (1=healthy, 0.5=degraded, 0=unhealthy)',
        labels: ['component']
      },
      {
        name: 'osa_api_requests_total',
        type: 'counter',
        help: 'Total number of API requests',
        labels: ['endpoint', 'method', 'status_code']
      },
      {
        name: 'osa_api_response_duration_ms',
        type: 'histogram',
        help: 'API response duration in milliseconds',
        labels: ['endpoint', 'method']
      },
      {
        name: 'osa_uptime_seconds',
        type: 'gauge',
        help: 'Application uptime in seconds'
      }
    ];

    for (const metric of defaultMetrics) {
      this.registerMetric(metric);
    }

    // Set initial uptime
    this.setGauge('osa_uptime_seconds', Math.floor((Date.now() - this.startTime) / 1000));
  }

  /**
   * Update uptime metric
   */
  updateUptime(): void {
    this.setGauge('osa_uptime_seconds', Math.floor((Date.now() - this.startTime) / 1000));
  }

  /**
   * Get metric statistics
   */
  getMetricsStats(): {
    total_metrics: number;
    total_registries: number;
    uptime_seconds: number;
  } {
    return {
      total_metrics: this.metrics.size,
      total_registries: this.registries.size,
      uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000)
    };
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.metrics.clear();
    this.registries.clear();
    this.startTime = Date.now();
    this.initializeDefaultMetrics();
    console.log('📊 [Metrics] All metrics reset');
  }
}

// Export singleton instance
export const metricsManager = new MetricsManager();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Decorator for timing method execution
 */
export function timed(metricName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return await metricsManager.timeFunction(
        metricName,
        () => method.apply(this, args),
        { method: propertyName, class: target.constructor.name }
      );
    };
  };
}

/**
 * Middleware helper for Express/Next.js route timing
 */
export function createMetricsMiddleware() {
  return async (req: any, res: any, next: any) => {
    const start = performance.now();

    res.on('finish', () => {
      const duration = performance.now() - start;
      metricsManager.recordAPICall(
        req.url || req.path,
        req.method,
        res.statusCode,
        duration
      );
    });

    next();
  };
}
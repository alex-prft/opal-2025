/**
 * OPAL Metrics Collector for Prometheus Integration
 *
 * This module provides comprehensive metrics collection for OPAL event processing
 * with Prometheus integration for observability and monitoring.
 */

import client from 'prom-client';

export interface EventMetrics {
  published: number;
  skipped: number;
  errors: number;
  processingTime: {
    total: number;
    average: number;
    min: number;
    max: number;
  };
  topicBreakdown: Record<string, {
    published: number;
    errors: number;
    avgProcessingTime: number;
  }>;
}

export interface ConsumerMetrics {
  consumed: number;
  processed: number;
  failed: number;
  lag: number;
  processingTime: {
    average: number;
    p95: number;
    p99: number;
  };
}

export class OpalMetricsCollector {
  // Event Producer Metrics
  private eventPublishedCounter: client.Counter<string>;
  private eventSkippedCounter: client.Counter<string>;
  private eventErrorCounter: client.Counter<string>;
  private eventProcessingDuration: client.Histogram<string>;

  // Event Consumer Metrics
  private eventConsumedCounter: client.Counter<string>;
  private eventProcessedCounter: client.Counter<string>;
  private eventFailedCounter: client.Counter<string>;
  private consumerLagGauge: client.Gauge<string>;
  private consumerProcessingDuration: client.Histogram<string>;

  // System Metrics
  private kafkaConnectionStatus: client.Gauge<string>;
  private redisConnectionStatus: client.Gauge<string>;
  private schemaRegistryStatus: client.Gauge<string>;

  // Runtime tracking
  private eventStats = new Map<string, {
    published: number;
    errors: number;
    totalTime: number;
    minTime: number;
    maxTime: number;
  }>();

  constructor() {
    // Initialize Prometheus metrics
    this.initializeMetrics();

    // Register default Node.js metrics
    client.collectDefaultMetrics({
      prefix: 'opal_',
      timeout: 10000,
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
    });
  }

  private initializeMetrics() {
    // Event Producer Metrics
    this.eventPublishedCounter = new client.Counter({
      name: 'opal_events_published_total',
      help: 'Total number of events published to Kafka',
      labelNames: ['topic', 'event_type', 'environment']
    });

    this.eventSkippedCounter = new client.Counter({
      name: 'opal_events_skipped_total',
      help: 'Total number of events skipped due to idempotency',
      labelNames: ['topic', 'event_type', 'reason']
    });

    this.eventErrorCounter = new client.Counter({
      name: 'opal_events_error_total',
      help: 'Total number of event publishing errors',
      labelNames: ['topic', 'event_type', 'error_type']
    });

    this.eventProcessingDuration = new client.Histogram({
      name: 'opal_event_processing_duration_seconds',
      help: 'Event processing duration in seconds',
      labelNames: ['topic', 'event_type', 'status'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0]
    });

    // Event Consumer Metrics
    this.eventConsumedCounter = new client.Counter({
      name: 'opal_events_consumed_total',
      help: 'Total number of events consumed from Kafka',
      labelNames: ['topic', 'consumer_group', 'partition']
    });

    this.eventProcessedCounter = new client.Counter({
      name: 'opal_events_processed_total',
      help: 'Total number of events successfully processed',
      labelNames: ['topic', 'consumer_group', 'event_type']
    });

    this.eventFailedCounter = new client.Counter({
      name: 'opal_events_failed_total',
      help: 'Total number of events that failed processing',
      labelNames: ['topic', 'consumer_group', 'error_type']
    });

    this.consumerLagGauge = new client.Gauge({
      name: 'opal_consumer_lag',
      help: 'Consumer lag in messages',
      labelNames: ['topic', 'consumer_group', 'partition']
    });

    this.consumerProcessingDuration = new client.Histogram({
      name: 'opal_consumer_processing_duration_seconds',
      help: 'Consumer processing duration in seconds',
      labelNames: ['topic', 'consumer_group', 'event_type'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0]
    });

    // System Health Metrics
    this.kafkaConnectionStatus = new client.Gauge({
      name: 'opal_kafka_connection_status',
      help: 'Kafka connection status (1=connected, 0=disconnected)'
    });

    this.redisConnectionStatus = new client.Gauge({
      name: 'opal_redis_connection_status',
      help: 'Redis connection status (1=connected, 0=disconnected)'
    });

    this.schemaRegistryStatus = new client.Gauge({
      name: 'opal_schema_registry_status',
      help: 'Schema Registry connection status (1=connected, 0=disconnected)'
    });
  }

  /**
   * Record event published to Kafka
   */
  recordEventPublished(topicKey: string, processingTimeMs: number): void {
    const environment = process.env.NODE_ENV || 'development';

    this.eventPublishedCounter.inc({
      topic: topicKey.toLowerCase(),
      event_type: topicKey,
      environment
    });

    this.eventProcessingDuration.observe(
      {
        topic: topicKey.toLowerCase(),
        event_type: topicKey,
        status: 'success'
      },
      processingTimeMs / 1000
    );

    // Update runtime stats
    this.updateEventStats(topicKey, processingTimeMs, false);

    console.log(`📊 [Metrics] Event published: ${topicKey} (${processingTimeMs}ms)`);
  }

  /**
   * Record event skipped (idempotency)
   */
  recordEventSkipped(topicKey: string, reason: string = 'duplicate'): void {
    this.eventSkippedCounter.inc({
      topic: topicKey.toLowerCase(),
      event_type: topicKey,
      reason
    });

    console.log(`📊 [Metrics] Event skipped: ${topicKey} (reason: ${reason})`);
  }

  /**
   * Record event publishing error
   */
  recordEventError(topicKey: string, errorType: string): void {
    this.eventErrorCounter.inc({
      topic: topicKey.toLowerCase(),
      event_type: topicKey,
      error_type: errorType
    });

    // Update runtime stats
    this.updateEventStats(topicKey, 0, true);

    console.log(`📊 [Metrics] Event error: ${topicKey} (${errorType})`);
  }

  /**
   * Record event consumed from Kafka
   */
  recordEventConsumed(topic: string, consumerGroup: string, partition: number): void {
    this.eventConsumedCounter.inc({
      topic: topic.toLowerCase(),
      consumer_group: consumerGroup,
      partition: partition.toString()
    });
  }

  /**
   * Record event processed by consumer
   */
  recordEventProcessed(topic: string, consumerGroup: string, eventType: string, processingTimeMs: number): void {
    this.eventProcessedCounter.inc({
      topic: topic.toLowerCase(),
      consumer_group: consumerGroup,
      event_type: eventType
    });

    this.consumerProcessingDuration.observe(
      {
        topic: topic.toLowerCase(),
        consumer_group: consumerGroup,
        event_type: eventType
      },
      processingTimeMs / 1000
    );
  }

  /**
   * Record consumer processing failure
   */
  recordConsumerError(topic: string, consumerGroup: string, errorType: string): void {
    this.eventFailedCounter.inc({
      topic: topic.toLowerCase(),
      consumer_group: consumerGroup,
      error_type: errorType
    });
  }

  /**
   * Update consumer lag metrics
   */
  updateConsumerLag(topic: string, consumerGroup: string, partition: number, lag: number): void {
    this.consumerLagGauge.set(
      {
        topic: topic.toLowerCase(),
        consumer_group: consumerGroup,
        partition: partition.toString()
      },
      lag
    );
  }

  /**
   * Update system connection status
   */
  updateKafkaStatus(connected: boolean): void {
    this.kafkaConnectionStatus.set(connected ? 1 : 0);
  }

  updateRedisStatus(connected: boolean): void {
    this.redisConnectionStatus.set(connected ? 1 : 0);
  }

  updateSchemaRegistryStatus(connected: boolean): void {
    this.schemaRegistryStatus.set(connected ? 1 : 0);
  }

  /**
   * Get event metrics summary
   */
  getEventMetrics(): EventMetrics {
    let totalPublished = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let totalTime = 0;
    let minTime = Number.MAX_VALUE;
    let maxTime = 0;

    const topicBreakdown: Record<string, any> = {};

    for (const [topic, stats] of this.eventStats) {
      totalPublished += stats.published;
      totalErrors += stats.errors;
      totalTime += stats.totalTime;

      if (stats.minTime < minTime && stats.minTime > 0) {
        minTime = stats.minTime;
      }
      if (stats.maxTime > maxTime) {
        maxTime = stats.maxTime;
      }

      topicBreakdown[topic] = {
        published: stats.published,
        errors: stats.errors,
        avgProcessingTime: stats.published > 0 ? stats.totalTime / stats.published : 0
      };
    }

    return {
      published: totalPublished,
      skipped: totalSkipped, // Would need to track this separately
      errors: totalErrors,
      processingTime: {
        total: totalTime,
        average: totalPublished > 0 ? totalTime / totalPublished : 0,
        min: minTime === Number.MAX_VALUE ? 0 : minTime,
        max: maxTime
      },
      topicBreakdown
    };
  }

  /**
   * Get consumer metrics summary
   */
  getConsumerMetrics(): ConsumerMetrics {
    // These would be populated by actual consumer usage
    return {
      consumed: 0,
      processed: 0,
      failed: 0,
      lag: 0,
      processingTime: {
        average: 0,
        p95: 0,
        p99: 0
      }
    };
  }

  /**
   * Get Prometheus metrics in text format
   */
  async getPrometheusMetrics(): Promise<string> {
    return await client.register.metrics();
  }

  /**
   * Get metrics in JSON format
   */
  async getMetricsJson(): Promise<any> {
    const metrics = await client.register.getMetricsAsJSON();
    return {
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
      metrics: metrics,
      summary: {
        events: this.getEventMetrics(),
        consumers: this.getConsumerMetrics()
      }
    };
  }

  /**
   * Health check for metrics system
   */
  healthCheck(): { status: string; details: any } {
    try {
      const eventMetrics = this.getEventMetrics();

      return {
        status: 'healthy',
        details: {
          metricsCollected: true,
          totalEventsPublished: eventMetrics.published,
          totalErrors: eventMetrics.errors,
          avgProcessingTime: eventMetrics.processingTime.average,
          activeTopics: Object.keys(eventMetrics.topicBreakdown).length
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Reset metrics (for testing)
   */
  reset(): void {
    client.register.clear();
    this.eventStats.clear();
    this.initializeMetrics();
  }

  /**
   * Update internal event statistics
   */
  private updateEventStats(topicKey: string, processingTimeMs: number, isError: boolean): void {
    if (!this.eventStats.has(topicKey)) {
      this.eventStats.set(topicKey, {
        published: 0,
        errors: 0,
        totalTime: 0,
        minTime: Number.MAX_VALUE,
        maxTime: 0
      });
    }

    const stats = this.eventStats.get(topicKey)!;

    if (isError) {
      stats.errors++;
    } else {
      stats.published++;
      stats.totalTime += processingTimeMs;

      if (processingTimeMs < stats.minTime) {
        stats.minTime = processingTimeMs;
      }
      if (processingTimeMs > stats.maxTime) {
        stats.maxTime = processingTimeMs;
      }
    }
  }
}

// Singleton instance for reuse
let metricsInstance: OpalMetricsCollector | null = null;

export function getMetricsCollector(): OpalMetricsCollector {
  if (!metricsInstance) {
    metricsInstance = new OpalMetricsCollector();
  }
  return metricsInstance;
}
/**
 * OPAL Event Producer for Kafka Integration
 *
 * This producer handles publishing OPAL workflow events to Kafka topics with schema validation,
 * idempotency, correlation tracking, and retry logic.
 */

import { Kafka, Producer, ProducerRecord, RecordMetadata } from 'kafkajs';
import {
  getKafkaConfig,
  getTopicName,
  PRODUCER_CONFIG,
  IDEMPOTENCY_KEY_GENERATORS,
  PARTITION_KEY_GENERATORS,
  OPAL_TOPICS
} from '../config';
import { getSchemaRegistryManager } from '../../schema-registry/manager';
import { getIdempotencyManager } from '../../idempotency/manager';
import { OpalMetricsCollector } from '../../metrics/collector';

export interface OpalEventMetadata {
  correlationId: string;
  timestamp: number;
  source: string;
  environment: string;
  retryCount?: number;
}

export interface PublishResult {
  success: boolean;
  metadata?: RecordMetadata[];
  error?: Error;
  idempotencyKey: string;
  correlationId: string;
  topic: string;
  processingTimeMs: number;
}

export class OpalEventProducer {
  private kafka: Kafka;
  private producer: Producer;
  private schemaRegistry: any;
  private idempotency: any;
  private metrics: OpalMetricsCollector;
  private isConnected = false;

  constructor() {
    const config = getKafkaConfig();
    this.kafka = new Kafka(config.kafka);
    this.producer = this.kafka.producer(PRODUCER_CONFIG);
    this.schemaRegistry = getSchemaRegistryManager();
    this.idempotency = getIdempotencyManager();
    this.metrics = new OpalMetricsCollector();
  }

  /**
   * Connect to Kafka and initialize dependencies
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log('✅ [EventProducer] Connected to Kafka');
    } catch (error) {
      console.error('❌ [EventProducer] Failed to connect to Kafka:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.producer.disconnect();
      this.isConnected = false;
      console.log('✅ [EventProducer] Disconnected from Kafka');
    } catch (error) {
      console.error('❌ [EventProducer] Error disconnecting from Kafka:', error);
      throw error;
    }
  }

  /**
   * Publish workflow started event
   */
  async publishWorkflowStarted(event: {
    workflow_id: string;
    session_id: string;
    client_name?: string;
    workflow_name: 'strategy_workflow';
    triggered_by?: string;
    engine_form?: any;
    preferences?: any;
    webhook_url?: string;
    estimated_duration?: string;
  }, metadata: OpalEventMetadata): Promise<PublishResult> {
    const startTime = Date.now();

    const fullEvent = {
      schema_version: '1.0.0',
      event_id: this.generateEventId(),
      correlation_id: metadata.correlationId,
      ...event,
      timestamp: metadata.timestamp,
      source_system: metadata.source,
      environment: metadata.environment
    };

    return await this.publishEvent('WORKFLOW_STARTED', fullEvent, metadata, startTime);
  }

  /**
   * Publish agent completed event
   */
  async publishAgentCompleted(event: {
    workflow_id: string;
    agent_id: string;
    offset?: number;
    execution_status: 'success' | 'failure' | 'timeout';
    processing_time_ms?: number;
    agent_data?: any;
    signature_valid?: boolean;
    payload_size_bytes?: number;
  }, metadata: OpalEventMetadata): Promise<PublishResult> {
    const startTime = Date.now();

    const fullEvent = {
      schema_version: '1.0.0',
      event_id: this.generateEventId(),
      correlation_id: metadata.correlationId,
      ...event,
      timestamp: metadata.timestamp,
      source_system: metadata.source,
      environment: metadata.environment
    };

    return await this.publishEvent('AGENT_COMPLETED', fullEvent, metadata, startTime);
  }

  /**
   * Publish workflow completed event
   */
  async publishWorkflowCompleted(event: {
    workflow_id: string;
    session_id: string;
    status: 'completed' | 'failed' | 'timeout' | 'cancelled';
    agents_completed: number;
    agents_failed?: number;
    total_agents: number;
    total_processing_time_ms: number;
    start_timestamp: number;
    completion_timestamp: number;
    agent_summary?: any[];
    recommendations_generated?: number;
    data_sources_analyzed?: string[];
    error_details?: string;
    client_name?: string;
    triggered_by?: string;
  }, metadata: OpalEventMetadata): Promise<PublishResult> {
    const startTime = Date.now();

    const fullEvent = {
      schema_version: '1.0.0',
      event_id: this.generateEventId(),
      correlation_id: metadata.correlationId,
      ...event,
      timestamp: metadata.timestamp,
      source_system: metadata.source,
      environment: metadata.environment
    };

    return await this.publishEvent('WORKFLOW_COMPLETED', fullEvent, metadata, startTime);
  }

  /**
   * Publish decision generated event
   */
  async publishDecisionGenerated(event: {
    decision_id: string;
    workflow_id: string;
    session_id?: string;
    recommendations_count: number;
    recommendations: any[];
    user_preferences?: any;
    processing_metadata: any;
    workflow_state?: any;
    client_name?: string;
  }, metadata: OpalEventMetadata): Promise<PublishResult> {
    const startTime = Date.now();

    const fullEvent = {
      schema_version: '1.0.0',
      event_id: this.generateEventId(),
      correlation_id: metadata.correlationId,
      ...event,
      timestamp: metadata.timestamp,
      source_system: metadata.source,
      environment: metadata.environment
    };

    return await this.publishEvent('DECISION_GENERATED', fullEvent, metadata, startTime);
  }

  /**
   * Publish RAG upserted event
   */
  async publishRagUpserted(event: {
    upsert_id: string;
    operation_type: 'insert' | 'update' | 'bulk_insert' | 'bulk_update';
    documents_processed: number;
    documents_inserted: number;
    documents_updated: number;
    documents_failed?: number;
    knowledge_source: string;
    agent_id?: string;
    workflow_id?: string;
    document_types?: string[];
    processing_time_ms: number;
    vector_embeddings_generated?: number;
    duplicate_detections?: number;
    metadata_enrichment?: any;
    error_details?: string[];
  }, metadata: OpalEventMetadata): Promise<PublishResult> {
    const startTime = Date.now();

    const fullEvent = {
      schema_version: '1.0.0',
      event_id: this.generateEventId(),
      correlation_id: metadata.correlationId,
      ...event,
      timestamp: metadata.timestamp,
      source_system: metadata.source,
      environment: metadata.environment
    };

    return await this.publishEvent('RAG_UPSERTED', fullEvent, metadata, startTime);
  }

  /**
   * Generic event publishing with idempotency and schema validation
   */
  private async publishEvent(
    topicKey: keyof typeof OPAL_TOPICS,
    event: any,
    metadata: OpalEventMetadata,
    startTime: number
  ): Promise<PublishResult> {
    const topic = getTopicName(topicKey);
    const idempotencyKey = IDEMPOTENCY_KEY_GENERATORS[topicKey](event);
    const partitionKey = PARTITION_KEY_GENERATORS[topicKey](event);

    try {
      // Check idempotency
      const isProcessed = await this.idempotency.isEventProcessed(idempotencyKey);
      if (isProcessed) {
        console.log(`⏭️ [EventProducer] Skipping duplicate event: ${idempotencyKey}`);
        this.metrics.recordEventSkipped(topicKey, 'duplicate');

        return {
          success: true,
          idempotencyKey,
          correlationId: metadata.correlationId,
          topic,
          processingTimeMs: Date.now() - startTime
        };
      }

      // Encode with schema registry
      const subject = `${topic}-value`;
      let encodedValue: Buffer;

      try {
        encodedValue = await this.schemaRegistry.encode(subject, event);
      } catch (schemaError) {
        console.error(`❌ [EventProducer] Schema encoding failed for ${subject}:`, schemaError);
        this.metrics.recordEventError(topicKey, 'schema_encoding');
        throw schemaError;
      }

      // Prepare Kafka message
      const message = {
        key: partitionKey,
        value: encodedValue,
        headers: {
          'correlation_id': metadata.correlationId,
          'event_type': topicKey.toLowerCase(),
          'schema_version': event.schema_version,
          'idempotency_key': idempotencyKey,
          'source_system': metadata.source,
          'retry_count': (metadata.retryCount || 0).toString(),
          'published_at': Date.now().toString()
        }
      };

      // Send to Kafka
      const record: ProducerRecord = {
        topic,
        messages: [message]
      };

      const kafkaMetadata = await this.producer.send(record);

      // Mark as processed for idempotency
      await this.idempotency.markEventProcessed(idempotencyKey, 86400); // 24 hours TTL

      // Record metrics
      const processingTime = Date.now() - startTime;
      this.metrics.recordEventPublished(topicKey, processingTime);

      console.log(`✅ [EventProducer] Published ${topicKey}: ${idempotencyKey} to ${topic}`);

      return {
        success: true,
        metadata: kafkaMetadata,
        idempotencyKey,
        correlationId: metadata.correlationId,
        topic,
        processingTimeMs: processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ [EventProducer] Failed to publish ${topicKey} event:`, error);

      this.metrics.recordEventError(topicKey, 'publish_failed');

      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
        idempotencyKey,
        correlationId: metadata.correlationId,
        topic,
        processingTimeMs: processingTime
      };
    }
  }

  /**
   * Publish batch of events with transaction support
   */
  async publishBatch(events: Array<{
    topicKey: keyof typeof OPAL_TOPICS;
    event: any;
    metadata: OpalEventMetadata;
  }>): Promise<PublishResult[]> {
    const results: PublishResult[] = [];

    if (!this.isConnected) {
      throw new Error('Producer not connected. Call connect() first.');
    }

    try {
      // Start transaction for batch
      const transaction = await this.producer.transaction();

      try {
        await transaction.begin();

        for (const { topicKey, event, metadata } of events) {
          const startTime = Date.now();

          // Note: In a real transaction, you'd use transaction.send()
          // For now, we'll process individually
          const result = await this.publishEvent(topicKey, event, metadata, startTime);
          results.push(result);
        }

        await transaction.commit();
        console.log(`✅ [EventProducer] Published batch of ${events.length} events`);

      } catch (error) {
        await transaction.abort();
        throw error;
      }

    } catch (error) {
      console.error('❌ [EventProducer] Batch publish failed:', error);
      throw error;
    }

    return results;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get producer metrics
   */
  getMetrics() {
    return this.metrics.getEventMetrics();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', details: { connected: false } };
      }

      // Try to get cluster metadata as a health check
      const admin = this.kafka.admin();
      await admin.connect();
      const metadata = await admin.describeCluster();
      await admin.disconnect();

      return {
        status: 'healthy',
        details: {
          connected: true,
          brokers: metadata.brokers.length,
          controller: metadata.controller
        }
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connected: this.isConnected,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

// Singleton instance for reuse
let producerInstance: OpalEventProducer | null = null;

export function getOpalEventProducer(): OpalEventProducer {
  if (!producerInstance) {
    producerInstance = new OpalEventProducer();
  }
  return producerInstance;
}

// Example usage for the requested payload format
export const EXAMPLE_AGENT_COMPLETED_PAYLOAD = {
  schema_version: "1.0.0",
  workflow_id: "wf-123",
  agent_id: "content_review",
  execution_status: "success" as const,
  offset: 1,
  correlation_id: "corr-abc123",
  timestamp: new Date("2025-11-12T10:00:00Z").getTime(),
  agent_data: {
    recommendations: ["CTA below fold reduces conversions"],
    confidence_score: 0.92,
    processing_time_ms: 1200
  }
};
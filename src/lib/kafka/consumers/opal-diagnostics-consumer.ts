/**
 * OPAL Diagnostics Event Consumer
 *
 * This consumer processes OPAL events for diagnostic purposes, monitoring workflow health,
 * agent performance, and system reliability metrics.
 */

import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import {
  getKafkaConfig,
  getTopicName,
  CONSUMER_GROUPS,
  OPAL_TOPICS
} from '../config';
import { getSchemaRegistryManager } from '../../schema-registry/manager';
import { getIdempotencyManager } from '../../idempotency/manager';
import { getMetricsCollector } from '../../metrics/collector';

export interface DiagnosticEvent {
  eventId: string;
  correlationId: string;
  timestamp: number;
  eventType: string;
  sourceSystem: string;
  environment: string;
  payload: any;
}

export interface DiagnosticSummary {
  totalEventsProcessed: number;
  eventsByType: Record<string, number>;
  errorRate: number;
  avgProcessingTime: number;
  recentErrors: Array<{
    timestamp: number;
    eventType: string;
    error: string;
    correlationId: string;
  }>;
}

export class OpalDiagnosticsConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private schemaRegistry: any;
  private idempotency: any;
  private metrics: any;
  private isRunning = false;

  // Diagnostic tracking
  private diagnosticStats = {
    totalProcessed: 0,
    eventCounts: new Map<string, number>(),
    errors: new Array<any>(),
    processingTimes: new Array<number>(),
    lastProcessedTimestamp: 0
  };

  constructor() {
    const config = getKafkaConfig();
    this.kafka = new Kafka(config.kafka);
    this.consumer = this.kafka.consumer(CONSUMER_GROUPS.DIAGNOSTICS.config);
    this.schemaRegistry = getSchemaRegistryManager();
    this.idempotency = getIdempotencyManager();
    this.metrics = getMetricsCollector();
  }

  /**
   * Start consuming OPAL events for diagnostics
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 [DiagnosticsConsumer] Already running');
      return;
    }

    try {
      await this.consumer.connect();
      console.log('✅ [DiagnosticsConsumer] Connected to Kafka');

      // Subscribe to all OPAL event topics
      const topics = [
        getTopicName('WORKFLOW_STARTED'),
        getTopicName('AGENT_COMPLETED'),
        getTopicName('WORKFLOW_COMPLETED'),
        getTopicName('DECISION_GENERATED'),
        getTopicName('RAG_UPSERTED'),
        getTopicName('DECISION_DEGRADED'),
        getTopicName('PREFERENCES_UPDATED')
      ];

      await this.consumer.subscribe({
        topics,
        fromBeginning: false // Only process new events
      });

      console.log(`📋 [DiagnosticsConsumer] Subscribed to ${topics.length} topics`);

      // Start processing messages
      await this.consumer.run({
        eachMessage: async (payload) => {
          await this.processMessage(payload);
        },
        partitionsConsumedConcurrently: 3
      });

      this.isRunning = true;
      console.log('🚀 [DiagnosticsConsumer] Started processing events');

    } catch (error) {
      console.error('❌ [DiagnosticsConsumer] Failed to start consumer:', error);
      throw error;
    }
  }

  /**
   * Stop the consumer
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    try {
      await this.consumer.disconnect();
      this.isRunning = false;
      console.log('✅ [DiagnosticsConsumer] Stopped successfully');
    } catch (error) {
      console.error('❌ [DiagnosticsConsumer] Error stopping consumer:', error);
      throw error;
    }
  }

  /**
   * Process individual Kafka message
   */
  private async processMessage(payload: EachMessagePayload): Promise<void> {
    const startTime = Date.now();
    const { topic, partition, message } = payload;

    try {
      // Record consumption metrics
      this.metrics.recordEventConsumed(topic, CONSUMER_GROUPS.DIAGNOSTICS.groupId, partition);

      // Decode message using schema registry
      const decodedMessage = await this.schemaRegistry.decode(message.value);

      // Extract headers
      const headers = this.extractHeaders(message.headers);

      // Create diagnostic event
      const diagnosticEvent: DiagnosticEvent = {
        eventId: decodedMessage.event_id || 'unknown',
        correlationId: headers.correlation_id || decodedMessage.correlation_id || 'unknown',
        timestamp: decodedMessage.timestamp || Date.now(),
        eventType: headers.event_type || this.inferEventType(topic),
        sourceSystem: headers.source_system || decodedMessage.source_system || 'unknown',
        environment: decodedMessage.environment || process.env.NODE_ENV || 'unknown',
        payload: decodedMessage
      };

      // Check for duplicate processing (idempotency)
      const idempotencyKey = `diagnostics:${diagnosticEvent.eventId}`;
      const alreadyProcessed = await this.idempotency.isEventProcessed(idempotencyKey);

      if (alreadyProcessed) {
        console.log(`⏭️ [DiagnosticsConsumer] Skipping duplicate event: ${diagnosticEvent.eventId}`);
        return;
      }

      // Process the diagnostic event
      await this.processDiagnosticEvent(diagnosticEvent);

      // Mark as processed
      await this.idempotency.markEventProcessed(idempotencyKey, 3600); // 1 hour TTL

      // Update metrics
      const processingTime = Date.now() - startTime;
      this.metrics.recordEventProcessed(
        topic,
        CONSUMER_GROUPS.DIAGNOSTICS.groupId,
        diagnosticEvent.eventType,
        processingTime
      );

      // Update internal stats
      this.updateDiagnosticStats(diagnosticEvent.eventType, processingTime);

      console.log(`✅ [DiagnosticsConsumer] Processed ${diagnosticEvent.eventType}: ${diagnosticEvent.eventId} (${processingTime}ms)`);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ [DiagnosticsConsumer] Failed to process message from ${topic}:`, error);

      // Record error metrics
      const errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
      this.metrics.recordConsumerError(topic, CONSUMER_GROUPS.DIAGNOSTICS.groupId, errorType);

      // Track error for diagnostics
      this.recordDiagnosticError(topic, error, 'unknown');

      // Don't throw - we want to continue processing other messages
    }
  }

  /**
   * Process diagnostic event based on type
   */
  private async processDiagnosticEvent(event: DiagnosticEvent): Promise<void> {
    switch (event.eventType.toUpperCase()) {
      case 'WORKFLOW_STARTED':
        await this.processWorkflowStarted(event);
        break;

      case 'AGENT_COMPLETED':
        await this.processAgentCompleted(event);
        break;

      case 'WORKFLOW_COMPLETED':
        await this.processWorkflowCompleted(event);
        break;

      case 'DECISION_GENERATED':
        await this.processDecisionGenerated(event);
        break;

      case 'RAG_UPSERTED':
        await this.processRagUpserted(event);
        break;

      case 'DECISION_DEGRADED':
        await this.processDecisionDegraded(event);
        break;

      case 'PREFERENCES_UPDATED':
        await this.processPreferencesUpdated(event);
        break;

      default:
        console.warn(`⚠️ [DiagnosticsConsumer] Unknown event type: ${event.eventType}`);
    }
  }

  /**
   * Process workflow started events
   */
  private async processWorkflowStarted(event: DiagnosticEvent): Promise<void> {
    const payload = event.payload;

    console.log(`🚀 [Diagnostics] Workflow started: ${payload.workflow_id} (${payload.workflow_name})`);

    // Track workflow initialization metrics
    if (payload.estimated_duration) {
      console.log(`⏱️ [Diagnostics] Estimated duration: ${payload.estimated_duration}`);
    }

    // Monitor for potential issues
    if (payload.client_name) {
      console.log(`👤 [Diagnostics] Client: ${payload.client_name}`);
    }
  }

  /**
   * Process agent completed events
   */
  private async processAgentCompleted(event: DiagnosticEvent): Promise<void> {
    const payload = event.payload;

    console.log(`🤖 [Diagnostics] Agent completed: ${payload.agent_id} (${payload.execution_status})`);

    // Track agent performance
    if (payload.processing_time_ms) {
      console.log(`⏱️ [Diagnostics] Agent processing time: ${payload.processing_time_ms}ms`);

      // Alert on slow agents (>5 seconds)
      if (payload.processing_time_ms > 5000) {
        console.warn(`⚠️ [Diagnostics] Slow agent detected: ${payload.agent_id} (${payload.processing_time_ms}ms)`);
      }
    }

    // Check for failed agents
    if (payload.execution_status === 'failure') {
      console.error(`❌ [Diagnostics] Agent failed: ${payload.agent_id} in workflow ${payload.workflow_id}`);
      this.recordDiagnosticError('agent_failure', new Error('Agent execution failed'), event.correlationId);
    }

    // Monitor signature validation
    if (payload.signature_valid === false) {
      console.warn(`⚠️ [Diagnostics] Invalid signature for agent: ${payload.agent_id}`);
    }
  }

  /**
   * Process workflow completed events
   */
  private async processWorkflowCompleted(event: DiagnosticEvent): Promise<void> {
    const payload = event.payload;

    console.log(`✅ [Diagnostics] Workflow completed: ${payload.workflow_id} (${payload.status})`);

    // Calculate workflow efficiency
    const totalTime = payload.total_processing_time_ms;
    const agentCount = payload.total_agents;
    const successRate = (payload.agents_completed / agentCount) * 100;

    console.log(`📊 [Diagnostics] Workflow stats: ${payload.agents_completed}/${agentCount} agents (${successRate.toFixed(1)}% success) in ${totalTime}ms`);

    // Alert on failed workflows
    if (payload.status === 'failed' || payload.status === 'timeout') {
      console.error(`❌ [Diagnostics] Workflow ${payload.status}: ${payload.workflow_id}`);
      if (payload.error_details) {
        console.error(`   Error: ${payload.error_details}`);
      }
    }

    // Monitor workflow duration
    if (totalTime > 30000) { // >30 seconds
      console.warn(`⚠️ [Diagnostics] Long workflow detected: ${payload.workflow_id} (${totalTime}ms)`);
    }
  }

  /**
   * Process decision generated events
   */
  private async processDecisionGenerated(event: DiagnosticEvent): Promise<void> {
    const payload = event.payload;

    console.log(`🎯 [Diagnostics] Decision generated: ${payload.decision_id} (${payload.recommendations_count} recommendations)`);

    // Monitor recommendation quality
    if (payload.recommendations_count === 0) {
      console.warn(`⚠️ [Diagnostics] No recommendations generated for decision: ${payload.decision_id}`);
    }
  }

  /**
   * Process RAG upserted events
   */
  private async processRagUpserted(event: DiagnosticEvent): Promise<void> {
    const payload = event.payload;

    console.log(`📚 [Diagnostics] RAG upserted: ${payload.upsert_id} (${payload.documents_processed} docs)`);

    // Monitor RAG performance
    if (payload.documents_failed && payload.documents_failed > 0) {
      console.warn(`⚠️ [Diagnostics] RAG failures: ${payload.documents_failed}/${payload.documents_processed} documents failed`);
    }
  }

  /**
   * Process decision degraded events
   */
  private async processDecisionDegraded(event: DiagnosticEvent): Promise<void> {
    const payload = event.payload;

    console.warn(`⚠️ [Diagnostics] Decision quality degraded: ${payload.degradation_id}`);
    this.recordDiagnosticError('decision_degraded', new Error('Decision quality degradation'), event.correlationId);
  }

  /**
   * Process preferences updated events
   */
  private async processPreferencesUpdated(event: DiagnosticEvent): Promise<void> {
    const payload = event.payload;

    console.log(`⚙️ [Diagnostics] Preferences updated: ${payload.user_id} (${payload.update_type})`);
  }

  /**
   * Get diagnostic summary
   */
  getDiagnosticSummary(): DiagnosticSummary {
    const totalProcessed = this.diagnosticStats.totalProcessed;
    const errorCount = this.diagnosticStats.errors.length;
    const avgProcessingTime = this.diagnosticStats.processingTimes.length > 0
      ? this.diagnosticStats.processingTimes.reduce((a, b) => a + b, 0) / this.diagnosticStats.processingTimes.length
      : 0;

    const eventsByType: Record<string, number> = {};
    for (const [type, count] of this.diagnosticStats.eventCounts) {
      eventsByType[type] = count;
    }

    return {
      totalEventsProcessed: totalProcessed,
      eventsByType,
      errorRate: totalProcessed > 0 ? (errorCount / totalProcessed) * 100 : 0,
      avgProcessingTime: Math.round(avgProcessingTime),
      recentErrors: this.diagnosticStats.errors.slice(-10) // Last 10 errors
    };
  }

  /**
   * Health check for diagnostics consumer
   */
  healthCheck(): { status: string; details: any } {
    const summary = this.getDiagnosticSummary();

    return {
      status: this.isRunning ? 'running' : 'stopped',
      details: {
        running: this.isRunning,
        lastProcessed: this.diagnosticStats.lastProcessedTimestamp,
        timeSinceLastEvent: Date.now() - this.diagnosticStats.lastProcessedTimestamp,
        ...summary
      }
    };
  }

  /**
   * Extract headers from Kafka message
   */
  private extractHeaders(headers: any): Record<string, string> {
    if (!headers) return {};

    const extracted: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (Buffer.isBuffer(value)) {
        extracted[key] = value.toString('utf8');
      } else if (typeof value === 'string') {
        extracted[key] = value;
      }
    }
    return extracted;
  }

  /**
   * Infer event type from topic name
   */
  private inferEventType(topic: string): string {
    for (const [key, def] of Object.entries(OPAL_TOPICS)) {
      if (topic.includes(def.name) || topic.endsWith(def.name)) {
        return key;
      }
    }
    return 'UNKNOWN';
  }

  /**
   * Update diagnostic statistics
   */
  private updateDiagnosticStats(eventType: string, processingTime: number): void {
    this.diagnosticStats.totalProcessed++;
    this.diagnosticStats.eventCounts.set(eventType, (this.diagnosticStats.eventCounts.get(eventType) || 0) + 1);
    this.diagnosticStats.processingTimes.push(processingTime);
    this.diagnosticStats.lastProcessedTimestamp = Date.now();

    // Keep only last 1000 processing times
    if (this.diagnosticStats.processingTimes.length > 1000) {
      this.diagnosticStats.processingTimes = this.diagnosticStats.processingTimes.slice(-1000);
    }
  }

  /**
   * Record diagnostic error
   */
  private recordDiagnosticError(eventType: string, error: any, correlationId: string): void {
    const errorRecord = {
      timestamp: Date.now(),
      eventType,
      error: error instanceof Error ? error.message : String(error),
      correlationId
    };

    this.diagnosticStats.errors.push(errorRecord);

    // Keep only last 100 errors
    if (this.diagnosticStats.errors.length > 100) {
      this.diagnosticStats.errors = this.diagnosticStats.errors.slice(-100);
    }
  }
}

// Singleton instance for reuse
let diagnosticsConsumerInstance: OpalDiagnosticsConsumer | null = null;

export function getDiagnosticsConsumer(): OpalDiagnosticsConsumer {
  if (!diagnosticsConsumerInstance) {
    diagnosticsConsumerInstance = new OpalDiagnosticsConsumer();
  }
  return diagnosticsConsumerInstance;
}
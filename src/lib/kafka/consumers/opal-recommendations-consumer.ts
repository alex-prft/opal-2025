/**
 * OPAL Recommendations Event Consumer
 *
 * This consumer processes OPAL events specifically for recommendation generation,
 * intelligent decision-making, and user preference optimization.
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

export interface RecommendationContext {
  workflowId: string;
  sessionId?: string;
  clientName?: string;
  userPreferences?: any;
  workflowState?: any;
  correlationId: string;
  timestamp: number;
}

export interface ProcessedRecommendation {
  id: string;
  workflowId: string;
  recommendations: any[];
  confidenceScore?: number;
  processingMetadata: any;
  generatedAt: number;
  context: RecommendationContext;
}

export interface RecommendationMetrics {
  totalRecommendationsGenerated: number;
  averageConfidenceScore: number;
  recommendationsByClient: Record<string, number>;
  processingTimeStats: {
    average: number;
    min: number;
    max: number;
  };
  qualityMetrics: {
    highConfidence: number; // >0.8
    mediumConfidence: number; // 0.5-0.8
    lowConfidence: number; // <0.5
    degradedDecisions: number;
  };
}

export class OpalRecommendationsConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private schemaRegistry: any;
  private idempotency: any;
  private metrics: any;
  private isRunning = false;

  // Recommendation tracking
  private recommendationStats = {
    totalGenerated: 0,
    confidenceScores: new Array<number>(),
    clientCounts: new Map<string, number>(),
    processingTimes: new Array<number>(),
    qualityBreakdown: {
      high: 0,
      medium: 0,
      low: 0,
      degraded: 0
    },
    recentRecommendations: new Array<ProcessedRecommendation>(),
    lastProcessedTimestamp: 0
  };

  // User preference cache for intelligent processing
  private preferenceCache = new Map<string, any>();

  constructor() {
    const config = getKafkaConfig();
    this.kafka = new Kafka(config.kafka);
    this.consumer = this.kafka.consumer(CONSUMER_GROUPS.RECOMMENDATIONS.config);
    this.schemaRegistry = getSchemaRegistryManager();
    this.idempotency = getIdempotencyManager();
    this.metrics = getMetricsCollector();
  }

  /**
   * Start consuming OPAL events for recommendations
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 [RecommendationsConsumer] Already running');
      return;
    }

    try {
      await this.consumer.connect();
      console.log('✅ [RecommendationsConsumer] Connected to Kafka');

      // Subscribe to recommendation-relevant topics
      const topics = [
        getTopicName('WORKFLOW_STARTED'),
        getTopicName('AGENT_COMPLETED'),
        getTopicName('WORKFLOW_COMPLETED'),
        getTopicName('DECISION_GENERATED'),
        getTopicName('DECISION_DEGRADED'),
        getTopicName('PREFERENCES_UPDATED'),
        getTopicName('RAG_UPSERTED')
      ];

      await this.consumer.subscribe({
        topics,
        fromBeginning: false
      });

      console.log(`📋 [RecommendationsConsumer] Subscribed to ${topics.length} topics`);

      // Start processing messages with higher concurrency for recommendations
      await this.consumer.run({
        eachMessage: async (payload) => {
          await this.processMessage(payload);
        },
        partitionsConsumedConcurrently: 5
      });

      this.isRunning = true;
      console.log('🚀 [RecommendationsConsumer] Started processing events for recommendations');

    } catch (error) {
      console.error('❌ [RecommendationsConsumer] Failed to start consumer:', error);
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
      console.log('✅ [RecommendationsConsumer] Stopped successfully');
    } catch (error) {
      console.error('❌ [RecommendationsConsumer] Error stopping consumer:', error);
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
      this.metrics.recordEventConsumed(topic, CONSUMER_GROUPS.RECOMMENDATIONS.groupId, partition);

      // Decode message using schema registry
      const decodedMessage = await this.schemaRegistry.decode(message.value);

      // Extract headers
      const headers = this.extractHeaders(message.headers);

      // Extract event type
      const eventType = headers.event_type || this.inferEventType(topic);

      // Check for duplicate processing (idempotency)
      const eventId = decodedMessage.event_id || `${topic}-${Date.now()}`;
      const idempotencyKey = `recommendations:${eventId}`;
      const alreadyProcessed = await this.idempotency.isEventProcessed(idempotencyKey);

      if (alreadyProcessed) {
        console.log(`⏭️ [RecommendationsConsumer] Skipping duplicate event: ${eventId}`);
        return;
      }

      // Process based on event type
      await this.processRecommendationEvent(eventType, decodedMessage, headers);

      // Mark as processed
      await this.idempotency.markEventProcessed(idempotencyKey, 7200); // 2 hours TTL

      // Update metrics
      const processingTime = Date.now() - startTime;
      this.metrics.recordEventProcessed(
        topic,
        CONSUMER_GROUPS.RECOMMENDATIONS.groupId,
        eventType,
        processingTime
      );

      this.recommendationStats.processingTimes.push(processingTime);
      this.recommendationStats.lastProcessedTimestamp = Date.now();

      console.log(`✅ [RecommendationsConsumer] Processed ${eventType}: ${eventId} (${processingTime}ms)`);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ [RecommendationsConsumer] Failed to process message from ${topic}:`, error);

      // Record error metrics
      const errorType = error instanceof Error ? error.constructor.name : 'UnknownError';
      this.metrics.recordConsumerError(topic, CONSUMER_GROUPS.RECOMMENDATIONS.groupId, errorType);
    }
  }

  /**
   * Process recommendation-related events
   */
  private async processRecommendationEvent(
    eventType: string,
    payload: any,
    headers: Record<string, string>
  ): Promise<void> {
    switch (eventType.toUpperCase()) {
      case 'WORKFLOW_STARTED':
        await this.processWorkflowStarted(payload, headers);
        break;

      case 'AGENT_COMPLETED':
        await this.processAgentCompleted(payload, headers);
        break;

      case 'WORKFLOW_COMPLETED':
        await this.processWorkflowCompleted(payload, headers);
        break;

      case 'DECISION_GENERATED':
        await this.processDecisionGenerated(payload, headers);
        break;

      case 'DECISION_DEGRADED':
        await this.processDecisionDegraded(payload, headers);
        break;

      case 'PREFERENCES_UPDATED':
        await this.processPreferencesUpdated(payload, headers);
        break;

      case 'RAG_UPSERTED':
        await this.processRagUpserted(payload, headers);
        break;

      default:
        console.log(`📝 [RecommendationsConsumer] Processing unknown event: ${eventType}`);
    }
  }

  /**
   * Process workflow started for recommendation context
   */
  private async processWorkflowStarted(payload: any, headers: Record<string, string>): Promise<void> {
    console.log(`🚀 [Recommendations] Workflow started: ${payload.workflow_id}`);

    // Cache user preferences for this workflow
    if (payload.preferences) {
      this.preferenceCache.set(payload.workflow_id, {
        preferences: payload.preferences,
        clientName: payload.client_name,
        sessionId: payload.session_id,
        cachedAt: Date.now()
      });

      console.log(`💾 [Recommendations] Cached preferences for workflow: ${payload.workflow_id}`);
    }

    // Prepare recommendation context
    const context: RecommendationContext = {
      workflowId: payload.workflow_id,
      sessionId: payload.session_id,
      clientName: payload.client_name,
      userPreferences: payload.preferences,
      correlationId: headers.correlation_id || payload.correlation_id,
      timestamp: payload.timestamp
    };

    // Pre-load relevant knowledge for this workflow
    await this.preloadRecommendationContext(context);
  }

  /**
   * Process agent completion for incremental recommendations
   */
  private async processAgentCompleted(payload: any, headers: Record<string, string>): Promise<void> {
    console.log(`🤖 [Recommendations] Agent completed: ${payload.agent_id} for workflow ${payload.workflow_id}`);

    // Check if this agent generated actionable data
    if (payload.agent_data && payload.execution_status === 'success') {
      const agentRecommendations = this.extractAgentRecommendations(payload);

      if (agentRecommendations.length > 0) {
        console.log(`💡 [Recommendations] Found ${agentRecommendations.length} recommendations from agent: ${payload.agent_id}`);

        // Process incremental recommendations
        await this.processIncrementalRecommendations(payload.workflow_id, agentRecommendations, payload.agent_id);
      }
    }
  }

  /**
   * Process workflow completion for final recommendations
   */
  private async processWorkflowCompleted(payload: any, headers: Record<string, string>): Promise<void> {
    console.log(`✅ [Recommendations] Workflow completed: ${payload.workflow_id} (${payload.status})`);

    // Generate final recommendation summary
    if (payload.status === 'completed' && payload.agent_summary) {
      await this.generateFinalRecommendationSummary(payload);
    }

    // Clean up cached preferences
    this.preferenceCache.delete(payload.workflow_id);
  }

  /**
   * Process decision generation events (main recommendation processing)
   */
  private async processDecisionGenerated(payload: any, headers: Record<string, string>): Promise<void> {
    console.log(`🎯 [Recommendations] Decision generated: ${payload.decision_id}`);

    const processedRecommendation: ProcessedRecommendation = {
      id: payload.decision_id,
      workflowId: payload.workflow_id,
      recommendations: payload.recommendations || [],
      confidenceScore: this.calculateConfidenceScore(payload.recommendations),
      processingMetadata: payload.processing_metadata,
      generatedAt: Date.now(),
      context: {
        workflowId: payload.workflow_id,
        sessionId: payload.session_id,
        clientName: payload.client_name,
        userPreferences: payload.user_preferences,
        workflowState: payload.workflow_state,
        correlationId: headers.correlation_id || payload.correlation_id,
        timestamp: payload.timestamp
      }
    };

    // Apply intelligent recommendation processing
    await this.enhanceRecommendations(processedRecommendation);

    // Update statistics
    this.updateRecommendationStats(processedRecommendation);

    // Store recent recommendation
    this.recommendationStats.recentRecommendations.push(processedRecommendation);

    // Keep only last 100 recommendations
    if (this.recommendationStats.recentRecommendations.length > 100) {
      this.recommendationStats.recentRecommendations = this.recommendationStats.recentRecommendations.slice(-100);
    }

    console.log(`📊 [Recommendations] Processed decision with ${processedRecommendation.recommendations.length} recommendations (confidence: ${(processedRecommendation.confidenceScore || 0).toFixed(2)})`);
  }

  /**
   * Process decision degraded events for quality monitoring
   */
  private async processDecisionDegraded(payload: any, headers: Record<string, string>): Promise<void> {
    console.warn(`⚠️ [Recommendations] Decision quality degraded: ${payload.degradation_id}`);

    this.recommendationStats.qualityBreakdown.degraded++;

    // Analyze degradation patterns
    await this.analyzeRecommendationDegradation(payload);
  }

  /**
   * Process preference updates for personalization
   */
  private async processPreferencesUpdated(payload: any, headers: Record<string, string>): Promise<void> {
    console.log(`⚙️ [Recommendations] Preferences updated for user: ${payload.user_id}`);

    // Update preference-based recommendation strategies
    await this.updateRecommendationStrategies(payload);
  }

  /**
   * Process RAG upserted events for knowledge base updates
   */
  private async processRagUpserted(payload: any, headers: Record<string, string>): Promise<void> {
    console.log(`📚 [Recommendations] Knowledge base updated: ${payload.upsert_id}`);

    // Invalidate recommendation caches that might be affected
    await this.invalidateAffectedCaches(payload);
  }

  /**
   * Extract recommendations from agent data
   */
  private extractAgentRecommendations(payload: any): any[] {
    const agentData = payload.agent_data;
    if (!agentData) return [];

    // Look for recommendations in various formats
    const recommendations: any[] = [];

    if (agentData.recommendations && Array.isArray(agentData.recommendations)) {
      recommendations.push(...agentData.recommendations);
    }

    if (agentData.insights && Array.isArray(agentData.insights)) {
      recommendations.push(...agentData.insights);
    }

    if (agentData.suggestions && Array.isArray(agentData.suggestions)) {
      recommendations.push(...agentData.suggestions);
    }

    return recommendations;
  }

  /**
   * Calculate confidence score for recommendations
   */
  private calculateConfidenceScore(recommendations: any[]): number {
    if (!recommendations || recommendations.length === 0) return 0;

    let totalConfidence = 0;
    let count = 0;

    for (const rec of recommendations) {
      if (typeof rec === 'object' && rec.confidence_score !== undefined) {
        totalConfidence += rec.confidence_score;
        count++;
      } else if (typeof rec === 'object' && rec.score !== undefined) {
        totalConfidence += rec.score;
        count++;
      }
    }

    return count > 0 ? totalConfidence / count : 0.5; // Default to medium confidence
  }

  /**
   * Enhance recommendations with intelligent processing
   */
  private async enhanceRecommendations(processedRecommendation: ProcessedRecommendation): Promise<void> {
    const { workflowId } = processedRecommendation.context;

    // Apply user preferences
    const cachedPrefs = this.preferenceCache.get(workflowId);
    if (cachedPrefs) {
      processedRecommendation.recommendations = this.applyUserPreferences(
        processedRecommendation.recommendations,
        cachedPrefs.preferences
      );
    }

    // Apply contextual filters
    processedRecommendation.recommendations = this.applyContextualFilters(
      processedRecommendation.recommendations,
      processedRecommendation.context
    );

    // Rank by confidence and relevance
    processedRecommendation.recommendations = this.rankRecommendations(
      processedRecommendation.recommendations
    );
  }

  /**
   * Apply user preferences to recommendations
   */
  private applyUserPreferences(recommendations: any[], preferences: any): any[] {
    if (!preferences) return recommendations;

    return recommendations.map(rec => {
      // Apply preference-based scoring adjustments
      let adjustedScore = rec.confidence_score || rec.score || 0.5;

      // Example preference adjustments
      if (preferences.prioritize_performance && rec.type === 'performance') {
        adjustedScore *= 1.2;
      }

      if (preferences.avoid_complex_changes && rec.complexity === 'high') {
        adjustedScore *= 0.8;
      }

      return {
        ...rec,
        confidence_score: Math.min(1.0, adjustedScore),
        preference_adjusted: true
      };
    });
  }

  /**
   * Apply contextual filters to recommendations
   */
  private applyContextualFilters(recommendations: any[], context: RecommendationContext): any[] {
    return recommendations.filter(rec => {
      // Filter out irrelevant recommendations based on context
      if (context.clientName && rec.client_specific && rec.client_specific !== context.clientName) {
        return false;
      }

      // Add more contextual filters as needed
      return true;
    });
  }

  /**
   * Rank recommendations by confidence and relevance
   */
  private rankRecommendations(recommendations: any[]): any[] {
    return recommendations.sort((a, b) => {
      const scoreA = a.confidence_score || a.score || 0;
      const scoreB = b.confidence_score || b.score || 0;
      return scoreB - scoreA;
    });
  }

  /**
   * Pre-load recommendation context
   */
  private async preloadRecommendationContext(context: RecommendationContext): Promise<void> {
    console.log(`🔄 [Recommendations] Pre-loading context for workflow: ${context.workflowId}`);
    // Implementation would load relevant data for faster recommendation processing
  }

  /**
   * Process incremental recommendations
   */
  private async processIncrementalRecommendations(
    workflowId: string,
    recommendations: any[],
    agentId: string
  ): Promise<void> {
    console.log(`🔄 [Recommendations] Processing ${recommendations.length} incremental recommendations from ${agentId}`);
    // Implementation would process and potentially emit incremental recommendations
  }

  /**
   * Generate final recommendation summary
   */
  private async generateFinalRecommendationSummary(payload: any): Promise<void> {
    console.log(`📋 [Recommendations] Generating final summary for workflow: ${payload.workflow_id}`);
    // Implementation would create comprehensive recommendation summary
  }

  /**
   * Update recommendation statistics
   */
  private updateRecommendationStats(recommendation: ProcessedRecommendation): void {
    this.recommendationStats.totalGenerated++;

    if (recommendation.confidenceScore !== undefined) {
      this.recommendationStats.confidenceScores.push(recommendation.confidenceScore);

      // Update quality breakdown
      if (recommendation.confidenceScore > 0.8) {
        this.recommendationStats.qualityBreakdown.high++;
      } else if (recommendation.confidenceScore > 0.5) {
        this.recommendationStats.qualityBreakdown.medium++;
      } else {
        this.recommendationStats.qualityBreakdown.low++;
      }
    }

    // Update client counts
    const clientName = recommendation.context.clientName || 'unknown';
    this.recommendationStats.clientCounts.set(
      clientName,
      (this.recommendationStats.clientCounts.get(clientName) || 0) + 1
    );
  }

  /**
   * Get recommendation metrics
   */
  getRecommendationMetrics(): RecommendationMetrics {
    const scores = this.recommendationStats.confidenceScores;
    const times = this.recommendationStats.processingTimes;

    const avgConfidence = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    const avgTime = times.length > 0
      ? times.reduce((a, b) => a + b, 0) / times.length
      : 0;

    const recommendationsByClient: Record<string, number> = {};
    for (const [client, count] of this.recommendationStats.clientCounts) {
      recommendationsByClient[client] = count;
    }

    return {
      totalRecommendationsGenerated: this.recommendationStats.totalGenerated,
      averageConfidenceScore: parseFloat(avgConfidence.toFixed(3)),
      recommendationsByClient,
      processingTimeStats: {
        average: Math.round(avgTime),
        min: times.length > 0 ? Math.min(...times) : 0,
        max: times.length > 0 ? Math.max(...times) : 0
      },
      qualityMetrics: {
        highConfidence: this.recommendationStats.qualityBreakdown.high,
        mediumConfidence: this.recommendationStats.qualityBreakdown.medium,
        lowConfidence: this.recommendationStats.qualityBreakdown.low,
        degradedDecisions: this.recommendationStats.qualityBreakdown.degraded
      }
    };
  }

  /**
   * Health check for recommendations consumer
   */
  healthCheck(): { status: string; details: any } {
    const metrics = this.getRecommendationMetrics();

    return {
      status: this.isRunning ? 'running' : 'stopped',
      details: {
        running: this.isRunning,
        lastProcessed: this.recommendationStats.lastProcessedTimestamp,
        timeSinceLastEvent: Date.now() - this.recommendationStats.lastProcessedTimestamp,
        cachedPreferences: this.preferenceCache.size,
        ...metrics
      }
    };
  }

  /**
   * Analyze recommendation degradation patterns
   */
  private async analyzeRecommendationDegradation(payload: any): Promise<void> {
    console.log(`🔍 [Recommendations] Analyzing degradation pattern: ${payload.degradation_id}`);
    // Implementation would analyze patterns in degraded decisions
  }

  /**
   * Update recommendation strategies based on preferences
   */
  private async updateRecommendationStrategies(payload: any): Promise<void> {
    console.log(`🔄 [Recommendations] Updating strategies for user: ${payload.user_id}`);
    // Implementation would adapt recommendation algorithms
  }

  /**
   * Invalidate affected caches after knowledge base updates
   */
  private async invalidateAffectedCaches(payload: any): Promise<void> {
    console.log(`🗑️ [Recommendations] Invalidating caches affected by: ${payload.knowledge_source}`);
    // Implementation would clear relevant caches
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
}

// Singleton instance for reuse
let recommendationsConsumerInstance: OpalRecommendationsConsumer | null = null;

export function getRecommendationsConsumer(): OpalRecommendationsConsumer {
  if (!recommendationsConsumerInstance) {
    recommendationsConsumerInstance = new OpalRecommendationsConsumer();
  }
  return recommendationsConsumerInstance;
}
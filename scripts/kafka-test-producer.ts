#!/usr/bin/env tsx

/**
 * OPAL Kafka Producer Test Script
 *
 * This script tests the OPAL event producer by publishing sample events
 * to verify the complete event-driven architecture is working correctly.
 */

import { getOpalEventProducer } from '../src/lib/kafka/producers/opal-event-producer';
import { getTopicManager } from '../src/lib/kafka/topic-manager';
import { getSchemaRegistryManager } from '../src/lib/schema-registry/manager';
import { getIdempotencyManager } from '../src/lib/idempotency/manager';
import { getMetricsCollector } from '../src/lib/metrics/collector';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class KafkaProducerTester {
  private producer: any;
  private topicManager: any;
  private schemaRegistry: any;
  private idempotency: any;
  private metrics: any;

  constructor() {
    this.producer = getOpalEventProducer();
    this.topicManager = getTopicManager();
    this.schemaRegistry = getSchemaRegistryManager();
    this.idempotency = getIdempotencyManager();
    this.metrics = getMetricsCollector();
  }

  private log(level: string, message: string, color: string = colors.reset) {
    const timestamp = new Date().toISOString();
    console.log(`${color}[${timestamp}] ${level}: ${message}${colors.reset}`);
  }

  private info(message: string) {
    this.log('INFO', message, colors.blue);
  }

  private success(message: string) {
    this.log('SUCCESS', message, colors.green);
  }

  private warning(message: string) {
    this.log('WARNING', message, colors.yellow);
  }

  private error(message: string) {
    this.log('ERROR', message, colors.red);
  }

  async runHealthChecks(): Promise<void> {
    this.info('🔍 Running health checks...');

    try {
      // Check topic manager
      const topicHealth = await this.topicManager.getTopicHealthStatus();
      const healthyTopics = Object.values(topicHealth).filter((h: any) => h.exists).length;
      const totalTopics = Object.keys(topicHealth).length;

      if (healthyTopics === totalTopics) {
        this.success(`✅ All ${totalTopics} topics are healthy`);
      } else {
        this.warning(`⚠️ Only ${healthyTopics}/${totalTopics} topics are healthy`);
      }

      // Check producer health
      const producerHealth = await this.producer.healthCheck();
      if (producerHealth.status === 'healthy') {
        this.success(`✅ Producer is healthy (${producerHealth.details.brokers} brokers)`);
      } else {
        throw new Error(`Producer unhealthy: ${producerHealth.details.error}`);
      }

      // Check idempotency (Redis)
      const idempotencyHealth = await this.idempotency.healthCheck();
      if (idempotencyHealth.status === 'healthy') {
        this.success(`✅ Redis idempotency is healthy`);
      } else {
        throw new Error(`Redis unhealthy: ${idempotencyHealth.details.error}`);
      }

    } catch (error) {
      this.error(`❌ Health check failed: ${error}`);
      throw error;
    }
  }

  async testWorkflowStarted(): Promise<void> {
    this.info('🚀 Testing workflow started event...');

    const workflowData = {
      workflow_id: `test-workflow-${Date.now()}`,
      session_id: `session-${Math.random().toString(36).substr(2, 9)}`,
      client_name: 'test-client',
      workflow_name: 'strategy_workflow' as const,
      triggered_by: 'api-test',
      engine_form: JSON.stringify({ test: true }),
      preferences: JSON.stringify({ priority: 'performance' }),
      webhook_url: 'https://test.example.com/webhook',
      estimated_duration: '5 minutes'
    };

    const metadata = {
      correlationId: `corr-${Date.now()}`,
      timestamp: Date.now(),
      source: 'test-script',
      environment: process.env.NODE_ENV || 'development'
    };

    try {
      const result = await this.producer.publishWorkflowStarted(workflowData, metadata);

      if (result.success) {
        this.success(`✅ Published workflow started: ${result.idempotencyKey}`);
        this.info(`   Topic: ${result.topic}`);
        this.info(`   Processing time: ${result.processingTimeMs}ms`);
      } else {
        throw new Error(result.error?.message || 'Unknown error');
      }
    } catch (error) {
      this.error(`❌ Failed to publish workflow started: ${error}`);
      throw error;
    }
  }

  async testAgentCompleted(): Promise<void> {
    this.info('🤖 Testing agent completed event...');

    const agentData = {
      workflow_id: `test-workflow-${Date.now()}`,
      agent_id: 'content_review',
      offset: 1,
      execution_status: 'success' as const,
      processing_time_ms: 1500,
      agent_data: JSON.stringify({
        recommendations: [
          'Improve CTA positioning above the fold',
          'Optimize page load time by 20%',
          'Add social proof elements'
        ],
        confidence_score: 0.92,
        data_sources: ['analytics', 'heatmap', 'user_feedback']
      }),
      signature_valid: true,
      payload_size_bytes: 1024
    };

    const metadata = {
      correlationId: `corr-${Date.now()}`,
      timestamp: Date.now(),
      source: 'test-script',
      environment: process.env.NODE_ENV || 'development'
    };

    try {
      const result = await this.producer.publishAgentCompleted(agentData, metadata);

      if (result.success) {
        this.success(`✅ Published agent completed: ${result.idempotencyKey}`);
        this.info(`   Topic: ${result.topic}`);
        this.info(`   Processing time: ${result.processingTimeMs}ms`);
      } else {
        throw new Error(result.error?.message || 'Unknown error');
      }
    } catch (error) {
      this.error(`❌ Failed to publish agent completed: ${error}`);
      throw error;
    }
  }

  async testDecisionGenerated(): Promise<void> {
    this.info('🎯 Testing decision generated event...');

    const decisionData = {
      decision_id: `decision-${Date.now()}`,
      workflow_id: `test-workflow-${Date.now()}`,
      session_id: `session-${Math.random().toString(36).substr(2, 9)}`,
      recommendations_count: 3,
      recommendations: [
        {
          title: 'Optimize Landing Page Performance',
          description: 'Improve page load time to increase conversion rates',
          impact_score: 8.5,
          effort_score: 6.0,
          combined_ratio: 1.42,
          confidence: 0.87,
          category: 'performance',
          priority: 'high',
          evidence: [
            {
              agent_type: 'performance_analyzer',
              data_source: 'core_web_vitals',
              confidence: 0.92,
              summary: 'Page load time is 3.2s, target is <2s'
            }
          ]
        },
        {
          title: 'Enhance Call-to-Action Visibility',
          description: 'Make primary CTA more prominent and actionable',
          impact_score: 7.8,
          effort_score: 4.5,
          combined_ratio: 1.73,
          confidence: 0.85,
          category: 'conversion',
          priority: 'high'
        },
        {
          title: 'Add Social Proof Elements',
          description: 'Include customer testimonials and trust badges',
          impact_score: 6.2,
          effort_score: 5.0,
          combined_ratio: 1.24,
          confidence: 0.78,
          category: 'trust',
          priority: 'medium'
        }
      ],
      user_preferences: JSON.stringify({
        focus_areas: ['conversion', 'performance'],
        implementation_complexity: 'medium',
        timeline: '2_weeks'
      }),
      processing_metadata: JSON.stringify({
        processing_time_ms: 2500,
        agents_consulted: ['content_review', 'performance_analyzer', 'conversion_optimizer'],
        data_sources_analyzed: ['analytics', 'heatmap', 'user_feedback', 'competitor_analysis'],
        confidence_threshold: 0.7,
        ranking_algorithm: 'weighted_impact_effort'
      }),
      workflow_state: JSON.stringify({
        completed_agents: 3,
        total_agents: 3,
        workflow_status: 'completed'
      }),
      client_name: 'test-client'
    };

    const metadata = {
      correlationId: `corr-${Date.now()}`,
      timestamp: Date.now(),
      source: 'test-script',
      environment: process.env.NODE_ENV || 'development'
    };

    try {
      const result = await this.producer.publishDecisionGenerated(decisionData, metadata);

      if (result.success) {
        this.success(`✅ Published decision generated: ${result.idempotencyKey}`);
        this.info(`   Topic: ${result.topic}`);
        this.info(`   Processing time: ${result.processingTimeMs}ms`);
        this.info(`   Recommendations: ${decisionData.recommendations_count}`);
      } else {
        throw new Error(result.error?.message || 'Unknown error');
      }
    } catch (error) {
      this.error(`❌ Failed to publish decision generated: ${error}`);
      throw error;
    }
  }

  async testIdempotency(): Promise<void> {
    this.info('🔄 Testing idempotency...');

    const workflowData = {
      workflow_id: 'idempotency-test-workflow',
      session_id: 'idempotency-session',
      client_name: 'test-client',
      workflow_name: 'strategy_workflow' as const,
      triggered_by: 'idempotency-test'
    };

    const metadata = {
      correlationId: 'idempotency-correlation',
      timestamp: Date.now(),
      source: 'test-script',
      environment: process.env.NODE_ENV || 'development'
    };

    try {
      // Publish first time
      const result1 = await this.producer.publishWorkflowStarted(workflowData, metadata);
      if (!result1.success) {
        throw new Error('First publish failed');
      }

      // Publish same event again (should be skipped)
      const result2 = await this.producer.publishWorkflowStarted(workflowData, metadata);
      if (!result2.success) {
        throw new Error('Second publish failed');
      }

      this.success(`✅ Idempotency test passed`);
      this.info(`   First publish: processed`);
      this.info(`   Second publish: ${result1.processingTimeMs === result2.processingTimeMs ? 'skipped (idempotent)' : 'processed'}`);

    } catch (error) {
      this.error(`❌ Idempotency test failed: ${error}`);
      throw error;
    }
  }

  async showMetrics(): Promise<void> {
    this.info('📊 Collecting metrics...');

    try {
      const eventMetrics = this.metrics.getEventMetrics();
      const metricsHealth = this.metrics.healthCheck();

      console.log('\n' + colors.cyan + '📊 Event Metrics Summary:' + colors.reset);
      console.log(`   Published events: ${eventMetrics.published}`);
      console.log(`   Skipped events: ${eventMetrics.skipped}`);
      console.log(`   Error events: ${eventMetrics.errors}`);
      console.log(`   Avg processing time: ${Math.round(eventMetrics.processingTime.average)}ms`);

      if (Object.keys(eventMetrics.topicBreakdown).length > 0) {
        console.log('\n' + colors.cyan + '📋 Topic Breakdown:' + colors.reset);
        for (const [topic, stats] of Object.entries(eventMetrics.topicBreakdown)) {
          console.log(`   ${topic}: ${stats.published} events (${Math.round(stats.avgProcessingTime)}ms avg)`);
        }
      }

      this.success('✅ Metrics collected successfully');

    } catch (error) {
      this.error(`❌ Failed to collect metrics: ${error}`);
    }
  }

  async run(): Promise<void> {
    console.log(colors.bright + colors.blue + '🚀 OPAL Kafka Producer Test Suite' + colors.reset);
    console.log('=====================================\n');

    try {
      // Initialize producer
      this.info('🔌 Connecting to Kafka...');
      await this.producer.connect();
      this.success('✅ Connected to Kafka');

      // Run tests
      await this.runHealthChecks();
      await this.testWorkflowStarted();
      await this.testAgentCompleted();
      await this.testDecisionGenerated();
      await this.testIdempotency();
      await this.showMetrics();

      console.log('\n' + colors.bright + colors.green + '🎉 All tests passed successfully!' + colors.reset);
      console.log('✅ OPAL Event-Driven Architecture is working correctly\n');

    } catch (error) {
      console.log('\n' + colors.bright + colors.red + '❌ Tests failed!' + colors.reset);
      console.error(`Error: ${error}\n`);
      process.exit(1);

    } finally {
      // Cleanup
      try {
        await this.producer.disconnect();
        this.info('🔌 Disconnected from Kafka');
      } catch (error) {
        this.warning(`⚠️ Error during cleanup: ${error}`);
      }
    }
  }
}

// Run the test suite
if (require.main === module) {
  const tester = new KafkaProducerTester();
  tester.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
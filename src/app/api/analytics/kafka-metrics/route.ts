/**
 * Kafka Event Stream Metrics API
 * Real-time metrics for workflow events and agent activity
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthUtils } from '@/lib/auth/oauth-pkce';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface KafkaMetrics {
  topics: {
    name: string;
    partitions: number;
    messagesPerSecond: number;
    bytesPerSecond: number;
    consumerLag: number;
    lastActivity: string;
  }[];
  events: {
    timestamp: string;
    topic: string;
    eventType: string;
    partition: number;
    offset: number;
    payload: any;
  }[];
  throughput: {
    totalMessages: number;
    messagesPerMinute: number;
    peakThroughput: number;
    averageLatency: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Require admin access for analytics data
    const auth = await AdminAuthUtils.requireAnyAdmin(request);
    if (!auth.isAuthorized) {
      return NextResponse.json({
        error: auth.error || 'Unauthorized access to analytics data'
      }, { status: 401 });
    }

    // Mock Kafka metrics - replace with actual Kafka integration
    const metrics: KafkaMetrics = {
      topics: [
        {
          name: 'opal.workflow.events',
          partitions: 3,
          messagesPerSecond: 45.2,
          bytesPerSecond: 18750,
          consumerLag: 12,
          lastActivity: new Date(Date.now() - 3000).toISOString()
        },
        {
          name: 'opal.agent.completed',
          partitions: 2,
          messagesPerSecond: 32.8,
          bytesPerSecond: 14200,
          consumerLag: 5,
          lastActivity: new Date(Date.now() - 1500).toISOString()
        },
        {
          name: 'opal.recommendations',
          partitions: 4,
          messagesPerSecond: 28.3,
          bytesPerSecond: 22100,
          consumerLag: 8,
          lastActivity: new Date(Date.now() - 2000).toISOString()
        },
        {
          name: 'opal.system.alerts',
          partitions: 1,
          messagesPerSecond: 2.1,
          bytesPerSecond: 1250,
          consumerLag: 0,
          lastActivity: new Date(Date.now() - 10000).toISOString()
        }
      ],
      events: generateRecentEvents(),
      throughput: {
        totalMessages: 127394,
        messagesPerMinute: 6480,
        peakThroughput: 8945,
        averageLatency: 23.4
      }
    };

    return NextResponse.json({
      success: true,
      data: metrics,
      meta: {
        timestamp: new Date().toISOString(),
        refreshInterval: 5000 // 5 seconds
      }
    });

  } catch (error) {
    console.error('[Kafka Metrics] Error fetching metrics:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Kafka metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateRecentEvents() {
  const eventTypes = [
    'workflow.started',
    'workflow.completed',
    'agent.executed',
    'agent.completed',
    'recommendation.generated',
    'optimization.triggered',
    'error.occurred'
  ];

  const agents = [
    'content_review',
    'audience_suggester',
    'experiment_blueprinter',
    'integration_health',
    'performance_analyzer'
  ];

  const events = [];
  const now = Date.now();

  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(now - (i * 2000) - (Math.random() * 10000)).toISOString();
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    let payload = {};

    if (eventType.includes('agent')) {
      payload = {
        agent: agents[Math.floor(Math.random() * agents.length)],
        executionTime: Math.floor(Math.random() * 5000) + 100,
        success: Math.random() > 0.1,
        mappingType: ['strategy-plans', 'dxp-tools', 'analytics-insights', 'experience-optimization'][Math.floor(Math.random() * 4)]
      };
    } else if (eventType.includes('workflow')) {
      payload = {
        workflowId: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: ['optimization', 'analysis', 'recommendation'][Math.floor(Math.random() * 3)],
        duration: Math.floor(Math.random() * 30000) + 1000
      };
    } else if (eventType.includes('recommendation')) {
      payload = {
        type: 'content_optimization',
        confidence: Math.random() * 0.3 + 0.7,
        impact: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
        domain: ['content', 'ux', 'personalization'][Math.floor(Math.random() * 3)]
      };
    }

    events.push({
      timestamp,
      topic: `opal.${eventType.split('.')[0]}.events`,
      eventType,
      partition: Math.floor(Math.random() * 4),
      offset: Math.floor(Math.random() * 100000) + 50000,
      payload
    });
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
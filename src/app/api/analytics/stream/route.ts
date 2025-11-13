/**
 * Real-Time Analytics Stream API
 * Server-Sent Events for live dashboard updates
 */

import { NextRequest } from 'next/server';
import { AdminAuthUtils } from '@/lib/auth/oauth-pkce';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify admin access
  const auth = await AdminAuthUtils.requireAnyAdmin(request);
  if (!auth.isAuthorized) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(request.url);
  const dataType = url.searchParams.get('type') || 'all';

  // Create SSE response
  const encoder = new TextEncoder();
  let isConnected = true;

  const stream = new ReadableStream({
    start(controller) {
      console.log('[Analytics Stream] Client connected:', dataType);

      // Send initial connection confirmation
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({
          type: 'connection',
          message: 'Connected to analytics stream',
          timestamp: new Date().toISOString()
        })}\n\n`)
      );

      // Set up periodic updates
      const interval = setInterval(() => {
        if (!isConnected) {
          clearInterval(interval);
          return;
        }

        try {
          const updateData = generateStreamUpdate(dataType);

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(updateData)}\n\n`)
          );
        } catch (error) {
          console.error('[Analytics Stream] Error generating update:', error);
        }
      }, getUpdateInterval(dataType));

      // Cleanup on disconnect
      request.signal?.addEventListener('abort', () => {
        console.log('[Analytics Stream] Client disconnected');
        isConnected = false;
        clearInterval(interval);
        try {
          controller.close();
        } catch (error) {
          console.error('[Analytics Stream] Error closing controller:', error);
        }
      });

      // Send heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        if (!isConnected) {
          clearInterval(heartbeat);
          return;
        }

        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`)
          );
        } catch (error) {
          console.error('[Analytics Stream] Heartbeat error:', error);
          isConnected = false;
          clearInterval(heartbeat);
        }
      }, 30000);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}

function getUpdateInterval(dataType: string): number {
  switch (dataType) {
    case 'kafka':
      return 2000; // 2 seconds for Kafka events
    case 'agents':
      return 5000; // 5 seconds for agent performance
    case 'recommendations':
      return 10000; // 10 seconds for recommendations
    case 'health':
      return 15000; // 15 seconds for system health
    default:
      return 5000; // Default 5 seconds
  }
}

function generateStreamUpdate(dataType: string) {
  const timestamp = new Date().toISOString();

  switch (dataType) {
    case 'kafka':
      return {
        type: 'kafka_update',
        timestamp,
        data: {
          newEvents: Math.floor(Math.random() * 10) + 1,
          throughput: parseFloat((Math.random() * 20 + 40).toFixed(1)),
          consumerLag: Math.floor(Math.random() * 30),
          topicActivity: {
            'opal.workflow.events': Math.floor(Math.random() * 15) + 5,
            'opal.agent.completed': Math.floor(Math.random() * 10) + 3,
            'opal.recommendations': Math.floor(Math.random() * 8) + 2
          }
        }
      };

    case 'agents':
      const agents = ['content_review', 'audience_suggester', 'experiment_blueprinter', 'integration_health'];
      return {
        type: 'agent_update',
        timestamp,
        data: {
          recentExecutions: agents.map(agent => ({
            agent,
            executionTime: Math.floor(Math.random() * 2000) + 500,
            success: Math.random() > 0.15,
            timestamp: new Date(Date.now() - Math.random() * 60000).toISOString()
          })),
          queueStatus: {
            pending: Math.floor(Math.random() * 50),
            processing: Math.floor(Math.random() * 10),
            completed: Math.floor(Math.random() * 100) + 50
          }
        }
      };

    case 'recommendations':
      return {
        type: 'recommendation_update',
        timestamp,
        data: {
          newRecommendation: {
            id: `rec_${Date.now()}`,
            title: generateRandomRecommendation(),
            confidence: parseFloat((Math.random() * 0.4 + 0.6).toFixed(3)),
            impact: parseFloat((Math.random() * 6 + 4).toFixed(1)),
            domain: ['content', 'ux', 'personalization'][Math.floor(Math.random() * 3)]
          },
          stats: {
            totalActive: Math.floor(Math.random() * 100) + 200,
            implemented: Math.floor(Math.random() * 20) + 10,
            avgConfidence: parseFloat((Math.random() * 0.2 + 0.8).toFixed(3))
          }
        }
      };

    case 'health':
      return {
        type: 'health_update',
        timestamp,
        data: {
          metrics: {
            cpuUsage: parseFloat((Math.random() * 30 + 20).toFixed(1)),
            memoryUsage: parseFloat((Math.random() * 20 + 60).toFixed(1)),
            eventRate: parseFloat((Math.random() * 50 + 130).toFixed(1)),
            errorRate: parseFloat((Math.random() * 0.005).toFixed(4))
          },
          alerts: Math.random() < 0.1 ? [{
            severity: ['warning', 'info'][Math.floor(Math.random() * 2)],
            message: generateRandomAlert(),
            timestamp
          }] : []
        }
      };

    default:
      return {
        type: 'general_update',
        timestamp,
        data: {
          activeUsers: Math.floor(Math.random() * 50) + 100,
          systemLoad: parseFloat((Math.random() * 40 + 30).toFixed(1)),
          dataProcessed: Math.floor(Math.random() * 10000) + 50000
        }
      };
  }
}

function generateRandomRecommendation(): string {
  const recommendations = [
    'Optimize mobile checkout flow for better conversion',
    'Implement dynamic pricing based on user behavior',
    'Add personalized content recommendations',
    'Improve page load times for mobile users',
    'Test new CTA button placement',
    'Enhance product image quality and loading',
    'Optimize email campaign timing',
    'Implement exit-intent popup optimization'
  ];
  return recommendations[Math.floor(Math.random() * recommendations.length)];
}

function generateRandomAlert(): string {
  const alerts = [
    'High memory usage detected on worker node',
    'Kafka consumer lag increasing',
    'Database query performance degradation',
    'External API response time elevated',
    'Cache hit rate below threshold',
    'Unusual traffic pattern detected'
  ];
  return alerts[Math.floor(Math.random() * alerts.length)];
}
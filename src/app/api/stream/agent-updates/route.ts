/**
 * Server-Sent Events (SSE) Streaming Endpoint - Phase 3 Implementation
 *
 * Provides real-time updates for OPAL agent progress and incremental outputs.
 * Uses the exact SSE event format specified in Phase 3 requirements.
 */

import { NextRequest } from 'next/server';
import { FileBasedStorage } from '@/lib/storage/file-based-storage';

export const runtime = 'nodejs';

// SSE Event format as specified in Phase 3
interface SSEAgentUpdate {
  workflow_id: string;
  agent_id: string;
  progress: number;
  status: 'running' | 'completed' | 'failed';
  partial_recommendation?: string;
}

/**
 * GET /api/stream/agent-updates - Server-Sent Events for real-time agent updates
 *
 * Streams incremental updates from all 9 OPAL agents with progress and preliminary findings.
 * Updates are triggered by webhook events and time intervals (every 5 seconds).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const workflowId = url.searchParams.get('workflow_id') || 'demo-workflow';

  console.log('📺 [SSE] Client connected for agent updates', {
    workflow_id: workflowId,
    user_agent: request.headers.get('user-agent'),
    client_ip: request.ip || 'unknown'
  });

  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection confirmation
      const connectionEvent = formatSSEEvent('connection', {
        message: 'Connected to OPAL agent updates stream',
        workflow_id: workflowId,
        timestamp: new Date().toISOString()
      });
      controller.enqueue(connectionEvent);

      // Store client info for cleanup
      let intervalId: NodeJS.Timeout;
      let isActive = true;

      // Simulate agent updates every 5 seconds
      const sendAgentUpdates = async () => {
        if (!isActive) return;

        try {
          // Get all 9 OPAL agent types for simulation
          const agentTypes = [
            'experiment_blueprinter',
            'audience_suggester',
            'content_review',
            'roadmap_generator',
            'integration_health',
            'personalization_idea_generator',
            'cmp_organizer',
            'customer_journey',
            'geo_audit'
          ];

          // Generate updates for random subset of agents
          const activeAgents = agentTypes.slice(0, 2 + Math.floor(Math.random() * 4)); // 2-5 agents active

          for (const agentId of activeAgents) {
            const update = generateAgentUpdate(workflowId, agentId);

            // Store streaming event in file system
            await FileBasedStorage.storeStreamingEvent({
              id: `stream-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              workflow_id: workflowId,
              agent_id: agentId,
              event_type: 'agent_update',
              data: {
                progress_percentage: update.progress,
                status: update.status,
                preliminary_findings: update.partial_recommendation
              },
              timestamp: new Date().toISOString()
            });

            // Send SSE event in exact format specified
            const sseEvent = formatSSEEvent('agent_update', update);
            controller.enqueue(sseEvent);

            console.log('📡 [SSE] Agent update sent', {
              workflow_id: workflowId,
              agent_id: agentId,
              progress: update.progress,
              status: update.status
            });
          }

        } catch (error) {
          console.error('❌ [SSE] Error generating agent updates:', error);

          const errorEvent = formatSSEEvent('error', {
            message: 'Failed to generate agent updates',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          });
          controller.enqueue(errorEvent);
        }
      };

      // Send initial updates immediately
      sendAgentUpdates();

      // Set up 5-second interval for continuous updates
      intervalId = setInterval(sendAgentUpdates, 5000);

      // Cleanup function
      const cleanup = () => {
        isActive = false;
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }

        // Only close controller if it's not already aborted/closed
        if (!controller.signal.aborted) {
          try {
            controller.close();
            console.log('📺 [SSE] Controller closed gracefully', { workflow_id: workflowId });
          } catch (err) {
            console.warn('📺 [SSE] Controller already closed:', err);
          }
        }

        console.log('📺 [SSE] Client disconnected', { workflow_id: workflowId });
      };

      // Handle client disconnect
      request.signal.addEventListener('abort', cleanup);

      // Cleanup after 10 minutes to prevent resource leaks
      setTimeout(() => {
        cleanup();
      }, 10 * 60 * 1000);
    }
  });

  // Return SSE response with proper headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * Generate realistic agent update data
 */
function generateAgentUpdate(workflowId: string, agentId: string): SSEAgentUpdate {
  const agentRecommendations = {
    experiment_blueprinter: [
      'A/B test hero banner placement for 15% conversion lift',
      'Multivariate test checkout flow optimization',
      'Test personalized product recommendations'
    ],
    audience_suggester: [
      'Target high-value customers aged 25-45 in urban areas',
      'Create lookalike audience based on recent purchasers',
      'Segment mobile users for app-specific campaigns'
    ],
    content_review: [
      'Improve CTA button copy for better engagement',
      'Optimize page load speeds for mobile users',
      'Update product descriptions with emotional triggers'
    ],
    roadmap_generator: [
      'Prioritize mobile optimization in Q1 2025',
      'Implement AI chatbot for customer support',
      'Launch loyalty program by March 2025'
    ],
    integration_health: [
      'API response times within optimal range',
      'Database connections stable at 95% uptime',
      'Third-party integrations performing well'
    ],
    personalization_idea_generator: [
      'Dynamic content based on browsing history',
      'Geo-targeted promotions for local events',
      'Behavioral triggers for abandoned cart recovery'
    ],
    cmp_organizer: [
      'Email campaign performance up 23% this month',
      'Social media engagement increased 18%',
      'PPC campaigns showing positive ROI trends'
    ],
    customer_journey: [
      'Identified friction at checkout step 2',
      'Mobile users drop off at product comparison',
      'Email nurture sequence needs optimization'
    ],
    geo_audit: [
      'West Coast markets showing 34% growth',
      'European expansion opportunity identified',
      'Regional pricing optimization recommended'
    ]
  };

  // Simulate different progress states
  const progressOptions = [25, 45, 60, 75, 85, 90, 95];
  const progress = progressOptions[Math.floor(Math.random() * progressOptions.length)];

  // Determine status based on progress
  let status: 'running' | 'completed' | 'failed';
  if (progress >= 95) {
    status = Math.random() > 0.1 ? 'completed' : 'failed'; // 10% chance of failure
  } else {
    status = 'running';
  }

  // Get random recommendation for this agent
  const recommendations = agentRecommendations[agentId as keyof typeof agentRecommendations] || ['Processing data...'];
  const partial_recommendation = recommendations[Math.floor(Math.random() * recommendations.length)];

  return {
    workflow_id: workflowId,
    agent_id: agentId,
    progress,
    status,
    partial_recommendation
  };
}

/**
 * Format data as SSE event in exact format specified in Phase 3
 */
function formatSSEEvent(eventType: string, data: any): Uint8Array {
  const eventData = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  return new TextEncoder().encode(eventData);
}

/**
 * OPTIONS handler for CORS support
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
// Phase 3: Real-Time Webhook Event Streaming (SSE) API
// Provides Server-Sent Events for real-time monitoring and updates

import { NextRequest } from 'next/server';
import { webhookEventStreaming } from '@/lib/webhooks/webhook-event-streaming';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Extract client information
  const clientId = searchParams.get('clientId') || `client_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const channels = searchParams.get('channels')?.split(',') || ['default'];
  const eventTypes = searchParams.get('eventTypes')?.split(',') || [];
  const pageId = searchParams.get('pageId') || undefined;
  const widgetId = searchParams.get('widgetId') || undefined;
  const minPriority = searchParams.get('minPriority') ? parseInt(searchParams.get('minPriority')!) : undefined;

  const clientInfo = {
    ip: request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        request.headers.get('cf-connecting-ip') ||
        'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown'
  };

  console.log(`📡 [Phase3 SSE] Client connecting: ${clientId} from ${clientInfo.ip}, channels: ${channels.join(',')}`);

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Subscribe to the event stream
      webhookEventStreaming.subscribeToStream(
        clientId,
        clientInfo,
        {
          channels,
          eventTypes,
          filters: {
            page_id: pageId,
            widget_id: widgetId,
            min_priority: minPriority
          }
        }
      ).then(subscription => {
        console.log(`📡 [Phase3 SSE] Subscription created: ${subscription.subscription_id}`);

        // Send initial connection message
        const connectionMessage = {
          type: 'connection_established',
          subscription_id: subscription.subscription_id,
          client_id: clientId,
          channels: subscription.channels,
          filters: subscription.filters,
          timestamp: new Date().toISOString()
        };

        controller.enqueue(`data: ${JSON.stringify(connectionMessage)}\n\n`);

        // Send periodic heartbeat
        const heartbeatInterval = setInterval(() => {
          try {
            const heartbeat = {
              type: 'heartbeat',
              timestamp: new Date().toISOString(),
              subscription_id: subscription.subscription_id
            };

            controller.enqueue(`data: ${JSON.stringify(heartbeat)}\n\n`);
          } catch (error) {
            console.error(`❌ [Phase3 SSE] Heartbeat error for ${clientId}:`, error);
            clearInterval(heartbeatInterval);
          }
        }, 30000); // Every 30 seconds

        // Handle connection close
        const cleanup = () => {
          console.log(`📡 [Phase3 SSE] Client disconnected: ${clientId}`);
          clearInterval(heartbeatInterval);
          webhookEventStreaming.unsubscribeFromStream(subscription.subscription_id);
        };

        // Set up cleanup on stream close
        controller.enqueue = new Proxy(controller.enqueue, {
          apply(target, thisArg, args) {
            try {
              return target.apply(thisArg, args);
            } catch (error) {
              cleanup();
              throw error;
            }
          }
        });

        // Store cleanup function for later use
        (controller as any).cleanup = cleanup;
      }).catch(error => {
        console.error(`❌ [Phase3 SSE] Subscription failed for ${clientId}:`, error);

        const errorMessage = {
          type: 'error',
          error: error instanceof Error ? error.message : 'Subscription failed',
          timestamp: new Date().toISOString()
        };

        controller.enqueue(`data: ${JSON.stringify(errorMessage)}\n\n`);
        controller.close();
      });
    },

    cancel() {
      console.log(`📡 [Phase3 SSE] Stream cancelled for ${clientId}`);
      // Cleanup will be handled by the connection close logic
    }
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, event_type, correlation_id, event_data, options } = body;

    switch (action) {
      case 'broadcast_custom_event':
        if (!event_type || !correlation_id) {
          return Response.json({
            success: false,
            error: 'event_type and correlation_id are required for custom events'
          }, { status: 400 });
        }

        // Create custom stream event
        const streamId = await webhookEventStreaming.createStreamEvent(
          event_type as any,
          correlation_id,
          event_data || {},
          {
            pageId: options?.pageId,
            widgetId: options?.widgetId,
            priority: options?.priority || 5,
            channels: options?.channels || ['custom'],
            ttl: options?.ttl || 300
          }
        );

        return Response.json({
          success: true,
          stream_id: streamId,
          message: 'Custom event broadcasted successfully'
        });

      case 'get_active_connections':
        const stats = webhookEventStreaming.getStreamingStatistics();

        return Response.json({
          success: true,
          active_connections: stats.active_connections,
          connections_by_channel: stats.connections_by_channel,
          streaming_statistics: stats
        });

      case 'send_test_event':
        // Send test event for monitoring
        const testStreamId = await webhookEventStreaming.createStreamEvent(
          'webhook_received',
          `test_${Date.now()}`,
          {
            test: true,
            message: 'This is a test event from the Phase 3 streaming API',
            timestamp: new Date().toISOString()
          },
          {
            channels: options?.channels || ['test'],
            priority: 3,
            ttl: 60
          }
        );

        return Response.json({
          success: true,
          test_event_id: testStreamId,
          message: 'Test event sent successfully'
        });

      default:
        return Response.json({
          success: false,
          error: `Unknown action: ${action}`,
          available_actions: ['broadcast_custom_event', 'get_active_connections', 'send_test_event']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Phase3 SSE] POST error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown streaming API error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'clear_events':
        // Clear all events from the stream
        await webhookEventStreaming.clearAllEvents();

        return Response.json({
          success: true,
          message: 'All events cleared from the stream'
        });

      case 'disconnect_client':
        const clientId = searchParams.get('clientId');
        if (!clientId) {
          return Response.json({
            success: false,
            error: 'clientId is required for client disconnection'
          }, { status: 400 });
        }

        // Note: In a full implementation, you'd need to track subscription IDs by client ID
        return Response.json({
          success: true,
          message: `Client ${clientId} disconnection requested`
        });

      default:
        return Response.json({
          success: false,
          error: `Unknown action: ${action}`,
          available_actions: ['clear_events', 'disconnect_client']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Phase3 SSE] DELETE error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown streaming API error'
    }, { status: 500 });
  }
}
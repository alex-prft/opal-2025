import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// GA4 Webhook Configuration
const GA4_WEBHOOK_SECRET = process.env.GA4_WEBHOOK_SECRET || 'ga4-webhook-secret-key';

interface GA4WebhookPayload {
  event_type: 'analytics_updated' | 'real_time_event' | 'audience_trigger';
  timestamp: string;
  property_id: string;
  data: {
    metrics?: {
      sessions: number;
      page_views: number;
      conversions: number;
      engagement_rate: number;
      bounce_rate: number;
    };
    dimensions?: {
      source: string;
      medium: string;
      campaign: string;
      content_group: string;
    };
    real_time?: {
      active_users: number;
      event_count_last_30_minutes: number;
      top_events: Array<{
        event_name: string;
        event_count: number;
      }>;
    };
    audience_trigger?: {
      audience_name: string;
      trigger_type: 'user_added' | 'user_removed' | 'threshold_reached';
      user_count: number;
      conditions_met: string[];
    };
  };
}

// Verify webhook signature for security
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', GA4_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  const providedSignature = signature.replace('sha256=', '');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(providedSignature, 'hex')
  );
}

// Store webhook data (in production, this would go to a database)
const webhookDataStore = new Map<string, GA4WebhookPayload[]>();

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-ga4-signature');
    const payload = await request.text();

    // Verify webhook signature
    if (!signature || !verifyWebhookSignature(payload, signature)) {
      console.error('GA4 Webhook: Invalid signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const webhookData: GA4WebhookPayload = JSON.parse(payload);

    console.log('GA4 Webhook received:', {
      event_type: webhookData.event_type,
      property_id: webhookData.property_id,
      timestamp: webhookData.timestamp
    });

    // Validate required fields
    if (!webhookData.event_type || !webhookData.property_id || !webhookData.timestamp) {
      return NextResponse.json(
        { error: 'Missing required webhook fields' },
        { status: 400 }
      );
    }

    // Store webhook data by property ID
    const propertyId = webhookData.property_id;
    if (!webhookDataStore.has(propertyId)) {
      webhookDataStore.set(propertyId, []);
    }

    const propertyData = webhookDataStore.get(propertyId)!;
    propertyData.push(webhookData);

    // Keep only last 100 webhook events per property
    if (propertyData.length > 100) {
      propertyData.splice(0, propertyData.length - 100);
    }

    // Process webhook data based on event type
    await processGA4WebhookData(webhookData);

    return NextResponse.json({
      status: 'success',
      message: 'GA4 webhook processed successfully',
      event_type: webhookData.event_type,
      timestamp: webhookData.timestamp
    });

  } catch (error) {
    console.error('GA4 Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process GA4 webhook' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');

    if (propertyId) {
      const propertyData = webhookDataStore.get(propertyId) || [];
      return NextResponse.json({
        property_id: propertyId,
        webhook_count: propertyData.length,
        recent_webhooks: propertyData.slice(-10), // Last 10 events
      });
    }

    // Return overview of all properties
    const overview = Array.from(webhookDataStore.entries()).map(([propId, data]) => ({
      property_id: propId,
      webhook_count: data.length,
      last_updated: data.length > 0 ? data[data.length - 1].timestamp : null,
    }));

    return NextResponse.json({
      total_properties: overview.length,
      properties: overview,
    });

  } catch (error) {
    console.error('GA4 Webhook GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve GA4 webhook data' },
      { status: 500 }
    );
  }
}

async function processGA4WebhookData(webhookData: GA4WebhookPayload) {
  try {
    switch (webhookData.event_type) {
      case 'analytics_updated':
        // Process updated analytics metrics
        if (webhookData.data.metrics) {
          console.log('Processing GA4 analytics update:', webhookData.data.metrics);
          // Here you would update your analytics dashboard in real-time
          // Example: broadcast to WebSocket connections, update cache, etc.
        }
        break;

      case 'real_time_event':
        // Process real-time event data
        if (webhookData.data.real_time) {
          console.log('Processing GA4 real-time data:', webhookData.data.real_time);
          // Here you would update real-time dashboards
        }
        break;

      case 'audience_trigger':
        // Process audience trigger events
        if (webhookData.data.audience_trigger) {
          console.log('Processing GA4 audience trigger:', webhookData.data.audience_trigger);
          // Here you would trigger personalization campaigns, notifications, etc.
        }
        break;

      default:
        console.log('Unknown GA4 webhook event type:', webhookData.event_type);
    }

    // Broadcast to connected WebSocket clients (if implemented)
    // await broadcastToWebSocketClients('ga4_update', webhookData);

  } catch (error) {
    console.error('Error processing GA4 webhook data:', error);
  }
}

// Export the data store for use in other parts of the application
export { webhookDataStore as ga4WebhookDataStore };
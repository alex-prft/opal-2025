import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Salesforce Webhook Configuration
const SALESFORCE_WEBHOOK_SECRET = process.env.SALESFORCE_WEBHOOK_SECRET || 'salesforce-webhook-secret-key';

interface SalesforceWebhookPayload {
  event_type: 'member_updated' | 'member_created' | 'member_deleted' | 'engagement_changed' | 'tier_changed';
  timestamp: string;
  organization_id: string;
  sobject_type: 'Contact' | 'Account' | 'Lead' | 'Custom_Member__c';
  record_id: string;
  data: {
    member?: {
      id: string;
      email: string;
      membership_tier: 'Basic' | 'Premium' | 'Enterprise' | 'VIP';
      engagement_score: number;
      lifecycle_stage: string;
      industry_segment: string;
      company_size: string;
      last_activity_date: string;
    };
    changes?: {
      field_name: string;
      old_value: any;
      new_value: any;
    }[];
    engagement?: {
      interaction_type: 'email_open' | 'email_click' | 'portal_login' | 'content_download' | 'event_registration';
      interaction_date: string;
      details: Record<string, any>;
    };
  };
}

// Verify Salesforce webhook signature
function verifySalesforceSignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', SALESFORCE_WEBHOOK_SECRET)
    .update(payload)
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

// Store webhook data (in production, this would go to a database)
const salesforceWebhookStore = new Map<string, SalesforceWebhookPayload[]>();

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-salesforce-signature');
    const payload = await request.text();

    // Verify webhook signature
    if (!signature || !verifySalesforceSignature(payload, signature)) {
      console.error('Salesforce Webhook: Invalid signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const webhookData: SalesforceWebhookPayload = JSON.parse(payload);

    console.log('Salesforce Webhook received:', {
      event_type: webhookData.event_type,
      sobject_type: webhookData.sobject_type,
      record_id: webhookData.record_id,
      timestamp: webhookData.timestamp
    });

    // Validate required fields
    if (!webhookData.event_type || !webhookData.organization_id || !webhookData.record_id) {
      return NextResponse.json(
        { error: 'Missing required webhook fields' },
        { status: 400 }
      );
    }

    // Store webhook data by organization ID
    const orgId = webhookData.organization_id;
    if (!salesforceWebhookStore.has(orgId)) {
      salesforceWebhookStore.set(orgId, []);
    }

    const orgData = salesforceWebhookStore.get(orgId)!;
    orgData.push(webhookData);

    // Keep only last 100 webhook events per organization
    if (orgData.length > 100) {
      orgData.splice(0, orgData.length - 100);
    }

    // Process webhook data based on event type
    await processSalesforceWebhookData(webhookData);

    return NextResponse.json({
      status: 'success',
      message: 'Salesforce webhook processed successfully',
      event_type: webhookData.event_type,
      record_id: webhookData.record_id,
      timestamp: webhookData.timestamp
    });

  } catch (error) {
    console.error('Salesforce Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process Salesforce webhook' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organization_id');
    const eventType = searchParams.get('event_type');

    if (orgId) {
      let orgData = salesforceWebhookStore.get(orgId) || [];

      // Filter by event type if specified
      if (eventType) {
        orgData = orgData.filter(webhook => webhook.event_type === eventType);
      }

      return NextResponse.json({
        organization_id: orgId,
        webhook_count: orgData.length,
        recent_webhooks: orgData.slice(-10), // Last 10 events
        event_type_filter: eventType || 'all'
      });
    }

    // Return overview of all organizations
    const overview = Array.from(salesforceWebhookStore.entries()).map(([orgId, data]) => {
      const eventTypeCounts = data.reduce((acc, webhook) => {
        acc[webhook.event_type] = (acc[webhook.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        organization_id: orgId,
        webhook_count: data.length,
        event_types: eventTypeCounts,
        last_updated: data.length > 0 ? data[data.length - 1].timestamp : null,
      };
    });

    return NextResponse.json({
      total_organizations: overview.length,
      organizations: overview,
    });

  } catch (error) {
    console.error('Salesforce Webhook GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve Salesforce webhook data' },
      { status: 500 }
    );
  }
}

async function processSalesforceWebhookData(webhookData: SalesforceWebhookPayload) {
  try {
    switch (webhookData.event_type) {
      case 'member_created':
        // Process new member registration
        if (webhookData.data.member) {
          console.log('Processing new Salesforce member:', webhookData.data.member.email);
          // Here you would trigger welcome campaigns, onboarding flows, etc.
        }
        break;

      case 'member_updated':
        // Process member profile updates
        if (webhookData.data.changes && webhookData.data.changes.length > 0) {
          console.log('Processing Salesforce member update:', webhookData.data.changes);
          // Here you would update personalization rules, trigger re-segmentation, etc.
        }
        break;

      case 'engagement_changed':
        // Process engagement score changes
        if (webhookData.data.engagement) {
          console.log('Processing Salesforce engagement change:', webhookData.data.engagement);
          // Here you would update engagement tracking, trigger personalization updates
        }
        break;

      case 'tier_changed':
        // Process membership tier changes
        if (webhookData.data.member) {
          console.log('Processing Salesforce tier change:', {
            member_id: webhookData.data.member.id,
            new_tier: webhookData.data.member.membership_tier
          });
          // Here you would update member benefits, access levels, personalization rules
        }
        break;

      case 'member_deleted':
        // Process member deletion/unsubscription
        console.log('Processing Salesforce member deletion:', webhookData.record_id);
        // Here you would clean up personalization data, remove from campaigns, etc.
        break;

      default:
        console.log('Unknown Salesforce webhook event type:', webhookData.event_type);
    }

    // Broadcast to connected WebSocket clients (if implemented)
    // await broadcastToWebSocketClients('salesforce_update', webhookData);

    // Update real-time analytics if this affects dashboard metrics
    await updateRealtimeAnalytics(webhookData);

  } catch (error) {
    console.error('Error processing Salesforce webhook data:', error);
  }
}

async function updateRealtimeAnalytics(webhookData: SalesforceWebhookPayload) {
  try {
    // Update analytics cache with new member data
    if (webhookData.event_type === 'member_created' && webhookData.data.member) {
      // Increment member count, update segmentation analytics, etc.
      console.log('Updating analytics for new member:', webhookData.data.member.id);
    }

    if (webhookData.event_type === 'engagement_changed' && webhookData.data.engagement) {
      // Update engagement metrics in real-time
      console.log('Updating engagement analytics:', webhookData.data.engagement.interaction_type);
    }

    // Here you would invalidate relevant cache entries and update analytics
    // This ensures the dashboard shows updated data immediately

  } catch (error) {
    console.error('Error updating real-time analytics:', error);
  }
}

// Export the data store for use in other parts of the application
export { salesforceWebhookStore };
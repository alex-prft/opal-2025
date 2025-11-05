import { NextRequest, NextResponse } from 'next/server';
import { ga4WebhookDataStore } from '../ga4/route';
import { salesforceWebhookStore } from '../salesforce/route';

interface WebhookStatus {
  endpoint: string;
  enabled: boolean;
  total_received: number;
  last_received?: string;
  error_rate: number;
  recent_errors: string[];
}

interface WebhookManagementResponse {
  status: 'success' | 'error';
  webhooks: {
    ga4: WebhookStatus;
    salesforce: WebhookStatus;
  };
  system_info: {
    uptime: string;
    memory_usage: string;
    webhook_processing_enabled: boolean;
    rate_limiting_enabled: boolean;
  };
}

// Simple error tracking
const webhookErrors = {
  ga4: [] as string[],
  salesforce: [] as string[]
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'status') {
      return getWebhookStatus();
    }

    if (action === 'test') {
      const provider = searchParams.get('provider') as 'ga4' | 'salesforce';
      return testWebhook(provider);
    }

    // Default: return full management dashboard data
    return getWebhookManagementData();

  } catch (error) {
    console.error('Webhook Management GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve webhook management data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, provider, config } = await request.json();

    switch (action) {
      case 'toggle':
        return toggleWebhook(provider, config?.enabled);

      case 'clear_errors':
        return clearWebhookErrors(provider);

      case 'regenerate_secret':
        return regenerateWebhookSecret(provider);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Webhook Management POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook management request' },
      { status: 500 }
    );
  }
}

async function getWebhookManagementData(): Promise<NextResponse> {
  const ga4Data = Array.from(ga4WebhookDataStore.values()).flat();
  const salesforceData = Array.from(salesforceWebhookStore.values()).flat();

  const response: WebhookManagementResponse = {
    status: 'success',
    webhooks: {
      ga4: {
        endpoint: '/api/webhooks/ga4',
        enabled: true,
        total_received: ga4Data.length,
        last_received: ga4Data.length > 0 ? ga4Data[ga4Data.length - 1].timestamp : undefined,
        error_rate: calculateErrorRate('ga4'),
        recent_errors: webhookErrors.ga4.slice(-5)
      },
      salesforce: {
        endpoint: '/api/webhooks/salesforce',
        enabled: true,
        total_received: salesforceData.length,
        last_received: salesforceData.length > 0 ? salesforceData[salesforceData.length - 1].timestamp : undefined,
        error_rate: calculateErrorRate('salesforce'),
        recent_errors: webhookErrors.salesforce.slice(-5)
      }
    },
    system_info: {
      uptime: process.uptime().toFixed(0) + ' seconds',
      memory_usage: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      webhook_processing_enabled: true,
      rate_limiting_enabled: Boolean(process.env.WEBHOOK_RATE_LIMIT_PER_MINUTE)
    }
  };

  return NextResponse.json(response);
}

async function getWebhookStatus(): Promise<NextResponse> {
  const ga4Count = Array.from(ga4WebhookDataStore.values()).flat().length;
  const salesforceCount = Array.from(salesforceWebhookStore.values()).flat().length;

  return NextResponse.json({
    status: 'operational',
    endpoints: {
      ga4: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/ga4`,
        status: 'active',
        total_received: ga4Count
      },
      salesforce: {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/salesforce`,
        status: 'active',
        total_received: salesforceCount
      }
    },
    last_check: new Date().toISOString()
  });
}

async function testWebhook(provider: 'ga4' | 'salesforce'): Promise<NextResponse> {
  try {
    const testPayloads = {
      ga4: {
        event_type: 'analytics_updated',
        timestamp: new Date().toISOString(),
        property_id: 'TEST_PROPERTY_ID',
        data: {
          metrics: {
            sessions: 150,
            page_views: 450,
            conversions: 12,
            engagement_rate: 65.3,
            bounce_rate: 34.7
          }
        }
      },
      salesforce: {
        event_type: 'member_updated',
        timestamp: new Date().toISOString(),
        organization_id: 'TEST_ORG_ID',
        sobject_type: 'Contact' as const,
        record_id: 'TEST_RECORD_ID',
        data: {
          member: {
            id: 'test_member_123',
            email: 'test@example.com',
            membership_tier: 'Premium' as const,
            engagement_score: 85,
            lifecycle_stage: 'Active',
            industry_segment: 'Fresh Produce',
            company_size: 'Small',
            last_activity_date: new Date().toISOString()
          }
        }
      }
    };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const webhookUrl = `${baseUrl}/api/webhooks/${provider}`;

    // Create test signature (in a real scenario, this would be generated by the external service)
    const testSignature = provider === 'ga4' ? 'sha256=test_signature' : 'test_signature';

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [`x-${provider}-signature`]: testSignature
      },
      body: JSON.stringify(testPayloads[provider])
    });

    if (response.ok) {
      const result = await response.json();
      return NextResponse.json({
        status: 'success',
        message: `${provider.toUpperCase()} webhook test successful`,
        test_result: result
      });
    } else {
      throw new Error(`Test failed with status ${response.status}`);
    }

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: `${provider.toUpperCase()} webhook test failed`,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function toggleWebhook(provider: string, enabled: boolean): Promise<NextResponse> {
  // In a production system, this would update database configuration
  // For now, we'll just simulate the toggle

  return NextResponse.json({
    status: 'success',
    message: `${provider.toUpperCase()} webhook ${enabled ? 'enabled' : 'disabled'}`,
    provider,
    enabled
  });
}

async function clearWebhookErrors(provider: 'ga4' | 'salesforce'): Promise<NextResponse> {
  webhookErrors[provider] = [];

  return NextResponse.json({
    status: 'success',
    message: `Cleared error log for ${provider.toUpperCase()} webhook`,
    provider
  });
}

async function regenerateWebhookSecret(provider: string): Promise<NextResponse> {
  // In production, this would generate a new secret and update configuration
  const newSecret = `${provider}-webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return NextResponse.json({
    status: 'success',
    message: `Generated new webhook secret for ${provider.toUpperCase()}`,
    provider,
    new_secret: newSecret,
    note: 'Update your webhook configuration with this new secret'
  });
}

function calculateErrorRate(provider: 'ga4' | 'salesforce'): number {
  const errors = webhookErrors[provider].length;
  let total = 0;

  if (provider === 'ga4') {
    total = Array.from(ga4WebhookDataStore.values()).flat().length;
  } else {
    total = Array.from(salesforceWebhookStore.values()).flat().length;
  }

  return total > 0 ? (errors / total) * 100 : 0;
}

// Helper function to add errors (used by webhook endpoints)
export function addWebhookError(provider: 'ga4' | 'salesforce', error: string) {
  webhookErrors[provider].push(`${new Date().toISOString()}: ${error}`);

  // Keep only last 20 errors
  if (webhookErrors[provider].length > 20) {
    webhookErrors[provider].shift();
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { handleForceSyncWebhook } from '@/lib/webhook/force-sync-validator';

/**
 * Webhook endpoint for Force Sync completion events
 * Automatically triggers OPAL integration validation
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔔 [Force Sync Webhook] Received completion event:', {
      workflowId: body.workflowId || body.workflow_id,
      status: body.status,
      timestamp: body.timestamp || new Date().toISOString()
    });

    // Optional: Verify webhook signature (if you have one)
    const signature = request.headers.get('x-signature');
    if (process.env.FORCE_SYNC_WEBHOOK_SECRET && signature) {
      // Add signature verification logic here if needed
      console.log('🔐 [Force Sync Webhook] Signature verification enabled');
    }

    // Handle the Force Sync completion and trigger validation
    const result = await handleForceSyncWebhook(body);

    if (!result.success) {
      console.error('❌ [Force Sync Webhook] Validation failed:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error,
          received: true // Acknowledge receipt even if validation failed
        },
        { status: 500 }
      );
    }

    console.log('✅ [Force Sync Webhook] Successfully processed completion event');

    return NextResponse.json({
      success: true,
      received: true,
      validationTriggered: result.validationTriggered,
      validationStatus: result.validationResult?.overallStatus,
      message: result.validationTriggered 
        ? `Validation triggered for workflow ${body.workflowId || body.workflow_id}`
        : `Force Sync event received but validation skipped (status: ${body.status})`
    });

  } catch (error: any) {
    console.error('❌ [Force Sync Webhook] Failed to process webhook:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        received: true,
        error: error.message || 'Webhook processing failed'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for webhook health check
 */
export async function GET() {
  return NextResponse.json({
    service: 'Force Sync Completion Webhook',
    status: 'healthy',
    endpoint: '/api/webhooks/force-sync-completed',
    methods: ['POST'],
    description: 'Receives Force Sync completion events and triggers OPAL integration validation',
    timestamp: new Date().toISOString()
  });
}
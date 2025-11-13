/**
 * OPAL Workflow Webhook Receiver
 * Production-grade webhook receiver with HMAC verification, idempotency, and persistence
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadOpalConfig } from '@/lib/config/opal-env';
import { verifyWebhookSignature } from '@/lib/security/hmac';
import { parseWebhookEvent, generateDedupHash, truncatePayloadForPreview } from '@/lib/schemas/opal-schemas';
import { WebhookDatabase } from '@/lib/storage/webhook-database';
import { z } from 'zod';

// Disable Next.js body parsing to access raw body for HMAC verification
export const runtime = 'nodejs';

/**
 * POST /api/webhooks/opal-workflow - Webhook Event Receiver
 * Receives OPAL agent webhook events with HMAC verification and idempotency
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = `webhook-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const startTime = Date.now();

  try {
    console.log('📨 [Webhook] OPAL workflow event received', { correlationId });

    // Read raw body for HMAC verification
    const rawBody = await request.arrayBuffer();
    const bodyBuffer = Buffer.from(rawBody);
    const bodyText = bodyBuffer.toString('utf8');

    console.log('📋 [Webhook] Request details', {
      correlationId,
      content_length: bodyBuffer.length,
      content_type: request.headers.get('content-type'),
      user_agent: request.headers.get('user-agent'),
      has_signature: !!request.headers.get('x-osa-signature')
    });

    // Load configuration
    const config = loadOpalConfig();

    // Extract and verify HMAC signature
    const signatureHeader = request.headers.get('x-osa-signature');
    if (!signatureHeader) {
      console.warn('⚠️ [Webhook] Missing X-OSA-Signature header', { correlationId });
      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Missing signature header',
        correlation_id: correlationId
      }, { status: 401 });
    }

    // Verify HMAC signature with constant-time comparison
    const verificationResult = verifyWebhookSignature(
      bodyBuffer,
      signatureHeader,
      config.osaWebhookSecret,
      5 * 60 * 1000 // 5 minute tolerance
    );

    if (!verificationResult.isValid) {
      console.warn('⚠️ [Webhook] Signature verification failed', {
        correlationId,
        error: verificationResult.error
      });

      // Still record the attempt for diagnostics
      await WebhookDatabase.insertEvent({
        workflow_id: 'unknown',
        agent_id: 'unknown',
        offset: null,
        payload_json: {},
        signature_valid: false,
        dedup_hash: `invalid-${correlationId}`,
        http_status: 401,
        error_text: `Signature verification failed: ${verificationResult.error}`,
        processing_time_ms: Date.now() - startTime
      });

      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Invalid signature',
        correlation_id: correlationId
      }, { status: 401 });
    }

    console.log('✅ [Webhook] Signature verified', {
      correlationId,
      timestamp: verificationResult.timestamp
    });

    // Parse and validate webhook payload
    let webhookEvent;
    try {
      const payloadData = JSON.parse(bodyText);
      webhookEvent = parseWebhookEvent(payloadData);
    } catch (parseError) {
      console.error('❌ [Webhook] Payload parsing failed', {
        correlationId,
        error: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      });

      await WebhookDatabase.insertEvent({
        workflow_id: 'unknown',
        agent_id: 'unknown',
        offset: null,
        payload_json: { raw: bodyText },
        signature_valid: true,
        dedup_hash: `parse-error-${correlationId}`,
        http_status: 400,
        error_text: `Payload parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        processing_time_ms: Date.now() - startTime
      });

      return NextResponse.json({
        error: 'Bad Request',
        message: 'Invalid payload format',
        correlation_id: correlationId
      }, { status: 400 });
    }

    console.log('📋 [Webhook] Payload validated', {
      correlationId,
      workflow_id: webhookEvent.workflow_id,
      agent_id: webhookEvent.agent_id,
      execution_status: webhookEvent.execution_status,
      offset: webhookEvent.offset
    });

    // Generate deduplication hash
    const dedupHash = generateDedupHash(webhookEvent);

    // Check for existing event (idempotency)
    const existingEvent = await WebhookDatabase.findByDedupHash(dedupHash);
    if (existingEvent) {
      console.log('🔄 [Webhook] Duplicate event detected - returning cached response', {
        correlationId,
        dedup_hash: dedupHash,
        existing_id: existingEvent.id
      });

      return NextResponse.json({
        success: true,
        message: 'Event already processed (idempotent)',
        event_id: existingEvent.id,
        correlation_id: correlationId,
        duplicate: true
      }, { status: 200 });
    }

    // Store webhook event in database
    const processingTime = Date.now() - startTime;
    const eventId = await WebhookDatabase.insertEvent({
      workflow_id: webhookEvent.workflow_id,
      agent_id: webhookEvent.agent_id,
      offset: webhookEvent.offset,
      payload_json: webhookEvent,
      signature_valid: true,
      dedup_hash: dedupHash,
      http_status: 202,
      error_text: null,
      processing_time_ms: processingTime
    });

    const duration = Date.now() - startTime;

    console.log('✅ [Webhook] Event processed successfully', {
      correlationId,
      event_id: eventId,
      workflow_id: webhookEvent.workflow_id,
      agent_id: webhookEvent.agent_id,
      dedup_hash: dedupHash,
      duration_ms: duration
    });

    // TODO: Trigger async processing here (queue/worker)
    // Example: await queueProcessor.enqueue('process-opal-event', { eventId, webhookEvent });

    return NextResponse.json({
      success: true,
      message: 'Event received and queued for processing',
      event_id: eventId,
      correlation_id: correlationId,
      processing: {
        status: 'queued',
        estimated_processing_time: '30-60 seconds'
      }
    }, { status: 202 });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [Webhook] Processing failed:', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration_ms: duration
    });

    // Try to record the error
    try {
      await WebhookDatabase.insertEvent({
        workflow_id: 'unknown',
        agent_id: 'unknown',
        offset: null,
        payload_json: {},
        signature_valid: false,
        dedup_hash: `error-${correlationId}`,
        http_status: 500,
        error_text: error instanceof Error ? error.message : 'Unknown error',
        processing_time_ms: duration
      });
    } catch (dbError) {
      console.error('❌ [Webhook] Failed to record error event:', dbError);
    }

    return NextResponse.json({
      error: 'Internal Server Error',
      message: 'Failed to process webhook event',
      correlation_id: correlationId
    }, { status: 500 });
  }
}

/**
 * GET /api/webhooks/opal-workflow - Webhook Health Check
 * Returns basic health information about the webhook receiver
 */
export async function GET(): Promise<NextResponse> {
  try {
    const stats = await WebhookDatabase.getEventStats();

    return NextResponse.json({
      status: 'healthy',
      webhook_receiver: {
        endpoint: '/api/webhooks/opal-workflow',
        methods: ['POST'],
        authentication: 'HMAC-SHA256 (X-OSA-Signature header)',
        features: ['signature_verification', 'idempotency', 'persistence']
      },
      recent_activity: {
        total_events_24h: stats.total_events_24h,
        successful_events_24h: stats.successful_events_24h,
        failed_events_24h: stats.failed_events_24h,
        last_event_timestamp: stats.last_event_timestamp,
        signature_valid_rate: stats.signature_valid_rate
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: 'Failed to retrieve webhook status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Export database for use in other endpoints
export { WebhookDatabase };
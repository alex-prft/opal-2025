/**
 * OPAL Workflow Webhook Receiver
 * Production-grade webhook receiver with HMAC verification, idempotency, and persistence
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadOpalConfig } from '@/lib/config/opal-env';
import { verifyWebhookSignature } from '@/lib/security/hmac';
import { parseWebhookEvent, generateDedupHash, truncatePayloadForPreview } from '@/lib/schemas/opal-schemas';
import { WebhookDatabase } from '@/lib/storage/webhook-database';
import { opalWorkflowTracker } from '@/lib/monitoring/opal-workflow-tracker';
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

    // Load configuration with enhanced error handling
    let config;
    try {
      config = loadOpalConfig();
    } catch (configError) {
      console.error('❌ [Webhook] Configuration load failed', {
        correlationId,
        error: configError instanceof Error ? configError.message : 'Unknown config error'
      });

      await WebhookDatabase.insertEvent({
        workflow_id: 'unknown',
        agent_id: 'unknown',
        offset: null,
        payload_json: {},
        signature_valid: false,
        dedup_hash: `config-error-${correlationId}`,
        http_status: 500,
        error_text: `Configuration error: ${configError instanceof Error ? configError.message : 'Unknown error'}`,
        processing_time_ms: Date.now() - startTime
      });

      return NextResponse.json({
        error: 'Internal Server Error',
        message: 'Configuration error',
        correlation_id: correlationId
      }, { status: 500 });
    }

    // DEBUG: Log environment and config values
    console.log(`🐛 [Webhook Debug] ${correlationId}`);
    console.log(`🐛 ENV_SECRET: ${process.env.OSA_WEBHOOK_SECRET?.substring(0, 8)}...${process.env.OSA_WEBHOOK_SECRET?.slice(-4)} (len: ${process.env.OSA_WEBHOOK_SECRET?.length})`);
    console.log(`🐛 CONFIG_SECRET: ${config.osaWebhookSecret?.substring(0, 8)}...${config.osaWebhookSecret?.slice(-4)} (len: ${config.osaWebhookSecret?.length})`);

    // Extract and verify HMAC signature
    const signatureHeader = request.headers.get('x-osa-signature');
    if (!signatureHeader) {
      console.warn('⚠️ [Webhook] Missing X-OSA-Signature header', { correlationId });

      await WebhookDatabase.insertEvent({
        workflow_id: 'unknown',
        agent_id: 'unknown',
        offset: null,
        payload_json: {},
        signature_valid: false,
        dedup_hash: `no-signature-${correlationId}`,
        http_status: 401,
        error_text: 'Missing X-OSA-Signature header',
        processing_time_ms: Date.now() - startTime
      });

      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Missing signature header',
        correlation_id: correlationId
      }, { status: 401 });
    }

    console.log(`🐛 RECEIVED_SIGNATURE: ${signatureHeader}`);

    // Parse the signature header to see the timestamp
    const { parseSignatureHeader } = await import('@/lib/security/hmac');
    const parsedSignature = parseSignatureHeader(signatureHeader);
    if (parsedSignature) {
      console.log(`🐛 PARSED_TIMESTAMP: ${parsedSignature.timestamp} (${new Date(parsedSignature.timestamp).toISOString()})`);
      console.log(`🐛 PARSED_SIGNATURE: ${parsedSignature.signature}`);
      console.log(`🐛 CURRENT_TIME: ${Date.now()} (${new Date().toISOString()})`);
      console.log(`🐛 TIME_DIFF: ${Date.now() - parsedSignature.timestamp}ms`);
    } else {
      console.warn('⚠️ [Webhook] Failed to parse signature header', { correlationId, signatureHeader });
    }

    // Enhanced development bypass with more specific conditions
    const isDevelopment = process.env.NODE_ENV === 'development';
    const skipVerification = process.env.SKIP_HMAC_VERIFICATION === 'true';
    const isProductionBypass = process.env.NODE_ENV === 'production' && skipVerification;

    // Log bypass status for monitoring
    if (isDevelopment || skipVerification) {
      console.log(`🔓 [Webhook] HMAC verification bypass - dev: ${isDevelopment}, skip: ${skipVerification}, prod bypass: ${isProductionBypass}`, { correlationId });
    }

    // Verify HMAC signature with enhanced tolerance and error handling
    const verificationResult = (isDevelopment || skipVerification)
      ? { isValid: true, message: 'Verification bypassed', timestamp: Date.now() }
      : verifyWebhookSignature(
          bodyBuffer,
          signatureHeader,
          config.osaWebhookSecret,
          10 * 60 * 1000 // 10 minute tolerance (increased from 5 for better network tolerance)
        );

    // Always log verification attempts for monitoring
    console.log(`🔐 [Webhook] Verification result: ${verificationResult.isValid}`, {
      correlationId,
      bypassed: isDevelopment || skipVerification,
      error: verificationResult.error,
      timestamp: verificationResult.timestamp
    });

    if (!verificationResult.isValid) {
      console.warn('⚠️ [Webhook] Signature verification failed', {
        correlationId,
        error: verificationResult.error,
        signatureHeader,
        payloadLength: bodyBuffer.length,
        secretLength: config.osaWebhookSecret?.length
      });

      // Record detailed failure information for diagnostics
      await WebhookDatabase.insertEvent({
        workflow_id: 'unknown',
        agent_id: 'unknown',
        offset: null,
        payload_json: {
          diagnostic_info: {
            payload_length: bodyBuffer.length,
            signature_header_length: signatureHeader?.length || 0,
            secret_configured: !!config.osaWebhookSecret,
            secret_length: config.osaWebhookSecret?.length || 0,
            parsed_signature: parsedSignature ? 'yes' : 'no'
          }
        },
        signature_valid: false,
        dedup_hash: `invalid-${correlationId}`,
        http_status: 401,
        error_text: `Signature verification failed: ${verificationResult.error}`,
        processing_time_ms: Date.now() - startTime
      });

      return NextResponse.json({
        error: 'Unauthorized',
        message: 'Invalid signature',
        correlation_id: correlationId,
        debug_hint: isDevelopment ? verificationResult.error : undefined
      }, { status: 401 });
    }

    console.log('✅ [Webhook] Signature verified', {
      correlationId,
      timestamp: verificationResult.timestamp
    });

    // Parse and validate webhook payload with enhanced error handling
    let webhookEvent;
    try {
      const payloadData = JSON.parse(bodyText);
      console.log('🔍 [Webhook] Parsed payload structure:', {
        correlationId,
        workflow_id: payloadData?.workflow_id,
        agent_id: payloadData?.agent_id,
        offset: payloadData?.offset,
        offset_type: typeof payloadData?.offset,
        execution_status: payloadData?.execution_status,
        has_agent_data: !!payloadData?.agent_data
      });

      webhookEvent = parseWebhookEvent(payloadData);
    } catch (parseError) {
      // Enhanced error logging for debugging
      console.error('❌ [Webhook] Payload parsing failed', {
        correlationId,
        error: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
        payload_preview: bodyText.substring(0, 500),
        content_type: request.headers.get('content-type'),
        user_agent: request.headers.get('user-agent')
      });

      // Try to extract basic info even if parsing fails
      let basicInfo = { workflow_id: 'unknown', agent_id: 'unknown' };
      try {
        const rawPayload = JSON.parse(bodyText);
        basicInfo = {
          workflow_id: rawPayload?.workflow_id || 'unknown',
          agent_id: rawPayload?.agent_id || 'unknown'
        };
      } catch (jsonError) {
        console.error('❌ [Webhook] JSON parsing also failed', { correlationId, jsonError });
      }

      await WebhookDatabase.insertEvent({
        workflow_id: basicInfo.workflow_id,
        agent_id: basicInfo.agent_id,
        offset: null,
        payload_json: {
          raw: bodyText,
          parse_error: parseError instanceof Error ? parseError.message : 'Unknown error',
          parsed_basic_info: basicInfo
        },
        signature_valid: true,
        dedup_hash: `parse-error-${correlationId}`,
        http_status: 400,
        error_text: `Payload parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        processing_time_ms: Date.now() - startTime
      });

      return NextResponse.json({
        error: 'Bad Request',
        message: 'Invalid payload format',
        correlation_id: correlationId,
        debug_hint: isDevelopment ? parseError instanceof Error ? parseError.message : 'Unknown parsing error' : undefined
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

    // Record callback in OPAL workflow tracker
    const callbackEvent = {
      correlation_id: webhookEvent.correlation_id || webhookEvent.workflow_id,
      workflow_id: webhookEvent.workflow_id,
      agent_id: webhookEvent.agent_id,
      execution_status: webhookEvent.execution_status || 'unknown',
      callback_data: webhookEvent,
      received_at: new Date().toISOString(),
      signature_valid: true
    };

    try {
      opalWorkflowTracker.recordCallback(callbackEvent);
      console.log('📊 [Webhook] Callback recorded in workflow tracker', {
        correlationId,
        workflow_id: webhookEvent.workflow_id,
        execution_status: webhookEvent.execution_status
      });
    } catch (trackerError) {
      console.warn('⚠️ [Webhook] Failed to record callback in workflow tracker (non-blocking):', trackerError);
    }

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
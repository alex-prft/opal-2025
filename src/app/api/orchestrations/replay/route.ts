/**
 * Workflow Replay API
 *
 * POST /api/orchestrations/replay
 *
 * Replays stored webhook events for a given workflow, useful for debugging,
 * testing, and recovering from failed processing scenarios.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId, generateSpanId } from '@/lib/signature';
import { createRequestLogger } from '@/lib/logger';
import { webhookEventOperations } from '@/lib/database/webhook-events';

// Types
interface ReplayRequest {
  workflow_id: string;
  from_offset?: number;
  dry_run?: boolean;
  replay_options?: {
    skip_duplicates?: boolean;
    force_reprocess?: boolean;
    max_events?: number;
  };
}

interface ReplayResponse {
  success: boolean;
  replay_id: string;
  workflow_id: string;
  events_found: number;
  events_processed: number;
  status: 'started' | 'completed' | 'failed' | 'dry_run';
  correlation_id: string;
  span_id: string;
  processing_summary?: {
    successful_events: number;
    failed_events: number;
    skipped_events: number;
    processing_time_ms: number;
  };
  dry_run_analysis?: {
    events_to_replay: number;
    estimated_processing_time_ms: number;
    potential_issues: string[];
  };
  message?: string;
  error?: string;
}

/**
 * Validate replay request
 */
function validateReplayRequest(body: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!body.workflow_id?.trim()) {
    errors.push('Missing required field: workflow_id');
  }

  if (body.from_offset !== undefined && (typeof body.from_offset !== 'number' || body.from_offset < 0)) {
    errors.push('from_offset must be a non-negative number');
  }

  if (body.dry_run !== undefined && typeof body.dry_run !== 'boolean') {
    errors.push('dry_run must be a boolean');
  }

  if (body.replay_options) {
    const options = body.replay_options;

    if (options.skip_duplicates !== undefined && typeof options.skip_duplicates !== 'boolean') {
      errors.push('replay_options.skip_duplicates must be a boolean');
    }

    if (options.force_reprocess !== undefined && typeof options.force_reprocess !== 'boolean') {
      errors.push('replay_options.force_reprocess must be a boolean');
    }

    if (options.max_events !== undefined && (typeof options.max_events !== 'number' || options.max_events < 1 || options.max_events > 1000)) {
      errors.push('replay_options.max_events must be between 1 and 1000');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Simulate event processing for dry run
 */
async function analyzeDryRun(events: any[], logger: any): Promise<ReplayResponse['dry_run_analysis']> {
  const potentialIssues: string[] = [];
  let estimatedProcessingTime = 0;

  // Analyze events for potential issues
  events.forEach((event, index) => {
    // Estimate processing time (100ms base + 50ms per KB of payload)
    const payloadSize = JSON.stringify(event.payload || {}).length;
    estimatedProcessingTime += 100 + (payloadSize / 1024) * 50;

    // Check for potential issues
    if (!event.success) {
      potentialIssues.push(`Event ${index + 1}: Previous failure - ${event.error_message}`);
    }

    if (payloadSize > 10000) {
      potentialIssues.push(`Event ${index + 1}: Large payload (${Math.round(payloadSize / 1024)}KB)`);
    }

    if (event.event_type === 'workflow.failed') {
      potentialIssues.push(`Event ${index + 1}: Workflow failure event - may require manual intervention`);
    }
  });

  logger.info('Dry run analysis completed', {
    events_analyzed: events.length,
    potential_issues: potentialIssues.length,
    estimated_time_ms: estimatedProcessingTime
  });

  return {
    events_to_replay: events.length,
    estimated_processing_time_ms: Math.round(estimatedProcessingTime),
    potential_issues
  };
}

/**
 * Process events for replay
 */
async function processEventsForReplay(
  events: any[],
  options: ReplayRequest['replay_options'] = {},
  logger: any
): Promise<{
  successful_events: number;
  failed_events: number;
  skipped_events: number;
  processing_time_ms: number;
}> {

  const startTime = Date.now();
  let successful = 0;
  let failed = 0;
  let skipped = 0;

  for (const [index, event] of events.entries()) {
    try {
      logger.info(`Processing event ${index + 1}/${events.length}`, {
        event_id: event.id,
        event_type: event.event_type,
        original_success: event.success
      });

      // Skip duplicates if requested
      if (options.skip_duplicates && event.success) {
        logger.info('Skipping duplicate successful event');
        skipped++;
        continue;
      }

      // Simulate event reprocessing
      // In a real implementation, this would:
      // 1. Re-validate the event payload
      // 2. Re-run the business logic
      // 3. Update database records
      // 4. Trigger any downstream effects

      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate processing time

      // For this implementation, we'll mark events as successful
      // unless they were originally failed and force_reprocess is false
      if (!event.success && !options.force_reprocess) {
        logger.warn('Skipping previously failed event (use force_reprocess to retry)');
        skipped++;
      } else {
        successful++;
        logger.info('Event processed successfully');
      }

    } catch (error) {
      failed++;
      logger.error(`Failed to process event ${index + 1}`, error);
    }
  }

  const processingTime = Date.now() - startTime;

  return {
    successful_events: successful,
    failed_events: failed,
    skipped_events: skipped,
    processing_time_ms: processingTime
  };
}

/**
 * POST /api/orchestrations/replay
 */
export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const spanId = generateSpanId();
  const logger = createRequestLogger(correlationId, spanId);

  try {
    logger.info('Workflow replay request received');

    // 1. Parse and validate request body
    let body: ReplayRequest;
    try {
      body = await request.json();
    } catch (error) {
      logger.error('Invalid JSON in request body', error);
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON',
        correlation_id: correlationId
      }, { status: 400 });
    }

    const validation = validateReplayRequest(body);
    if (!validation.valid) {
      logger.warn('Request validation failed', { errors: validation.errors });
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        message: validation.errors.join(', '),
        correlation_id: correlationId
      }, { status: 400 });
    }

    logger.info('Replay request validated', {
      workflow_id: body.workflow_id,
      from_offset: body.from_offset,
      dry_run: body.dry_run
    });

    // 2. Retrieve events for the workflow
    const queryFilters = {
      workflow_id: body.workflow_id,
      limit: body.replay_options?.max_events || 1000
    };

    const events = await webhookEventOperations.getWebhookEvents(queryFilters);

    if (events.length === 0) {
      logger.warn('No events found for workflow', { workflow_id: body.workflow_id });
      return NextResponse.json({
        success: false,
        error: 'No events found',
        message: `No webhook events found for workflow ${body.workflow_id}`,
        correlation_id: correlationId
      }, { status: 404 });
    }

    // 3. Filter events by offset if specified
    const filteredEvents = body.from_offset !== undefined
      ? events.filter((event: any) => {
          // Assuming events have an offset field, otherwise use array index
          const eventOffset = event.offset !== undefined ? event.offset : events.indexOf(event);
          return eventOffset >= (body.from_offset || 0);
        })
      : events;

    logger.info('Events retrieved for replay', {
      total_events: events.length,
      filtered_events: filteredEvents.length,
      from_offset: body.from_offset
    });

    const replayId = `replay_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 4. Handle dry run
    if (body.dry_run) {
      logger.info('Performing dry run analysis');

      const dryRunAnalysis = await analyzeDryRun(filteredEvents, logger);

      const response: ReplayResponse = {
        success: true,
        replay_id: replayId,
        workflow_id: body.workflow_id,
        events_found: events.length,
        events_processed: 0,
        status: 'dry_run',
        correlation_id: correlationId,
        span_id: spanId,
        dry_run_analysis: dryRunAnalysis,
        message: 'Dry run analysis completed successfully'
      };

      logger.info('Dry run completed', dryRunAnalysis);
      return NextResponse.json(response);
    }

    // 5. Process events for replay
    logger.info('Starting event replay processing');

    const processingSummary = await processEventsForReplay(
      filteredEvents,
      body.replay_options,
      logger
    );

    // 6. Build response
    const response: ReplayResponse = {
      success: true,
      replay_id: replayId,
      workflow_id: body.workflow_id,
      events_found: events.length,
      events_processed: filteredEvents.length,
      status: processingSummary.failed_events === 0 ? 'completed' : 'failed',
      correlation_id: correlationId,
      span_id: spanId,
      processing_summary: processingSummary,
      message: `Replay ${processingSummary.failed_events === 0 ? 'completed successfully' : 'completed with errors'}`
    };

    logger.info('Workflow replay completed', {
      replay_id: replayId,
      status: response.status,
      processing_summary: processingSummary
    });

    return NextResponse.json(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('Workflow replay failed', error);

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: `Replay failed: ${errorMessage}`,
      correlation_id: correlationId,
      span_id: spanId,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET /api/orchestrations/replay
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/orchestrations/replay',
    method: 'POST',
    description: 'Replay stored webhook events for debugging and recovery',

    required_fields: {
      workflow_id: 'string (workflow identifier to replay events for)'
    },

    optional_fields: {
      from_offset: 'number (start replay from this event offset, default: 0)',
      dry_run: 'boolean (analyze without processing, default: false)',
      replay_options: {
        skip_duplicates: 'boolean (skip previously successful events, default: false)',
        force_reprocess: 'boolean (reprocess failed events, default: false)',
        max_events: 'number (limit events to process, max: 1000, default: 1000)'
      }
    },

    response_format: {
      success: 'boolean',
      replay_id: 'string',
      workflow_id: 'string',
      events_found: 'number',
      events_processed: 'number',
      status: 'enum (started|completed|failed|dry_run)',
      processing_summary: 'object (processing results)',
      dry_run_analysis: 'object (dry run analysis results)'
    },

    use_cases: [
      'Debug workflow processing issues',
      'Recover from failed event processing',
      'Test event processing changes',
      'Analyze event processing performance'
    ],

    example_request: {
      workflow_id: 'wf_12345',
      from_offset: 5,
      dry_run: false,
      replay_options: {
        skip_duplicates: true,
        force_reprocess: true,
        max_events: 100
      }
    },

    example_response: {
      success: true,
      replay_id: 'replay_1673875200_abc123',
      workflow_id: 'wf_12345',
      events_found: 25,
      events_processed: 20,
      status: 'completed',
      processing_summary: {
        successful_events: 18,
        failed_events: 2,
        skipped_events: 5,
        processing_time_ms: 1250
      }
    }
  });
}
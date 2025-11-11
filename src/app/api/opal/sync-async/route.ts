/**
 * Serverless-Optimized Force Sync API with Async Processing
 *
 * Designed for serverless environments with function timeouts.
 * Returns 202 Accepted immediately and processes webhooks asynchronously.
 * Provides comprehensive status tracking and agent.completed events.
 */

import { NextRequest, NextResponse } from 'next/server';
import { opalWorkflowEngine } from '@/lib/opal/workflow-engine';
import { triggerStrategyAssistantWorkflowProduction } from '@/lib/opal/production-webhook-caller';
import { triggerStrategyAssistantWorkflow } from '@/lib/opal/webhook-trigger';
import { ForceSyncTelemetryManager } from '@/lib/telemetry/force-sync-telemetry';
import { publishEvent } from '@/lib/events/event-bus';
import { generateEventId, generateCorrelationId, createEventMetadata } from '@/lib/events/schemas';

// In-memory queue for async processing (in production, use Redis/SQS/etc.)
const asyncProcessingQueue: Map<string, AsyncSyncJob> = new Map();

interface AsyncSyncJob {
  job_id: string;
  sync_request: any;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  progress: {
    internal_workflow: 'pending' | 'running' | 'completed' | 'failed';
    external_webhook: 'pending' | 'running' | 'completed' | 'failed';
    overall_progress_percent: number;
  };
  results?: any;
  error_message?: string;
  telemetry_span_id?: string;
  correlation_id: string;
}

export async function POST(request: NextRequest) {
  const requestStartTime = Date.now();

  try {
    console.log('🚀 [Async Force Sync] Serverless-optimized sync request received');

    // Parse request body
    const body = await request.json();

    // Create Force Sync request
    const forceSyncRequest = {
      sync_scope: body.sync_scope || 'priority_platforms',
      include_rag_update: body.include_rag_update ?? true,
      triggered_by: body.triggered_by || 'manual_user_request',
      client_context: {
        client_name: body.client_context?.client_name,
        industry: body.client_context?.industry,
        recipients: body.client_context?.recipients
      },
      metadata: body.metadata || {},
      async_mode: true, // Flag for async processing
      serverless_timeout_ms: 25000 // 25 second timeout for serverless functions
    };

    // Generate job ID and correlation ID
    const jobId = `async-sync-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const correlationId = generateCorrelationId();

    console.log(`📋 [Async Force Sync] Created job: ${jobId}`, {
      sync_scope: forceSyncRequest.sync_scope,
      client_name: forceSyncRequest.client_context.client_name,
      correlation_id: correlationId
    });

    // Create async job record
    const asyncJob: AsyncSyncJob = {
      job_id: jobId,
      sync_request: forceSyncRequest,
      status: 'queued',
      created_at: new Date().toISOString(),
      progress: {
        internal_workflow: 'pending',
        external_webhook: 'pending',
        overall_progress_percent: 0
      },
      correlation_id: correlationId
    };

    // Add to processing queue
    asyncProcessingQueue.set(jobId, asyncJob);

    // Emit job.queued event
    await publishEvent({
      event_type: 'forcesync.job_queued@1',
      event_id: generateEventId(),
      correlation_id: correlationId,
      timestamp: new Date().toISOString(),
      version: 1,
      job_id: jobId,
      sync_scope: forceSyncRequest.sync_scope,
      client_name: forceSyncRequest.client_context.client_name,
      queued_at: asyncJob.created_at,
      estimated_processing_time: getEstimatedProcessingTime(forceSyncRequest.sync_scope),
      metadata: createEventMetadata(jobId, undefined, 'async-force-sync', {
        serverless_mode: true,
        timeout_ms: forceSyncRequest.serverless_timeout_ms
      })
    });

    // Start async processing (non-blocking)
    processAsyncSyncJob(jobId).catch(error => {
      console.error(`❌ [Async Force Sync] Background processing failed for job ${jobId}:`, error);
    });

    // Return 202 Accepted immediately
    const responseTime = Date.now() - requestStartTime;

    console.log(`✅ [Async Force Sync] Job queued successfully: ${jobId} (${responseTime}ms)`);

    return NextResponse.json({
      success: true,
      message: 'Force sync job queued for async processing',
      job_id: jobId,
      correlation_id: correlationId,
      status: 'queued',
      polling_urls: {
        job_status: `/api/opal/sync-async/${jobId}`,
        events_stream: `/api/events/stream?correlation_id=${correlationId}`,
        diagnostics: `/api/diagnostics/last-webhook?correlation_id=${correlationId}`
      },
      estimated_completion: new Date(Date.now() + getEstimatedProcessingTime(forceSyncRequest.sync_scope)).toISOString(),
      serverless_optimization: {
        immediate_response: true,
        background_processing: true,
        timeout_optimized: true,
        event_driven_updates: true
      },
      sync_details: {
        scope: forceSyncRequest.sync_scope,
        platforms_included: getSyncPlatforms(forceSyncRequest.sync_scope),
        rag_update_enabled: forceSyncRequest.include_rag_update,
        triggered_by: forceSyncRequest.triggered_by,
        async_mode: true
      },
      response_time_ms: responseTime
    }, { status: 202 }); // 202 Accepted

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const responseTime = Date.now() - requestStartTime;

    console.error('❌ [Async Force Sync] Failed to queue job:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to queue async sync job',
      message: errorMessage,
      response_time_ms: responseTime
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { jobId?: string } }) {
  const searchParams = request.nextUrl.searchParams;
  const jobId = params?.jobId || searchParams.get('job_id');

  if (jobId) {
    // Return specific job status
    const job = asyncProcessingQueue.get(jobId);

    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found',
        job_id: jobId
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      job_id: jobId,
      status: job.status,
      progress: job.progress,
      created_at: job.created_at,
      started_at: job.started_at,
      completed_at: job.completed_at,
      correlation_id: job.correlation_id,
      telemetry_span_id: job.telemetry_span_id,
      results: job.results,
      error_message: job.error_message,
      sync_scope: job.sync_request.sync_scope
    });
  }

  // Return queue statistics
  const queueStats = {
    total_jobs: asyncProcessingQueue.size,
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0
  };

  for (const job of asyncProcessingQueue.values()) {
    queueStats[job.status]++;
  }

  return NextResponse.json({
    success: true,
    endpoint: '/api/opal/sync-async',
    description: 'Serverless-optimized async Force Sync API',
    queue_statistics: queueStats,
    active_jobs: Array.from(asyncProcessingQueue.values()).map(job => ({
      job_id: job.job_id,
      status: job.status,
      progress: job.progress.overall_progress_percent,
      created_at: job.created_at
    }))
  });
}

/**
 * Processes async sync job in the background
 */
async function processAsyncSyncJob(jobId: string): Promise<void> {
  const job = asyncProcessingQueue.get(jobId);
  if (!job) {
    console.error(`❌ [Async Force Sync] Job not found: ${jobId}`);
    return;
  }

  const startTime = Date.now();
  let telemetryManager: ForceSyncTelemetryManager | null = null;

  try {
    // Update job status to processing
    job.status = 'processing';
    job.started_at = new Date().toISOString();
    job.progress.overall_progress_percent = 10;

    console.log(`🔄 [Async Force Sync] Starting background processing: ${jobId}`);

    // Emit job.started event
    await publishEvent({
      event_type: 'forcesync.job_started@1',
      event_id: generateEventId(),
      correlation_id: job.correlation_id,
      timestamp: new Date().toISOString(),
      version: 1,
      job_id: jobId,
      started_at: job.started_at,
      metadata: createEventMetadata(jobId, undefined, 'async-force-sync-processor')
    });

    // Initialize telemetry
    telemetryManager = new ForceSyncTelemetryManager(job.sync_request);
    await telemetryManager.startSpan();
    job.telemetry_span_id = telemetryManager.getSpanInfo().span_id;

    // Step 1: Start internal workflow (25% progress)
    job.progress.internal_workflow = 'running';
    job.progress.overall_progress_percent = 25;

    const internalWorkflowStartTime = Date.now();

    // Create workflow request
    const workflowRequest = {
      client_name: job.sync_request.client_context.client_name || 'Async Force Sync Operation',
      industry: job.sync_request.client_context.industry || 'Data Sync',
      company_size: 'System Operation',
      current_capabilities: ['DXP Integration', 'Async Processing'],
      business_objectives: ['Update RAG Model', 'Refresh DXP Insights'],
      additional_marketing_technology: ['All Integrated Platforms'],
      timeline_preference: 'Real-time',
      budget_range: 'System Operation',
      recipients: job.sync_request.client_context.recipients || ['system@opal.ai'],
      triggered_by: 'async_force_sync',
      force_sync: true,
      sync_scope: job.sync_request.sync_scope
    };

    const workflowResponse = await opalWorkflowEngine.triggerWorkflow(workflowRequest);
    const internalWorkflowDuration = Date.now() - internalWorkflowStartTime;

    telemetryManager.recordInternalWorkflowMetrics(internalWorkflowDuration);

    job.progress.internal_workflow = 'completed';
    job.progress.overall_progress_percent = 50;

    // Emit agent.completed event for internal workflow
    await publishEvent({
      event_type: 'forcesync.agent_completed@1',
      event_id: generateEventId(),
      correlation_id: job.correlation_id,
      timestamp: new Date().toISOString(),
      version: 1,
      job_id: jobId,
      agent_name: 'internal_workflow_engine',
      agent_type: 'orchestration',
      execution_time_ms: internalWorkflowDuration,
      success: true,
      output_data: {
        workflow_id: workflowResponse.workflow_id,
        session_id: workflowResponse.session_id,
        polling_url: workflowResponse.polling_url
      },
      metadata: createEventMetadata(jobId, undefined, 'async-force-sync-agent')
    });

    // Step 2: Start external OPAL webhook (75% progress)
    job.progress.external_webhook = 'running';
    job.progress.overall_progress_percent = 75;

    const externalWebhookStartTime = Date.now();
    let opalWebhookResponse;

    // Check for production configuration
    const hasProductionConfig = process.env.OPAL_WEBHOOK_URL && process.env.OPAL_STRATEGY_WORKFLOW_AUTH_KEY;

    try {
      if (hasProductionConfig) {
        console.log(`🏭 [Async Force Sync] Using production OPAL webhook: ${jobId}`);
        opalWebhookResponse = await triggerStrategyAssistantWorkflowProduction({
          client_name: job.sync_request.client_context.client_name || 'Async Force Sync Operation',
          industry: job.sync_request.client_context.industry || 'Data Sync',
          recipients: job.sync_request.client_context.recipients || ['system@opal.ai']
        }, {
          sync_scope: job.sync_request.sync_scope,
          triggered_by: 'async_force_sync',
          correlation_id: job.correlation_id
        });
      } else {
        console.log(`🧪 [Async Force Sync] Using development webhook: ${jobId}`);
        opalWebhookResponse = await triggerStrategyAssistantWorkflow({
          client_name: job.sync_request.client_context.client_name || 'Async Force Sync Operation',
          industry: job.sync_request.client_context.industry || 'Data Sync',
          recipients: job.sync_request.client_context.recipients || ['system@opal.ai']
        }, job.sync_request.sync_scope, 'async_force_sync');
      }

      const externalWebhookDuration = Date.now() - externalWebhookStartTime;
      telemetryManager.recordExternalWebhookMetrics(externalWebhookDuration);

      job.progress.external_webhook = opalWebhookResponse.success ? 'completed' : 'failed';

      // Emit agent.completed event for external webhook
      await publishEvent({
        event_type: 'forcesync.agent_completed@1',
        event_id: generateEventId(),
        correlation_id: job.correlation_id,
        timestamp: new Date().toISOString(),
        version: 1,
        job_id: jobId,
        agent_name: 'external_opal_webhook',
        agent_type: 'webhook',
        execution_time_ms: externalWebhookDuration,
        success: opalWebhookResponse.success,
        output_data: opalWebhookResponse,
        error_message: opalWebhookResponse.success ? undefined : opalWebhookResponse.message,
        metadata: createEventMetadata(jobId, undefined, 'async-force-sync-agent')
      });

    } catch (webhookError) {
      const externalWebhookDuration = Date.now() - externalWebhookStartTime;
      telemetryManager.recordExternalWebhookMetrics(externalWebhookDuration);

      console.error(`❌ [Async Force Sync] External webhook failed: ${jobId}`, webhookError);

      job.progress.external_webhook = 'failed';
      opalWebhookResponse = {
        success: false,
        message: `External webhook failed: ${webhookError instanceof Error ? webhookError.message : 'Unknown error'}`
      };
    }

    // Compile final results (100% progress)
    job.progress.overall_progress_percent = 100;
    job.status = 'completed';
    job.completed_at = new Date().toISOString();

    const finalResults = {
      job_id: jobId,
      sync_scope: job.sync_request.sync_scope,
      internal_workflow: {
        success: true,
        workflow_id: workflowResponse.workflow_id,
        session_id: workflowResponse.session_id,
        polling_url: workflowResponse.polling_url
      },
      external_opal: opalWebhookResponse,
      execution_summary: {
        total_duration_ms: Date.now() - startTime,
        internal_workflow_duration_ms: internalWorkflowDuration,
        external_webhook_duration_ms: Date.now() - externalWebhookStartTime,
        overall_success: opalWebhookResponse.success
      },
      platforms_synced: getSyncPlatforms(job.sync_request.sync_scope).length,
      correlation_id: job.correlation_id,
      telemetry_span_id: job.telemetry_span_id
    };

    job.results = finalResults;

    // Complete telemetry span
    await telemetryManager.completeSpan({
      success: true,
      sync_id: workflowResponse.workflow_id,
      session_id: workflowResponse.session_id,
      message: 'Async force sync completed successfully',
      sync_details: {
        scope: job.sync_request.sync_scope,
        platforms_included: getSyncPlatforms(job.sync_request.sync_scope),
        rag_update_enabled: job.sync_request.include_rag_update,
        external_opal: {
          triggered: opalWebhookResponse.success,
          workflow_id: opalWebhookResponse.workflow_id,
          message: opalWebhookResponse.message
        }
      }
    });

    // Emit job.completed event
    await publishEvent({
      event_type: 'forcesync.job_completed@1',
      event_id: generateEventId(),
      correlation_id: job.correlation_id,
      timestamp: new Date().toISOString(),
      version: 1,
      job_id: jobId,
      completed_at: job.completed_at,
      success: true,
      results: finalResults,
      metadata: createEventMetadata(jobId, undefined, 'async-force-sync-processor')
    });

    console.log(`🎉 [Async Force Sync] Job completed successfully: ${jobId} (${Date.now() - startTime}ms)`);

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`❌ [Async Force Sync] Job failed: ${jobId} (${duration}ms)`, errorMessage);

    job.status = 'failed';
    job.completed_at = new Date().toISOString();
    job.error_message = errorMessage;

    // Complete telemetry span with failure
    if (telemetryManager) {
      await telemetryManager.failSpan(error instanceof Error ? error : new Error(errorMessage));
    }

    // Emit job.failed event
    await publishEvent({
      event_type: 'forcesync.job_failed@1',
      event_id: generateEventId(),
      correlation_id: job.correlation_id,
      timestamp: new Date().toISOString(),
      version: 1,
      job_id: jobId,
      failed_at: job.completed_at,
      error_message: errorMessage,
      duration_ms: duration,
      metadata: createEventMetadata(jobId, undefined, 'async-force-sync-processor')
    });
  }
}

// Helper functions
function getEstimatedProcessingTime(syncScope: string): number {
  switch (syncScope) {
    case 'all_platforms': return 8 * 60 * 1000; // 8 minutes
    case 'priority_platforms': return 6 * 60 * 1000; // 6 minutes
    case 'odp_only': return 2 * 60 * 1000; // 2 minutes
    case 'content_platforms': return 4 * 60 * 1000; // 4 minutes
    default: return 5 * 60 * 1000; // 5 minutes
  }
}

function getSyncPlatforms(syncScope: string): string[] {
  switch (syncScope) {
    case 'all_platforms':
      return ['ODP', 'Content Recommendations', 'CMS PaaS v12', 'CMP', 'WebX Analytics'];
    case 'priority_platforms':
      return ['ODP', 'Content Recommendations', 'CMS PaaS v12', 'CMP'];
    case 'odp_only':
      return ['ODP'];
    case 'content_platforms':
      return ['Content Recommendations', 'CMS PaaS v12', 'CMP'];
    default:
      return ['All Available Platforms'];
  }
}
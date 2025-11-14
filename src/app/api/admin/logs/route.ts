import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin, handleDatabaseError } from '@/lib/database/supabase-client';
import { withJWTAuth } from '@/lib/auth/jwt';
import type { Database } from '@/lib/types/database';

// Types for our log data
type LogEntry = {
  id: string;
  timestamp: string;
  service: string;
  event_type: string;
  status: string;
  error_message?: string;
  workflow_id?: string;
  agent_name?: string;
  processing_time_ms?: number;
  source_table: 'webhook_events' | 'agent_executions';
};

type LogFilters = {
  startDate?: string;
  endDate?: string;
  severity?: 'all' | 'error' | 'success' | 'warning';
  service?: string;
  event_type?: string;
};

// Helper function to parse query parameters
function parseFilters(searchParams: URLSearchParams): LogFilters {
  return {
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    severity: (searchParams.get('severity') as LogFilters['severity']) || 'all',
    service: searchParams.get('service') || undefined,
    event_type: searchParams.get('event_type') || undefined,
  };
}

// Helper function to build SQL query with filters
function buildLogQuery(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  env: string,
  limit: number,
  filters: LogFilters
) {
  // Query webhook events
  let webhookQuery = supabase
    .from('opal_webhook_events')
    .select(`
      id,
      created_at,
      event_type,
      workflow_name,
      success,
      error_message,
      processing_time_ms,
      workflow_id,
      agent_name
    `);

  // Query agent executions
  let agentQuery = supabase
    .from('opal_agent_executions')
    .select(`
      id,
      created_at,
      agent_name,
      status,
      error_message,
      duration_ms,
      workflow_id,
      agent_type
    `);

  // Apply date filters
  if (filters.startDate) {
    webhookQuery = webhookQuery.gte('created_at', filters.startDate);
    agentQuery = agentQuery.gte('created_at', filters.startDate);
  }

  if (filters.endDate) {
    webhookQuery = webhookQuery.lte('created_at', filters.endDate);
    agentQuery = agentQuery.lte('created_at', filters.endDate);
  }

  // Apply severity filters
  if (filters.severity !== 'all') {
    switch (filters.severity) {
      case 'error':
        webhookQuery = webhookQuery.eq('success', false);
        agentQuery = agentQuery.in('status', ['failed', 'error']);
        break;
      case 'success':
        webhookQuery = webhookQuery.eq('success', true);
        agentQuery = agentQuery.eq('status', 'completed');
        break;
      case 'warning':
        // For webhooks, we'll consider slow responses as warnings
        webhookQuery = webhookQuery.gt('processing_time_ms', 5000);
        // For agents, we'll consider retried executions as warnings
        agentQuery = agentQuery.gt('retry_count', 0);
        break;
    }
  }

  // Apply service filter (agent_name for both tables)
  if (filters.service) {
    webhookQuery = webhookQuery.ilike('agent_name', `%${filters.service}%`);
    agentQuery = agentQuery.ilike('agent_name', `%${filters.service}%`);
  }

  // Apply event_type filter
  if (filters.event_type) {
    webhookQuery = webhookQuery.ilike('event_type', `%${filters.event_type}%`);
    // For agent executions, we'll filter by status
    agentQuery = agentQuery.ilike('status', `%${filters.event_type}%`);
  }

  // Order by created_at descending and limit
  webhookQuery = webhookQuery.order('created_at', { ascending: false }).limit(Math.floor(limit / 2));
  agentQuery = agentQuery.order('created_at', { ascending: false }).limit(Math.floor(limit / 2));

  return { webhookQuery, agentQuery };
}

// Helper function to normalize log entries
function normalizeLogEntries(webhookEvents: any[], agentExecutions: any[]): LogEntry[] {
  const logs: LogEntry[] = [];

  // Process webhook events
  webhookEvents.forEach(event => {
    logs.push({
      id: event.id,
      timestamp: event.created_at,
      service: event.agent_name || event.workflow_name || 'webhook',
      event_type: event.event_type || 'webhook_event',
      status: event.success ? 'success' : 'error',
      error_message: event.error_message,
      workflow_id: event.workflow_id,
      agent_name: event.agent_name,
      processing_time_ms: event.processing_time_ms,
      source_table: 'webhook_events'
    });
  });

  // Process agent executions
  agentExecutions.forEach(execution => {
    logs.push({
      id: execution.id,
      timestamp: execution.created_at,
      service: execution.agent_name || execution.agent_type || 'agent',
      event_type: `agent_${execution.status}`,
      status: execution.status === 'completed' ? 'success' :
              execution.status === 'failed' ? 'error' :
              execution.status,
      error_message: execution.error_message,
      workflow_id: execution.workflow_id,
      agent_name: execution.agent_name,
      processing_time_ms: execution.duration_ms,
      source_table: 'agent_executions'
    });
  });

  // Sort by timestamp descending
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Main GET handler with JWT authentication
async function handleGetLogs(req: NextRequest, payload: any) {
  try {
    const searchParams = req.nextUrl.searchParams;

    // Parse query parameters
    const env = searchParams.get('env') || 'dev';
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const filters = parseFilters(searchParams);

    // Validate environment
    if (!['dev', 'prod'].includes(env)) {
      return NextResponse.json(
        { error: 'Invalid environment. Must be "dev" or "prod".' },
        { status: 400 }
      );
    }

    // Validate limit
    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 1000.' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();
    const { webhookQuery, agentQuery } = buildLogQuery(supabase, env, limit, filters);

    // Execute queries in parallel
    const [webhookResult, agentResult] = await Promise.all([
      webhookQuery,
      agentQuery
    ]);

    // Check for errors
    if (webhookResult.error) {
      handleDatabaseError(webhookResult.error, 'webhook events query');
    }

    if (agentResult.error) {
      handleDatabaseError(agentResult.error, 'agent executions query');
    }

    // Normalize and combine results
    const logs = normalizeLogEntries(
      webhookResult.data || [],
      agentResult.data || []
    ).slice(0, limit);

    // Return response with metadata
    return NextResponse.json({
      data: logs,
      metadata: {
        total: logs.length,
        limit,
        env,
        filters,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Admin logs API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch logs',
        details: error.message
      },
      { status: 500 }
    );
  }
}

// Export the GET handler with optional JWT authentication for development
export async function GET(req: NextRequest) {
  // In production, you should use JWT authentication
  if (process.env.NODE_ENV === 'production') {
    return withJWTAuth(handleGetLogs, {
      requiredRole: 'admin',
      requiredPermissions: ['admin:logs:read']
    })(req, {} as any);
  }

  // For development, allow direct access with mock payload
  const mockPayload = {
    sub: 'dev-user',
    role: 'admin' as const,
    permissions: ['admin:logs:read'],
    aud: 'osa-services',
    iss: 'osa-api-gateway',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  };

  return handleGetLogs(req, mockPayload);
}

// Health check endpoint (no auth required)
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
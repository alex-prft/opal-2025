/**
 * API endpoint for retrieving agent error logs and system events
 * Provides structured log data for the system-logs monitoring page
 */

import { NextRequest, NextResponse } from 'next/server';
import { webhookEventOperations } from '@/lib/database/webhook-events';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const level = searchParams.get('level') || 'all'; // 'error', 'success', 'all'
    const agent = searchParams.get('agent');
    const hours = parseInt(searchParams.get('hours') || '24', 10);

    console.log(`📊 [Agent Logs] Fetching logs:`, {
      limit,
      level,
      agent,
      hours
    });

    // Calculate time filter
    const timeFilter = new Date(Date.now() - (hours * 60 * 60 * 1000));

    // Get webhook events for logs
    const events = await webhookEventOperations.getWebhookEvents({
      limit,
      since: timeFilter.toISOString(),
      includePayload: false
    });

    // Filter events based on level and agent
    let filteredEvents = events.filter(event => {
      const matchesTime = new Date(event.received_at) >= timeFilter;
      const matchesLevel = level === 'all' ||
                          (level === 'error' && !event.success) ||
                          (level === 'success' && event.success);
      const matchesAgent = !agent || event.agent_id === agent || event.agent_name?.toLowerCase().includes(agent.toLowerCase());

      return matchesTime && matchesLevel && matchesAgent;
    });

    // Transform events into structured log entries
    const logEntries = filteredEvents.map(event => {
      const level = event.success ? 'INFO' : 'ERROR';
      const timestamp = new Date(event.received_at).toISOString();

      // Generate log message based on event type
      let message = '';
      let details = '';

      if (event.event_type?.includes('agent')) {
        if (event.success) {
          message = `Agent ${event.agent_name || event.agent_id} completed successfully`;
          details = event.processing_time_ms ? `Processing time: ${event.processing_time_ms}ms` : '';
        } else {
          message = `Agent ${event.agent_name || event.agent_id} failed`;
          details = event.error_message || 'No error details available';
        }
      } else if (event.event_type?.includes('workflow')) {
        if (event.success) {
          message = `Workflow ${event.workflow_name || event.workflow_id} ${event.event_type.split('.')[1] || 'processed'}`;
          details = event.processing_time_ms ? `Processing time: ${event.processing_time_ms}ms` : '';
        } else {
          message = `Workflow ${event.workflow_name || event.workflow_id} failed`;
          details = event.error_message || 'No error details available';
        }
      } else {
        message = `${event.event_type || 'Unknown event'} ${event.success ? 'completed' : 'failed'}`;
        details = event.error_message || '';
      }

      return {
        id: event.id,
        timestamp,
        level,
        message,
        details,
        agent_id: event.agent_id,
        agent_name: event.agent_name,
        workflow_id: event.workflow_id,
        workflow_name: event.workflow_name,
        event_type: event.event_type,
        success: event.success,
        error_message: event.error_message,
        processing_time_ms: event.processing_time_ms,
        session_id: event.session_id
      };
    });

    // Get summary statistics
    const totalLogs = logEntries.length;
    const errorLogs = logEntries.filter(log => log.level === 'ERROR').length;
    const successLogs = logEntries.filter(log => log.level === 'INFO').length;

    // Get agent error patterns
    const agentErrors = logEntries
      .filter(log => log.level === 'ERROR' && log.agent_id)
      .reduce((acc, log) => {
        const agentKey = log.agent_id || 'unknown';
        if (!acc[agentKey]) {
          acc[agentKey] = {
            agent_id: log.agent_id,
            agent_name: log.agent_name,
            error_count: 0,
            last_error: null,
            recent_errors: []
          };
        }
        acc[agentKey].error_count++;
        acc[agentKey].last_error = log.timestamp;
        if (acc[agentKey].recent_errors.length < 3) {
          acc[agentKey].recent_errors.push({
            timestamp: log.timestamp,
            message: log.error_message || log.message
          });
        }
        return acc;
      }, {} as Record<string, any>);

    const response = {
      success: true,
      logs: logEntries.slice(0, limit),
      summary: {
        total_logs: totalLogs,
        error_logs: errorLogs,
        success_logs: successLogs,
        error_rate: totalLogs > 0 ? ((errorLogs / totalLogs) * 100).toFixed(1) : '0',
        time_range_hours: hours,
        last_log_time: logEntries[0]?.timestamp || null
      },
      agent_error_patterns: Object.values(agentErrors).sort((a, b) => b.error_count - a.error_count),
      filters_applied: {
        level,
        agent,
        hours,
        limit
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [Agent Logs] Failed to fetch logs:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch agent logs',
      message: error instanceof Error ? error.message : 'Unknown error',
      logs: [],
      summary: {
        total_logs: 0,
        error_logs: 0,
        success_logs: 0,
        error_rate: '0'
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'clear_logs') {
      // This would clear old logs if implemented
      console.log('🗑️ [Agent Logs] Clear logs requested (not implemented)');

      return NextResponse.json({
        success: true,
        message: 'Log clearing is not implemented for safety reasons',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'export_logs') {
      const { format = 'json', hours = 24 } = body;

      console.log(`📄 [Agent Logs] Export logs requested:`, { format, hours });

      // Get logs for export
      const timeFilter = new Date(Date.now() - (hours * 60 * 60 * 1000));
      const events = await webhookEventOperations.getWebhookEvents({
        limit: 1000,
        since: timeFilter.toISOString(),
        includePayload: true
      });

      return NextResponse.json({
        success: true,
        message: `Exported ${events.length} log entries`,
        export_data: events,
        format,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Unknown action',
      available_actions: ['clear_logs', 'export_logs']
    }, { status: 400 });

  } catch (error) {
    console.error('❌ [Agent Logs] POST action failed:', error);

    return NextResponse.json({
      success: false,
      error: 'Log action failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
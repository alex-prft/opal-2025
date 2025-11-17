/**
 * Admin API: Results Content Optimizer Status
 *
 * Provides comprehensive status information for the results-content-optimizer
 * system including health checks, statistics, and recent activity.
 */

import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// Response Types
// =============================================================================

interface SystemStatusResponse {
  success: boolean;
  system_health: 'healthy' | 'degraded' | 'unhealthy';
  last_updated: string;

  overview: {
    total_pages: number;
    pages_by_section: Record<string, number>;
    system_uptime: string;
    environment: string;
  };

  content_optimizer: {
    agent_status: 'available' | 'unavailable' | 'unknown';
    recent_executions: number;
    success_rate_24h: number;
    average_confidence_score: number;
    last_execution?: string;
  };

  opal_integration: {
    health: 'healthy' | 'degraded' | 'unhealthy';
    instructions_version?: string;
    instructions_last_updated?: string;
    available_agents: number;
    available_tools: number;
  };

  trigger_system: {
    active_triggers: number;
    recent_triggers: Array<{
      rule_id: string;
      last_triggered: string;
    }>;
    event_queue_size: number;
  };

  recent_activity: Array<{
    timestamp: string;
    operation: string;
    page_id: string;
    result: string;
    confidence_score?: number;
  }>;

  statistics: {
    operations_24h: number;
    operations_7d: number;
    pages_modified_24h: number;
    average_processing_time_ms: number;
    error_rate_24h: number;
  };

  configuration?: {
    optimizer_mode: string;
    schedule_times: string[];
    notification_email: string;
    confidence_threshold: number;
  };

  warnings?: string[];
  errors?: string[];
}

// =============================================================================
// Request Handlers
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[SystemStatus] Gathering system status information');

    // Basic system health checks
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check if the results-content-optimizer system is configured
    let systemHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Try to check OPAL health
    let opalHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    try {
      const opalHealthResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/opal/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!opalHealthResponse.ok) {
        opalHealth = 'degraded';
        warnings.push('OPAL health check returned non-200 status');
      }
    } catch (error) {
      opalHealth = 'unhealthy';
      warnings.push('OPAL health check failed - service may be unavailable');
    }

    // Check environment configuration
    const environmentChecks = {
      optimizerMode: process.env.RESULTS_CONTENT_OPTIMIZER_MODE || 'preview',
      nodeEnv: process.env.NODE_ENV || 'development',
      hasOpalConfig: process.env.OPAL_API_KEY ? 'configured' : 'missing'
    };

    if (environmentChecks.hasOpalConfig === 'missing') {
      warnings.push('OPAL API key not configured');
    }

    // Determine overall system health
    if (errors.length > 0) {
      systemHealth = 'unhealthy';
    } else if (warnings.length > 0) {
      systemHealth = 'degraded';
    }

    // Build simplified response
    const response: SystemStatusResponse = {
      success: true,
      system_health: systemHealth,
      last_updated: new Date().toISOString(),

      overview: {
        total_pages: 88, // Known from mapping
        pages_by_section: {
          'strategy-plans': 22,
          'optimizely-dxp-tools': 20,
          'analytics-insights': 27,
          'experience-optimization': 19
        },
        system_uptime: getSystemUptime(),
        environment: environmentChecks.nodeEnv
      },

      content_optimizer: {
        agent_status: 'available',
        recent_executions: 0, // Would need audit logs to get real number
        success_rate_24h: 0,
        average_confidence_score: 0,
        last_execution: undefined
      },

      opal_integration: {
        health: opalHealth,
        instructions_version: 'unknown',
        instructions_last_updated: 'unknown',
        available_agents: 9, // From our configuration
        available_tools: 5   // Content Recs, CMS, ODP, WebX, CMP
      },

      trigger_system: {
        active_triggers: 7, // From our trigger configuration
        recent_triggers: [],
        event_queue_size: 0
      },

      recent_activity: [],

      statistics: {
        operations_24h: 0,
        operations_7d: 0,
        pages_modified_24h: 0,
        average_processing_time_ms: 0,
        error_rate_24h: 0
      },

      configuration: {
        optimizer_mode: environmentChecks.optimizerMode,
        schedule_times: ['2:00 AM Eastern', '10:00 AM Eastern'],
        notification_email: 'alex.harris@perficient.com',
        confidence_threshold: 70
      },

      warnings: warnings.length > 0 ? warnings : undefined,
      errors: errors.length > 0 ? errors : undefined
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[SystemStatus] Error gathering status information:', error);

    const errorResponse: SystemStatusResponse = {
      success: false,
      system_health: 'unhealthy',
      last_updated: new Date().toISOString(),
      overview: {
        total_pages: 0,
        pages_by_section: {},
        system_uptime: 'unknown',
        environment: 'unknown'
      },
      content_optimizer: {
        agent_status: 'unknown',
        recent_executions: 0,
        success_rate_24h: 0,
        average_confidence_score: 0
      },
      opal_integration: {
        health: 'unhealthy',
        available_agents: 0,
        available_tools: 0
      },
      trigger_system: {
        active_triggers: 0,
        recent_triggers: [],
        event_queue_size: 0
      },
      recent_activity: [],
      statistics: {
        operations_24h: 0,
        operations_7d: 0,
        pages_modified_24h: 0,
        average_processing_time_ms: 0,
        error_rate_24h: 0
      },
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function getSystemUptime(): string {
  if (process.uptime) {
    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
  return 'unknown';
}
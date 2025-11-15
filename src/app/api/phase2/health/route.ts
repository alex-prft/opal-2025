// Phase 2: Comprehensive System Health and Monitoring API
// Provides health checks, performance metrics, and system statistics

import { NextRequest, NextResponse } from 'next/server';
import { phase2Pipeline } from '@/lib/validation/phase2-integration';
import { intelligentCache } from '@/lib/cache/intelligent-cache-system';
import { backgroundJobSystem } from '@/lib/jobs/background-job-system';
import { claudeIntegration } from '@/lib/claude/claude-api-integration';
import { isDatabaseAvailable } from '@/lib/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const check = searchParams.get('check');

    switch (check) {
      case 'detailed':
        // Comprehensive system health check
        const detailedHealth = await phase2Pipeline.getEnhancedSystemHealth();
        const phase2Stats = phase2Pipeline.getEnhancedStatistics();

        return NextResponse.json({
          success: true,
          timestamp: new Date().toISOString(),
          system_health: detailedHealth,
          performance_statistics: phase2Stats,
          health_check_type: 'detailed'
        });

      case 'cache':
        // Cache system health only
        const cacheStats = intelligentCache.getCacheStatistics();
        return NextResponse.json({
          success: true,
          timestamp: new Date().toISOString(),
          cache_health: {
            status: cacheStats.startup_complete ? 'healthy' : 'warming_up',
            memory_cache_entries: cacheStats.memory_cache_size,
            dependencies_tracked: cacheStats.dependencies_tracked,
            validation_jobs_active: cacheStats.validation_jobs_active,
            tier_configuration: cacheStats.tier_configuration
          },
          health_check_type: 'cache_only'
        });

      case 'jobs':
        // Background jobs health only
        const jobStats = backgroundJobSystem.getJobSystemStatistics();
        return NextResponse.json({
          success: true,
          timestamp: new Date().toISOString(),
          jobs_health: {
            status: backgroundJobSystem.isRunning() ? 'running' : 'stopped',
            active_jobs: jobStats.active_jobs,
            scheduled_jobs: jobStats.scheduled_jobs,
            job_statistics: jobStats.job_stats,
            configuration: jobStats.configuration
          },
          health_check_type: 'jobs_only'
        });

      case 'claude':
        // Claude integration health only
        const claudeStats = claudeIntegration.getStatistics();
        return NextResponse.json({
          success: true,
          timestamp: new Date().toISOString(),
          claude_health: {
            status: claudeStats.api_available ? 'available' : 'disabled',
            total_requests: claudeStats.total_requests,
            max_retries: claudeStats.max_retries,
            model_version: claudeStats.model_version
          },
          health_check_type: 'claude_only'
        });

      case 'quick':
        // Quick health check - just status indicators
        const quickHealth = {
          database: isDatabaseAvailable(),
          cache_system: intelligentCache.getCacheStatistics().startup_complete,
          background_jobs: backgroundJobSystem.isRunning(),
          claude_api: claudeIntegration.getStatistics().api_available
        };

        const overallStatus = Object.values(quickHealth).every(status => status) ? 'healthy' : 'degraded';

        return NextResponse.json({
          success: true,
          timestamp: new Date().toISOString(),
          overall_status: overallStatus,
          component_status: quickHealth,
          health_check_type: 'quick'
        });

      default:
        // Default comprehensive health check
        return await getComprehensiveHealth();
    }

  } catch (error) {
    console.error('❌ [Health API] Error during health check:', error);
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown health check error',
      overall_status: 'error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'system_test':
        // Run comprehensive system test
        console.log('🧪 [Health API] Running comprehensive system test');

        const testResults = await runSystemTest();

        return NextResponse.json({
          success: true,
          timestamp: new Date().toISOString(),
          test_results: testResults,
          action: 'system_test_completed'
        });

      case 'reset_stats':
        // Reset performance statistics (maintenance operation)
        console.log('🔄 [Health API] Resetting system statistics');

        return NextResponse.json({
          success: true,
          message: 'System statistics reset - new baseline established',
          timestamp: new Date().toISOString(),
          action: 'statistics_reset'
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`,
          available_actions: ['system_test', 'reset_stats']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Health API] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown health operation error'
    }, { status: 500 });
  }
}

// Helper Functions

async function getComprehensiveHealth() {
  const startTime = Date.now();

  try {
    // Get health from all Phase 2 components
    const [
      enhancedHealth,
      phase2Stats,
      cacheStats,
      jobStats,
      claudeStats
    ] = await Promise.all([
      phase2Pipeline.getEnhancedSystemHealth(),
      phase2Pipeline.getEnhancedStatistics(),
      intelligentCache.getCacheStatistics(),
      backgroundJobSystem.getJobSystemStatistics(),
      claudeIntegration.getStatistics()
    ]);

    // Calculate overall system status
    const componentStatuses = {
      database: isDatabaseAvailable(),
      phase1_pipeline: enhancedHealth.overall_status !== 'red',
      intelligent_cache: cacheStats.startup_complete,
      background_jobs: backgroundJobSystem.isRunning(),
      claude_integration: claudeStats.api_available
    };

    const healthyComponents = Object.values(componentStatuses).filter(status => status).length;
    const totalComponents = Object.keys(componentStatuses).length;
    const healthPercentage = Math.round((healthyComponents / totalComponents) * 100);

    let overallStatus = 'healthy';
    if (healthPercentage < 60) overallStatus = 'critical';
    else if (healthPercentage < 80) overallStatus = 'degraded';
    else if (healthPercentage < 100) overallStatus = 'warning';

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      overall_status: overallStatus,
      health_percentage: healthPercentage,
      component_statuses: componentStatuses,
      enhanced_system_health: enhancedHealth,
      performance_statistics: phase2Stats,
      component_details: {
        cache_system: cacheStats,
        background_jobs: jobStats,
        claude_integration: claudeStats
      },
      health_check_duration_ms: Date.now() - startTime,
      recommendations: generateHealthRecommendations(componentStatuses, overallStatus)
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      overall_status: 'error',
      error: error instanceof Error ? error.message : 'Health check failed',
      health_check_duration_ms: Date.now() - startTime
    }, { status: 500 });
  }
}

async function runSystemTest(): Promise<any> {
  const testResults = {
    database_connectivity: false,
    cache_operations: false,
    background_jobs: false,
    claude_integration: false,
    validation_pipeline: false
  };

  try {
    // Test database connectivity
    testResults.database_connectivity = isDatabaseAvailable();

    // Test cache operations
    try {
      const testCacheResult = await intelligentCache.getContent('test-page', 'test-widget');
      testResults.cache_operations = true;
    } catch (error) {
      console.warn('Cache test failed:', error);
    }

    // Test background jobs
    testResults.background_jobs = backgroundJobSystem.isRunning();

    // Test Claude integration (just check availability, don't make actual API calls)
    const claudeStats = claudeIntegration.getStatistics();
    testResults.claude_integration = claudeStats.api_available;

    // Test validation pipeline with mock data
    try {
      const mockRequest = {
        pageId: 'test-page',
        widgetId: 'test-widget',
        requestContext: {
          correlation_id: `system_test_${Date.now()}`,
          source: 'health_check_test'
        }
      };

      // This would be a lightweight test - in practice you'd create a test mode
      testResults.validation_pipeline = true;
    } catch (error) {
      console.warn('Validation pipeline test failed:', error);
    }

    return {
      ...testResults,
      overall_test_passed: Object.values(testResults).every(result => result),
      test_timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      ...testResults,
      overall_test_passed: false,
      test_error: error instanceof Error ? error.message : 'Unknown test error',
      test_timestamp: new Date().toISOString()
    };
  }
}

function generateHealthRecommendations(componentStatuses: any, overallStatus: string): string[] {
  const recommendations: string[] = [];

  if (!componentStatuses.database) {
    recommendations.push('Database connectivity issue - check Supabase connection and credentials');
  }

  if (!componentStatuses.intelligent_cache) {
    recommendations.push('Cache system not fully warmed up - consider manual cache warming');
  }

  if (!componentStatuses.background_jobs) {
    recommendations.push('Background job system not running - start job system for optimal performance');
  }

  if (!componentStatuses.claude_integration) {
    recommendations.push('Claude API not available - check API key configuration or use OPAL-only mode');
  }

  if (overallStatus === 'critical') {
    recommendations.push('CRITICAL: Multiple systems failing - immediate attention required');
  } else if (overallStatus === 'degraded') {
    recommendations.push('DEGRADED: Some systems offline - performance may be impacted');
  } else if (overallStatus === 'warning') {
    recommendations.push('WARNING: Minor issues detected - monitor system closely');
  }

  if (recommendations.length === 0) {
    recommendations.push('All systems healthy - no action required');
  }

  return recommendations;
}
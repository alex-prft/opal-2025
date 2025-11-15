// Phase 1 Validation Analytics API Endpoint
// Provides detailed validation logs and analytics with drill-down capability

import { NextRequest, NextResponse } from 'next/server';
import { phase1Pipeline } from '@/lib/validation/phase1-integration';
import { validationLogger } from '@/lib/validation/validation-logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = `analytics_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  try {
    console.log(`📊 [Analytics API] Validation analytics requested (${correlationId})`);

    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters = {
      page_id: searchParams.get('page_id') || undefined,
      widget_id: searchParams.get('widget_id') || undefined,
      validation_type: searchParams.get('validation_type') || undefined,
      status: searchParams.get('status') || undefined,
      hours: parseInt(searchParams.get('hours') || '24'),
      limit: parseInt(searchParams.get('limit') || '100')
    };

    console.log(`🔍 [Analytics API] Filters applied:`, filters);

    // Get validation logs with drill-down data
    const validationData = await validationLogger.getValidationLogs(filters);

    // Get detailed analytics if specific page requested
    let detailedAnalytics = null;
    if (filters.page_id) {
      detailedAnalytics = await phase1Pipeline.getValidationAnalytics(
        filters.page_id,
        filters.widget_id,
        filters.hours
      );
    }

    // Build comprehensive analytics response
    const analyticsResponse = {
      timestamp: new Date().toISOString(),
      correlation_id: correlationId,
      filters: filters,

      // Summary Statistics
      summary: {
        ...validationData.performance_summary,
        success_rate_percentage: validationData.performance_summary.total_validations > 0
          ? Math.round((validationData.performance_summary.passed_validations / validationData.performance_summary.total_validations) * 100)
          : 0
      },

      // Cross-Page Analysis
      cross_page_analysis: {
        ...validationData.cross_page_analysis,
        consistency_issues_rate: validationData.performance_summary.total_validations > 0
          ? validationData.cross_page_analysis.consistency_violations / validationData.performance_summary.total_validations
          : 0,
        deduplication_conflict_rate: validationData.performance_summary.total_validations > 0
          ? validationData.cross_page_analysis.deduplication_conflicts / validationData.performance_summary.total_validations
          : 0
      },

      // Page Validation Status
      page_status: validationData.page_status,

      // Validation Logs (for drill-down)
      validation_logs: validationData.validation_logs.map(log => ({
        ...log,
        // Add human-readable timestamp
        formatted_timestamp: new Date(log.timestamp || Date.now()).toLocaleString(),
        // Add status indicators for UI
        status_indicator: getStatusIndicator(log.status),
        // Add confidence level
        confidence_level: getConfidenceLevel(log.confidence_score)
      })),

      // Detailed Analytics (if specific page requested)
      detailed_analytics: detailedAnalytics,

      // Performance Breakdown by Validation Type
      validation_type_performance: analyzeValidationTypePerformance(validationData.validation_logs),

      // Recent Activity Timeline
      recent_activity: createRecentActivityTimeline(validationData.validation_logs, 24),

      // Error Analysis
      error_analysis: analyzeErrors(validationData.validation_logs),

      // API Metadata
      api_metadata: {
        correlation_id: correlationId,
        request_duration_ms: Date.now() - startTime,
        data_freshness: 'real-time',
        cache_status: 'no-cache'
      }
    };

    console.log(`✅ [Analytics API] Analytics completed (${correlationId}) - ${validationData.validation_logs.length} logs analyzed in ${Date.now() - startTime}ms`);

    return NextResponse.json(analyticsResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
        'X-Total-Records': validationData.validation_logs.length.toString(),
        'X-Success-Rate': analyticsResponse.summary.success_rate_percentage.toString(),
        // No caching for real-time analytics
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error(`❌ [Analytics API] Analytics request failed (${correlationId}):`, error);

    const errorResponse = {
      timestamp: new Date().toISOString(),
      correlation_id: correlationId,
      error: 'Analytics request failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      api_metadata: {
        correlation_id: correlationId,
        request_duration_ms: Date.now() - startTime
      }
    };

    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'X-Correlation-ID': correlationId
      }
    });
  }
}

export async function POST(request: NextRequest) {
  // Handle advanced analytics queries with complex filters
  const startTime = Date.now();
  const correlationId = `analytics_post_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  try {
    const body = await request.json();
    const {
      page_ids = [],
      widget_ids = [],
      validation_types = [],
      date_range = { hours: 24 },
      group_by = 'page_id',
      include_cross_page_analysis = true
    } = body;

    console.log(`📊 [Analytics API] Advanced analytics requested (${correlationId}):`, {
      page_ids: page_ids.length,
      widget_ids: widget_ids.length,
      validation_types: validation_types.length,
      group_by
    });

    // Build advanced filters
    const results = [];

    // If specific pages requested, get data for each
    if (page_ids.length > 0) {
      for (const pageId of page_ids) {
        const pageData = await validationLogger.getValidationLogs({
          page_id: pageId,
          hours: date_range.hours,
          limit: 500
        });

        results.push({
          page_id: pageId,
          data: pageData
        });
      }
    } else {
      // Get all data
      const allData = await validationLogger.getValidationLogs({
        hours: date_range.hours,
        limit: 1000
      });
      results.push({
        page_id: 'all',
        data: allData
      });
    }

    // Aggregate and analyze results
    const aggregatedResponse = {
      timestamp: new Date().toISOString(),
      correlation_id: correlationId,
      query: body,

      // Aggregated Summary
      aggregated_summary: aggregateResults(results),

      // Per-Page Results
      page_results: results.map(result => ({
        page_id: result.page_id,
        summary: result.data.performance_summary,
        cross_page_analysis: result.data.cross_page_analysis,
        validation_count: result.data.validation_logs.length
      })),

      // Cross-Page Comparison (if multiple pages)
      cross_page_comparison: page_ids.length > 1 ? createCrossPageComparison(results) : null,

      // Trend Analysis
      trend_analysis: createTrendAnalysis(results),

      // API Metadata
      api_metadata: {
        correlation_id: correlationId,
        request_duration_ms: Date.now() - startTime,
        processed_pages: results.length,
        total_records: results.reduce((sum, r) => sum + r.data.validation_logs.length, 0)
      }
    };

    console.log(`✅ [Analytics API] Advanced analytics completed (${correlationId}) - ${results.length} pages processed in ${Date.now() - startTime}ms`);

    return NextResponse.json(aggregatedResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
        'X-Processed-Pages': results.length.toString()
      }
    });

  } catch (error) {
    console.error(`❌ [Analytics API] Advanced analytics failed (${correlationId}):`, error);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      correlation_id: correlationId,
      error: 'Advanced analytics failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Utility Functions

function getStatusIndicator(status: string): string {
  const indicators = {
    'passed': '🟢',
    'failed': '🔴',
    'warning': '🟡',
    'pending': '🔵'
  };
  return indicators[status] || '⚪';
}

function getConfidenceLevel(score: number): string {
  if (score >= 95) return 'High';
  if (score >= 85) return 'Good';
  if (score >= 70) return 'Fair';
  return 'Low';
}

function analyzeValidationTypePerformance(logs: any[]): any {
  const performance: any = {};

  const validationTypes = ['opal_mapping', 'claude_schema', 'deduplication', 'cross_page_consistency'];

  validationTypes.forEach(type => {
    const typeLogs = logs.filter(log => log.validation_type === type);
    const passed = typeLogs.filter(log => log.status === 'passed').length;

    performance[type] = {
      total: typeLogs.length,
      passed: passed,
      failed: typeLogs.length - passed,
      success_rate: typeLogs.length > 0 ? passed / typeLogs.length : 0,
      avg_confidence: typeLogs.length > 0
        ? typeLogs.reduce((sum, log) => sum + (log.confidence_score || 0), 0) / typeLogs.length
        : 0
    };
  });

  return performance;
}

function createRecentActivityTimeline(logs: any[], hours: number): any[] {
  const timeline: any[] = [];
  const hoursToShow = Math.min(hours, 24);

  for (let i = 0; i < hoursToShow; i++) {
    const hourStart = new Date(Date.now() - (i * 60 * 60 * 1000));
    const hourEnd = new Date(Date.now() - ((i - 1) * 60 * 60 * 1000));

    const hourLogs = logs.filter(log => {
      const logTime = new Date(log.timestamp || Date.now());
      return logTime >= hourStart && logTime < hourEnd;
    });

    timeline.unshift({
      hour: hourStart.toISOString().substring(11, 16),
      timestamp: hourStart.toISOString(),
      total_validations: hourLogs.length,
      passed: hourLogs.filter(log => log.status === 'passed').length,
      failed: hourLogs.filter(log => log.status === 'failed').length,
      avg_confidence: hourLogs.length > 0
        ? hourLogs.reduce((sum, log) => sum + (log.confidence_score || 0), 0) / hourLogs.length
        : 0
    });
  }

  return timeline;
}

function analyzeErrors(logs: any[]): any {
  const errorLogs = logs.filter(log => log.status === 'failed');
  const errorTypes: any = {};

  errorLogs.forEach(log => {
    const errorType = log.error_info?.error_code || 'unknown_error';
    if (!errorTypes[errorType]) {
      errorTypes[errorType] = {
        count: 0,
        pages: new Set(),
        latest_occurrence: null
      };
    }
    errorTypes[errorType].count++;
    errorTypes[errorType].pages.add(log.page_id);

    if (!errorTypes[errorType].latest_occurrence || log.timestamp > errorTypes[errorType].latest_occurrence) {
      errorTypes[errorType].latest_occurrence = log.timestamp;
    }
  });

  return Object.entries(errorTypes).map(([type, info]: [string, any]) => ({
    error_type: type,
    count: info.count,
    affected_pages: Array.from(info.pages),
    latest_occurrence: info.latest_occurrence
  })).sort((a, b) => b.count - a.count);
}

function aggregateResults(results: any[]): any {
  const totals = {
    total_validations: 0,
    passed_validations: 0,
    failed_validations: 0,
    consistency_violations: 0,
    deduplication_conflicts: 0
  };

  results.forEach(result => {
    const summary = result.data.performance_summary;
    const crossPage = result.data.cross_page_analysis;

    totals.total_validations += summary.total_validations;
    totals.passed_validations += summary.passed_validations;
    totals.failed_validations += summary.failed_validations;
    totals.consistency_violations += crossPage.consistency_violations;
    totals.deduplication_conflicts += crossPage.deduplication_conflicts;
  });

  return {
    ...totals,
    overall_success_rate: totals.total_validations > 0
      ? totals.passed_validations / totals.total_validations
      : 0,
    pages_analyzed: results.length
  };
}

function createCrossPageComparison(results: any[]): any {
  return results.map(result => ({
    page_id: result.page_id,
    success_rate: result.data.performance_summary.total_validations > 0
      ? result.data.performance_summary.passed_validations / result.data.performance_summary.total_validations
      : 0,
    avg_confidence: result.data.performance_summary.average_confidence_score,
    consistency_violations: result.data.cross_page_analysis.consistency_violations,
    deduplication_conflicts: result.data.cross_page_analysis.deduplication_conflicts
  })).sort((a, b) => b.success_rate - a.success_rate);
}

function createTrendAnalysis(results: any[]): any {
  // Basic trend analysis - could be enhanced with more sophisticated algorithms
  const allLogs = results.flatMap(r => r.data.validation_logs);

  if (allLogs.length < 2) {
    return { trend: 'insufficient_data' };
  }

  const recentHalf = allLogs.slice(0, Math.floor(allLogs.length / 2));
  const olderHalf = allLogs.slice(Math.floor(allLogs.length / 2));

  const recentSuccess = recentHalf.filter(log => log.status === 'passed').length / recentHalf.length;
  const olderSuccess = olderHalf.filter(log => log.status === 'passed').length / olderHalf.length;

  const trend = recentSuccess > olderSuccess ? 'improving' :
                recentSuccess < olderSuccess ? 'declining' : 'stable';

  return {
    trend,
    recent_success_rate: recentSuccess,
    previous_success_rate: olderSuccess,
    change_percentage: ((recentSuccess - olderSuccess) * 100).toFixed(2)
  };
}